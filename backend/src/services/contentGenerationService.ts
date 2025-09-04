import { v4 as uuidv4 } from 'uuid';
import { 
  ContentStyle, 
  ContentMetadata, 
  ContentWithStyle,
  GenerateContentRequest,
  GenerateCustomContentRequest,
  ContentGenerationResult
} from '../database/models/types';
import { Models } from '../database/models';
import { GeminiService } from './geminiService';

export interface ContentGenerationOptions {
  wordCount?: number;
  style?: ContentStyle;
  customPrompt?: string;
  temperature?: number;
}

export class ContentGenerationService {
  private geminiService: GeminiService;
  private models: Models;

  constructor(models: Models, geminiService: GeminiService) {
    this.models = models;
    this.geminiService = geminiService;
  }

  async generateContent(request: GenerateContentRequest): Promise<ContentGenerationResult> {
    try {
      // 获取选题信息
      const topic = await this.models.topic.findById(request.topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }

      // 创建生成任务
      const generation = await this.models.contentGeneration.createGeneration(request);

      // 异步开始生成过程
      this.performGeneration(generation.id, topic, request).catch(error => {
        console.error('Content generation failed:', error);
        this.models.contentGeneration.failGeneration(generation.id, error.message);
      });

      return {
        id: generation.id,
        status: 'processing',
        progress: 0,
        createdAt: generation.createdAt,
        estimatedTime: generation.estimatedTime,
      };
    } catch (error) {
      console.error('Failed to start content generation:', error);
      throw error;
    }
  }

  async generateCustomContent(request: GenerateCustomContentRequest): Promise<ContentGenerationResult> {
    try {
      // 创建生成任务（使用虚拟topicId）
      const generation = await this.models.contentGeneration.createGeneration({
        topicId: 'custom-' + uuidv4(),
        prompt: request.prompt,
        style: request.style,
      });

      // 异步开始生成过程
      this.performCustomGeneration(generation.id, request).catch(error => {
        console.error('Custom content generation failed:', error);
        this.models.contentGeneration.failGeneration(generation.id, error.message);
      });

      return {
        id: generation.id,
        status: 'processing',
        progress: 0,
        createdAt: generation.createdAt,
        estimatedTime: generation.estimatedTime,
      };
    } catch (error) {
      console.error('Failed to start custom content generation:', error);
      throw error;
    }
  }

  async getGenerationResult(generationId: string): Promise<ContentGenerationResult> {
    const generation = await this.models.contentGeneration.findById(generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }

    return {
      id: generation.id,
      status: generation.status,
      result: generation.result,
      error: generation.error,
      progress: generation.progress,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
    };
  }

