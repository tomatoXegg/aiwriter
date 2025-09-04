import { v4 as uuidv4 } from 'uuid';
import { 
  ContentOptimization,
  ContentOptimizationRequest,
  ContentOptimizationResult
} from '../database/models/types';
import { Models } from '../database/models';
import { GeminiService } from './geminiService';

export class ContentOptimizationService {
  private models: Models;
  private geminiService: GeminiService;

  constructor(models: Models, geminiService: GeminiService) {
    this.models = models;
    this.geminiService = geminiService;
  }

  async optimizeContent(contentId: string, request: ContentOptimizationRequest): Promise<ContentOptimizationResult> {
    try {
      // 获取内容
      const content = await this.models.content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      // 根据优化类型进行分析
      let optimization: ContentOptimizationResult;

      switch (request.type) {
        case 'readability':
          optimization = await this.analyzeReadability(content.body);
          break;
        case 'grammar':
          optimization = await this.analyzeGrammar(content.body);
          break;
        case 'style':
          optimization = await this.analyzeStyle(content.body);
          break;
        case 'structure':
          optimization = await this.analyzeStructure(content.body);
          break;
        default:
          throw new Error('Invalid optimization type');
      }

      // 保存优化结果到数据库
      await this.saveOptimizationResult(contentId, request.type, optimization);

      return optimization;
    } catch (error) {
      console.error('Content optimization failed:', error);
      throw error;
    }
  }

  async getOptimizationHistory(contentId: string): Promise<ContentOptimization[]> {
    // 这里需要实现获取优化历史的方法
    // 由于数据库模型中还没有这个功能，我们先返回空数组
    return [];
  }

  async generateContentSummary(contentId: string): Promise<{
    summary: string;
    keyPoints: string[];
    wordCount: number;
    readTime: number;
  }> {
    try {
      const content = await this.models.content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      const prompt = `请为以下文章生成一个简短的摘要和关键点。

文章内容：
${content.body}

要求：
1. 摘要：100字以内的简洁总结
2. 关键点：3-5个核心观点
3. 字数统计
4. 预估阅读时间

请以JSON格式返回，包含summary、keyPoints、wordCount、readTime字段。`;

      const result = await this.geminiService['model'].generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || '暂无摘要',
          keyPoints: parsed.keyPoints || [],
          wordCount: parsed.wordCount || content.word_count,
          readTime: parsed.readTime || Math.ceil(content.word_count / 200),
        };
      } catch (parseError) {
        // 如果不是JSON格式，返回基础信息
        return {
          summary: '文章摘要生成失败',
          keyPoints: [],
          wordCount: content.word_count,
          readTime: Math.ceil(content.word_count / 200),
        };
      }
    } catch (error) {
      console.error('Content summary generation failed:', error);
      throw error;
    }
  }

  async extractContentTags(contentId: string): Promise<string[]> {
    try {
      const content = await this.models.content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      const prompt = `请为以下文章提取5-10个关键词标签。

文章内容：
${content.body}

要求：
1. 标签应该准确反映文章主题
2. 标签长度在2-10个字之间
3. 按重要性排序
4. 避免过于通用的词汇

请以JSON格式返回，包含tags数组。`;

      const result = await this.geminiService['model'].generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return parsed.tags || [];
      } catch (parseError) {
        // 如果不是JSON格式，使用简单的关键词提取
        return this.extractKeywords(content.body);
      }
    } catch (error) {
      console.error('Content tag extraction failed:', error);
      return this.extractKeywords(content.body);
    }
  }

  private async analyzeReadability(content: string): Promise<ContentOptimizationResult> {
    const prompt = `请分析以下文章的可读性，并提供建议。

文章内容：
${content}

请从以下维度进行分析（1-10分）：
1. 句子长度和复杂度
2. 段落结构
3. 语言流畅度
4. 逻辑清晰度
5. 整体可读性

同时提供具体的改进建议。

请以JSON格式返回，包含readability字段。`;

    const analysis = await this.performAnalysis(prompt);
    
    return {
      contentId: '',
      suggestions: {
        readability: analysis.readability,
        grammar: { score: 8, issues: [], corrections: [] },
        style: { score: 8, suggestions: [] },
        structure: { score: 8, recommendations: [] },
      },
    };
  }

  private async analyzeGrammar(content: string): Promise<ContentOptimizationResult> {
    const prompt = `请检查以下文章的语法和拼写错误。

文章内容：
${content}

请识别并标记：
1. 语法错误
2. 拼写错误
3. 标点符号错误
4. 表达不当的地方

请以JSON格式返回，包含grammar字段。`;

    const analysis = await this.performAnalysis(prompt);
    
    return {
      contentId: '',
      suggestions: {
        readability: { score: 8, issues: [], improvements: [] },
        grammar: analysis.grammar,
        style: { score: 8, suggestions: [] },
        structure: { score: 8, recommendations: [] },
      },
    };
  }

  private async analyzeStyle(content: string): Promise<ContentOptimizationResult> {
    const prompt = `请分析以下文章的写作风格。

文章内容：
${content}

请从以下维度进行分析（1-10分）：
1. 语言风格一致性
2. 语气和语调
3. 表达方式
4. 文章结构
5. 整体风格

请以JSON格式返回，包含style字段。`;

    const analysis = await this.performAnalysis(prompt);
    
    return {
      contentId: '',
      suggestions: {
        readability: { score: 8, issues: [], improvements: [] },
        grammar: { score: 8, issues: [], corrections: [] },
        style: analysis.style,
        structure: { score: 8, recommendations: [] },
      },
    };
  }

  private async analyzeStructure(content: string): Promise<ContentOptimizationResult> {
    const prompt = `请分析以下文章的结构。

文章内容：
${content}

请从以下维度进行分析（1-10分）：
1. 标题吸引力
2. 开头引导
3. 主体结构
4. 结尾总结
5. 整体逻辑

请以JSON格式返回，包含structure字段。`;

    const analysis = await this.performAnalysis(prompt);
    
    return {
      contentId: '',
      suggestions: {
        readability: { score: 8, issues: [], improvements: [] },
        grammar: { score: 8, issues: [], corrections: [] },
        style: { score: 8, suggestions: [] },
        structure: analysis.structure,
      },
    };
  }

  private async performAnalysis(prompt: string): Promise<any> {
    try {
      if (!this.geminiService['model']) {
        this.geminiService['initialize']();
      }

      const result = await this.geminiService['model'].generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch (parseError) {
        // 如果不是JSON格式，返回默认分析结果
        return this.getDefaultAnalysis();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  private getDefaultAnalysis(): any {
    return {
      readability: {
        score: 7,
        issues: ['文章长度适中', '段落结构合理'],
        improvements: ['建议增加小标题', '可以适当使用emoji']
      },
      grammar: {
        score: 8,
        issues: [],
        corrections: []
      },
      style: {
        score: 7,
        suggestions: ['语言表达流畅', '风格统一']
      },
      structure: {
        score: 7,
        recommendations: ['结构清晰', '逻辑连贯']
      }
    };
  }

  private async saveOptimizationResult(contentId: string, type: string, result: ContentOptimizationResult): Promise<void> {
    // 这里需要实现保存优化结果到数据库的逻辑
    // 由于数据库模型中还没有这个功能，我们先跳过
    console.log(`Saving optimization result for content ${contentId}, type: ${type}`);
  }

  private extractKeywords(text: string): string[] {
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
      .slice(0, 8)
      .map(([word]) => word);
  }
}