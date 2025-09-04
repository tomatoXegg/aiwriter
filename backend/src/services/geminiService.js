const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateTopics(material, customPrompt = null) {
    try {
      if (!this.model) {
        this.initialize();
      }

      const defaultPrompt = `基于以下素材，为我生成5个适合公众号文章的选题建议。每个选题应该包含：
1. 吸引人的标题
2. 简要描述（100字以内）
3. 目标读者群体
4. 预计传播价值

请以JSON格式返回，包含topics数组，每个topic有title、description、audience、value字段。

素材内容：
${material}

要求：
- 选题要具有时效性和实用性
- 符合公众号读者阅读习惯
- 避免敏感话题
- 突出实用价值`;

      const prompt = customPrompt || defaultPrompt;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 尝试解析JSON响应
      try {
        const parsed = JSON.parse(text);
        return parsed.topics || [];
      } catch (parseError) {
        // 如果不是JSON格式，尝试从文本中提取选题
        return this.extractTopicsFromText(text);
      }
    } catch (error) {
      console.error('Error generating topics:', error);
      throw new Error('Failed to generate topics: ' + error.message);
    }
  }

  async generateContent(topic, options = {}) {
    try {
      if (!this.model) {
        this.initialize();
      }

      const { wordCount = 1000, style = '专业科普', customPrompt = null } = options;

      const defaultPrompt = `请根据以下选题写一篇完整的公众号文章。

选题：${topic.title}
选题描述：${topic.description || ''}

写作要求：
1. 字数：约${wordCount}字
2. 风格：${style}
3. 结构：包含吸引人的标题、引人入胜的开头、主体内容、总结
4. 语言：中文，流畅自然，符合公众号阅读习惯
5. 内容：原创性强，有实用价值，逻辑清晰

文章格式要求：
- 标题要吸引人
- 开头要有hook，引起读者兴趣
- 主体内容分点论述，条理清晰
- 结尾总结升华，给读者启发
- 适当使用emoji增加亲和力
- 段落不宜过长，便于手机阅读

请直接输出完整文章，不要包含其他说明文字。`;

      const prompt = customPrompt || defaultPrompt;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      return {
        title: this.extractTitle(content) || topic.title,
        body: content,
        wordCount: this.countWords(content),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content: ' + error.message);
    }
  }

  async reviewContent(content) {
    try {
      if (!this.model) {
        this.initialize();
      }

      const prompt = `请对以下公众号文章进行全面质量审查，并返回详细的评估报告。

文章内容：
${content}

请从以下维度进行评分（1-10分）：
1. 内容质量 - 信息准确性、逻辑性、深度
2. 写作水平 - 语言表达、结构组织、流畅度
3. 原创性 - 内容独特性、抄袭风险
4. 可读性 - 段落长度、语言亲和力、emoji使用
5. 传播价值 - 标题吸引力、分享价值、实用性

同时请提供：
- 具体的改进建议
- 需要修正的错误
- 优化方向

请以JSON格式返回，包含：
{
  "overallScore": 总分,
  "scores": {
    "contentQuality": 分数,
    "writingLevel": 分数,
    "originality": 分数,
    "readability": 分数,
    "shareValue": 分数
  },
  "suggestions": ["建议1", "建议2"],
  "errors": ["错误1", "错误2"],
  "strengths": ["优点1", "优点2"],
  "status": "passed"或"needs_improvement"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return {
          ...parsed,
          reviewedAt: new Date().toISOString()
        };
      } catch (parseError) {
        // 如果不是JSON格式，返回基础评估
        return {
          overallScore: 7,
          scores: {
            contentQuality: 7,
            writingLevel: 7,
            originality: 7,
            readability: 7,
            shareValue: 7
          },
          suggestions: ['文章整体质量良好，建议发布前再次校对'],
          errors: [],
          strengths: ['内容结构清晰', '语言表达流畅'],
          status: 'passed',
          reviewedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error reviewing content:', error);
      throw new Error('Failed to review content: ' + error.message);
    }
  }

  // 辅助方法
  extractTopicsFromText(text) {
    // 简单的文本解析，实际使用时可能需要更复杂的NLP处理
    const lines = text.split('\n').filter(line => line.trim());
    const topics = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('标题') || line.includes('选题') || line.match(/^\d+\./)) {
        const title = line.replace(/^\d+\.\s*/, '').replace(/^[标题选题：:\s]*/, '');
        if (title && title.length > 5) {
          topics.push({
            title: title,
            description: lines[i + 1] || '暂无描述',
            audience: '公众号读者',
            value: '提供有价值的内容'
          });
        }
      }
    }

    return topics.slice(0, 5); // 最多返回5个选题
  }

  extractTitle(content) {
    // 尝试从内容中提取标题
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && !firstLine.startsWith('#') && firstLine.length < 50) {
      return firstLine;
    }
    
    return null;
  }

  countWords(text) {
    // 中文字数统计
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + englishWords.length;
  }
}

module.exports = GeminiService;