  private async performGeneration(
    generationId: string, 
    topic: any, 
    request: GenerateContentRequest
  ): Promise<void> {
    try {
      // 更新状态为处理中
      await this.models.contentGeneration.updateStatus(generationId, 'processing', 10);

      // 构建生成提示
      const prompt = this.buildGenerationPrompt(topic, request);

      // 调用Gemini服务
      const generatedContent = await this.geminiService.generateContent(
        { title: topic.title, description: topic.description },
        {
          wordCount: this.getWordCountFromStyle(request.style),
          style: this.getStyleDescription(request.style),
          customPrompt: prompt,
        }
      );

      // 创建内容对象
      const content: ContentWithStyle = {
        id: uuidv4(),
        title: generatedContent.title,
        body: generatedContent.body,
        topic_id: topic.id,
        account_id: request.accountId,
        status: 'generated',
        prompt: request.prompt || '',
        style: request.style,
        metadata: this.generateMetadata(generatedContent.body, request.style),
        word_count: generatedContent.wordCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 保存到数据库
      await this.models.content.create({
        title: content.title,
        body: content.body,
        topic_id: content.topic_id,
        account_id: content.account_id,
        prompt: content.prompt,
      });

      // 更新生成任务状态
      await this.models.contentGeneration.completeGeneration(generationId, content);

      console.log(`Content generation completed: ${generationId}`);
    } catch (error) {
      console.error('Content generation failed:', error);
      await this.models.contentGeneration.failGeneration(generationId, error.message);
      throw error;
    }
  }

  private async performCustomGeneration(
    generationId: string, 
    request: GenerateCustomContentRequest
  ): Promise<void> {
    try {
      // 更新状态为处理中
      await this.models.contentGeneration.updateStatus(generationId, 'processing', 10);

      // 构建生成提示
      const prompt = this.buildCustomGenerationPrompt(request);

      // 调用Gemini服务
      const generatedContent = await this.geminiService.generateContent(
        { title: request.title, description: '' },
        {
          wordCount: this.getWordCountFromStyle(request.style),
          style: this.getStyleDescription(request.style),
          customPrompt: prompt,
        }
      );

      // 创建内容对象
      const content: ContentWithStyle = {
        id: uuidv4(),
        title: generatedContent.title,
        body: generatedContent.body,
        topic_id: null,
        account_id: request.accountId,
        status: 'generated',
        prompt: request.prompt,
        style: request.style,
        metadata: this.generateMetadata(generatedContent.body, request.style),
        word_count: generatedContent.wordCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 保存到数据库
      await this.models.content.create({
        title: content.title,
        body: content.body,
        topic_id: content.topic_id,
        account_id: content.account_id,
        prompt: content.prompt,
      });

      // 更新生成任务状态
      await this.models.contentGeneration.completeGeneration(generationId, content);

      console.log(`Custom content generation completed: ${generationId}`);
    } catch (error) {
      console.error('Custom content generation failed:', error);
      await this.models.contentGeneration.failGeneration(generationId, error.message);
      throw error;
    }
  }

  private buildGenerationPrompt(topic: any, request: GenerateContentRequest): string {
    const style = request.style;
    const wordCount = this.getWordCountFromStyle(style);
    
    let prompt = `请根据以下选题写一篇完整的公众号文章。

选题：${topic.title}
选题描述：${topic.description || ''}

写作要求：
1. 字数：约${wordCount}字
2. 风格：${this.getStyleDescription(style)}
3. 结构：包含吸引人的标题、引人入胜的开头、主体内容、总结
4. 语言：中文，流畅自然，符合公众号阅读习惯
5. 内容：原创性强，有实用价值，逻辑清晰`;

    if (request.prompt) {
      prompt += `\n\n特殊要求：${request.prompt}`;
    }

    prompt += `

文章格式要求：
- 标题要吸引人
- 开头要有hook，引起读者兴趣
- 主体内容分点论述，条理清晰
- 结尾总结升华，给读者启发
- 适当使用emoji增加亲和力
- 段落不宜过长，便于手机阅读

请直接输出完整文章，不要包含其他说明文字。`;

    return prompt;
  }

  private buildCustomGenerationPrompt(request: GenerateCustomContentRequest): string {
    const style = request.style;
    const wordCount = this.getWordCountFromStyle(style);
    
    let prompt = `请根据以下要求写一篇完整的公众号文章。

标题：${request.title}

写作要求：
1. 字数：约${wordCount}字
2. 风格：${this.getStyleDescription(style)}
3. 结构：包含吸引人的标题、引人入胜的开头、主体内容、总结
4. 语言：中文，流畅自然，符合公众号阅读习惯
5. 内容：原创性强，有实用价值，逻辑清晰`;

    if (request.prompt) {
      prompt += `\n\n具体要求：${request.prompt}`;
    }

    prompt += `

文章格式要求：
- 标题要吸引人
- 开头要有hook，引起读者兴趣
- 主体内容分点论述，条理清晰
- 结尾总结升华，给读者启发
- 适当使用emoji增加亲和力
- 段落不宜过长，便于手机阅读

请直接输出完整文章，不要包含其他说明文字。`;

    return prompt;
  }

  private getWordCountFromStyle(style?: ContentStyle): number {
    if (!style || !style.length) return 1500;
    
    switch (style.length) {
      case 'short': return 800;
      case 'medium': return 1500;
      case 'long': return 3000;
      default: return 1500;
    }
  }

  private getStyleDescription(style?: ContentStyle): string {
    if (!style) return '专业科普';
    
    let description = '';
    
    switch (style.tone) {
      case 'formal': description += '正式'; break;
      case 'casual': description += '轻松'; break;
      case 'professional': description += '专业'; break;
      case 'creative': description += '创意'; break;
      default: description += '专业'; break;
    }
    
    switch (style.format) {
      case 'article': description += '文章'; break;
      case 'blog': description += '博客'; break;
      case 'report': description += '报告'; break;
      case 'story': description += '故事'; break;
      default: description += '文章'; break;
    }
    
    return description;
  }

  private generateMetadata(body: string, style?: ContentStyle): ContentMetadata {
    const wordCount = this.countWords(body);
    const readTime = Math.ceil(wordCount / 200); // 假设每分钟阅读200字
    
    return {
      wordCount,
      readTime,
      language: 'zh-CN',
      tags: this.extractTags(body),
      category: this.categorizeContent(body),
    };
  }

  private countWords(text: string): number {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + englishWords.length;
  }

  private extractTags(text: string): string[] {
    // 简单的关键词提取
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    const words = text.match(/[\u4e00-\u9fff]+/g) || [];
    const wordFreq: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 1 && !commonWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private categorizeContent(text: string): string {
    const categories = {
      '技术': ['技术', '开发', '编程', '代码', '软件', '系统', '算法', '数据'],
      '生活': ['生活', '健康', '美食', '旅行', '时尚', '家庭', '情感', '关系'],
      '商业': ['商业', '管理', '营销', '销售', '市场', '品牌', '创业', '投资'],
      '教育': ['教育', '学习', '学校', '学生', '老师', '课程', '考试', '知识'],
      '娱乐': ['娱乐', '电影', '音乐', '游戏', '明星', '综艺', '体育', '艺术'],
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return '其他';
  }
}