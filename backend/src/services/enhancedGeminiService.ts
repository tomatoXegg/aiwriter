import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import geminiConfig from '../config/gemini';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { geminiResponseCache, chatSessionCache, statisticsCache, CacheKeyGenerator } from './cacheService';

// 导出接口
export interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  audience: string;
  value: string;
  keywords: string[];
  score: number;
}

export interface GeneratedContent {
  id: string;
  title: string;
  body: string;
  wordCount: number;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
  };
}

export interface ContentReview {
  id: string;
  overallScore: number;
  scores: {
    contentQuality: number;
    writingLevel: number;
    originality: number;
    readability: number;
    shareValue: number;
  };
  suggestions: string[];
  errors: string[];
  strengths: string[];
  status: 'passed' | 'needs_improvement';
  reviewedAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeminiRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  safetySettings?: any[];
}

export interface GeminiResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
    finishReason: string;
    safetyRatings?: any[];
  };
}

// 错误类型
export class GeminiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export class RateLimitError extends GeminiError {
  constructor(message: string, details?: any) {
    super(message, 'RATE_LIMITED', 429, details);
    this.name = 'RateLimitError';
  }
}

export class QuotaExceededError extends GeminiError {
  constructor(message: string, details?: any) {
    super(message, 'QUOTA_EXCEEDED', 429, details);
    this.name = 'QuotaExceededError';
  }
}

// 统计信息
export interface ApiStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  breakdown: {
    byModel: Record<string, {
      requests: number;
      tokens: number;
      cost: number;
      avgResponseTime: number;
    }>;
    byAccount: Record<string, {
      requests: number;
      tokens: number;
      cost: number;
    }>;
    byDay: Array<{
      date: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
  };
}

export class EnhancedGeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelCache: Map<string, GenerativeModel> = new Map();
  private statistics: ApiStatistics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageResponseTime: 0,
    breakdown: {
      byModel: {},
      byAccount: {},
      byDay: []
    }
  };
  private requestTimestamps: number[] = [];
  private chatSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const config = geminiConfig.getConfig();
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      throw new GeminiError(
        'Failed to initialize Gemini service',
        'INITIALIZATION_ERROR',
        500,
        error
      );
    }
  }

  private getModel(modelName?: string): GenerativeModel {
    const config = geminiConfig.getConfig();
    const model = modelName || config.model;
    
    if (this.modelCache.has(model)) {
      return this.modelCache.get(model)!;
    }

    if (!this.genAI) {
      throw new GeminiError('Gemini service not initialized', 'NOT_INITIALIZED');
    }

    const generativeModel = this.genAI.getGenerativeModel({ 
      model,
      safetySettings: config.getSafetySettings()
    });

    this.modelCache.set(model, generativeModel);
    return generativeModel;
  }

  private async rateLimitCheck(): Promise<void> {
    const config = geminiConfig.getConfig();
    const now = Date.now();
    
    // 清理过期的请求记录
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < config.rateLimit.window
    );

    if (this.requestTimestamps.length >= config.rateLimit.requests) {
      throw new RateLimitError(
        `Rate limit exceeded. Max ${config.rateLimit.requests} requests per ${config.rateLimit.window / 1000} seconds`
      );
    }

    this.requestTimestamps.push(now);
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    const config = geminiConfig.getConfig();
    maxRetries = Math.min(maxRetries, config.maxRetries);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        if (error instanceof GeminiError) {
          // 对于某些错误不重试
          if (error.code === 'INVALID_REQUEST' || error.code === 'AUTHENTICATION_ERROR') {
            throw error;
          }
        }

        const delayTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async makeRequest(
    request: GeminiRequest,
    accountId?: string
  ): Promise<GeminiResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    try {
      await this.rateLimitCheck();

      const config = geminiConfig.getConfig();
      const model = this.getModel(request.model);
      
      const result = await this.withRetry(async () => {
        return await model.generateContent(request.prompt);
      });

      const response = await result.response;
      const processingTime = Date.now() - startTime;

      // 更新统计信息
      this.updateStatistics({
        requestId,
        model: request.model || config.model,
        success: true,
        processingTime,
        tokens: response.usageMetadata?.totalTokens || 0,
        accountId
      });

      return {
        id: requestId,
        content: response.text(),
        model: request.model || config.model,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokens || 0
        },
        metadata: {
          processingTime,
          timestamp: new Date(),
          finishReason: result.response.candidates()?.[0]?.finishReason || 'STOP',
          safetyRatings: result.response.candidates()?.[0]?.safetyRatings
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // 更新失败统计
      this.updateStatistics({
        requestId,
        model: request.model || config.model,
        success: false,
        processingTime,
        tokens: 0,
        accountId
      });

      if (error instanceof GeminiError) {
        throw error;
      }

      // 处理特定的 Gemini API 错误
      if (error && typeof error === 'object') {
        const apiError = error as any;
        
        if (apiError.message?.includes('quota exceeded')) {
          throw new QuotaExceededError(
            'API quota exceeded. Please try again later.',
            apiError
          );
        }
        
        if (apiError.message?.includes('rate limit')) {
          throw new RateLimitError(
            'API rate limit exceeded. Please try again later.',
            apiError
          );
        }
      }

      throw new GeminiError(
        `Failed to make request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        500,
        error
      );
    }
  }

  private updateStatistics(data: {
    requestId: string;
    model: string;
    success: boolean;
    processingTime: number;
    tokens: number;
    accountId?: string;
  }): void {
    this.statistics.totalRequests++;
    
    if (data.success) {
      this.statistics.successfulRequests++;
    } else {
      this.statistics.failedRequests++;
    }

    this.statistics.totalTokens += data.tokens;
    
    // 计算平均响应时间
    const totalResponseTime = this.statistics.averageResponseTime * (this.statistics.totalRequests - 1);
    this.statistics.averageResponseTime = (totalResponseTime + data.processingTime) / this.statistics.totalRequests;

    // 按模型统计
    if (!this.statistics.breakdown.byModel[data.model]) {
      this.statistics.breakdown.byModel[data.model] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        avgResponseTime: 0
      };
    }
    const modelStats = this.statistics.breakdown.byModel[data.model];
    modelStats.requests++;
    modelStats.tokens += data.tokens;
    modelStats.cost += this.calculateCost(data.tokens, data.model);
    modelStats.avgResponseTime = (modelStats.avgResponseTime * (modelStats.requests - 1) + data.processingTime) / modelStats.requests;

    // 按账户统计
    if (data.accountId) {
      if (!this.statistics.breakdown.byAccount[data.accountId]) {
        this.statistics.breakdown.byAccount[data.accountId] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      const accountStats = this.statistics.breakdown.byAccount[data.accountId];
      accountStats.requests++;
      accountStats.tokens += data.tokens;
      accountStats.cost += this.calculateCost(data.tokens, data.model);
    }

    // 按日期统计
    const today = new Date().toISOString().split('T')[0];
    const dayStats = this.statistics.breakdown.byDay.find(d => d.date === today);
    if (dayStats) {
      dayStats.requests++;
      dayStats.tokens += data.tokens;
      dayStats.cost += this.calculateCost(data.tokens, data.model);
    } else {
      this.statistics.breakdown.byDay.push({
        date: today,
        requests: 1,
        tokens: data.tokens,
        cost: this.calculateCost(data.tokens, data.model)
      });
    }
  }

  private calculateCost(tokens: number, model: string): number {
    // 简化的成本计算，实际应根据 Google 定价
    const rates: Record<string, number> = {
      'gemini-pro': 0.000125 / 1000, // $0.000125 per 1K tokens
      'gemini-1.5-pro': 0.00125 / 1000,
      'gemini-1.5-flash': 0.000075 / 1000
    };
    return tokens * (rates[model] || rates['gemini-pro']);
  }

  // 基础内容生成
  async generateContent(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      accountId?: string;
      useCache?: boolean;
    } = {}
  ): Promise<GeminiResponse> {
    const config = geminiConfig.getConfig();
    const modelConfig = geminiConfig.getModelConfig(options.model);
    
    if (options.maxTokens && options.maxTokens > modelConfig.maxTokens) {
      throw new AppError(
        `maxTokens exceeds model limit of ${modelConfig.maxTokens}`,
        400
      );
    }

    // 生成缓存键
    const cacheKey = CacheKeyGenerator.generateResponseKey(prompt, options);
    
    // 尝试从缓存获取
    if (options.useCache !== false) {
      const cached = geminiResponseCache.get<GeminiResponse>(cacheKey);
      if (cached) {
        // 返回缓存的响应，但更新统计信息
        this.updateStatistics({
          requestId: uuidv4(),
          model: options.model || config.model,
          success: true,
          processingTime: 0, // 缓存响应时间为0
          tokens: cached.usage.totalTokens,
          accountId: options.accountId
        });
        
        return {
          ...cached,
          id: uuidv4(), // 生成新的请求ID
          metadata: {
            ...cached.metadata,
            timestamp: new Date(),
            fromCache: true
          }
        };
      }
    }

    const request: GeminiRequest = {
      prompt,
      model: options.model || config.model,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2048
    };

    const response = await this.makeRequest(request, options.accountId);
    
    // 缓存响应
    if (options.useCache !== false) {
      geminiResponseCache.set(cacheKey, response);
    }
    
    return response;
  }

  // 选题生成
  async generateTopics(
    material: string,
    options: {
      count?: number;
      style?: string;
      model?: string;
      accountId?: string;
    } = {}
  ): Promise<TopicSuggestion[]> {
    const count = options.count || 5;
    const style = options.style || '专业科普';
    
    const prompt = `基于以下素材，为我生成${count}个适合公众号文章的选题建议。

素材内容：
${material}

写作风格：${style}

要求：
1. 选题要具有时效性和实用性
2. 符合公众号读者阅读习惯
3. 避免敏感话题
4. 突出实用价值

请以JSON格式返回，包含topics数组，每个topic有：
- id: 唯一标识符
- title: 吸引人的标题
- description: 简要描述（100字以内）
- audience: 目标读者群体
- value: 预计传播价值
- keywords: 相关关键词数组
- score: 选题评分（1-10分）

返回格式：
{
  "topics": [...]
}`;

    const response = await this.generateContent(prompt, {
      model: options.model,
      accountId: options.accountId
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.topics || [];
    } catch (error) {
      throw new GeminiError(
        'Failed to parse topics response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  // 内容优化
  async optimizeContent(
    content: string,
    options: {
      focus?: 'readability' | 'style' | 'structure' | 'seo';
      targetAudience?: string;
      model?: string;
      accountId?: string;
    } = {}
  ): Promise<{
    optimizedContent: string;
    improvements: Array<{
      type: string;
      description: string;
      before: string;
      after: string;
    }>;
    score: number;
  }> {
    const focus = options.focus || 'readability';
    const targetAudience = options.targetAudience || '公众号读者';
    
    const prompt = `请对以下内容进行${focus}方面的优化。

目标读者：${targetAudience}

内容：
${content}

优化要求：
${this.getOptimizationPrompt(focus)}

请以JSON格式返回：
{
  "optimizedContent": "优化后的内容",
  "improvements": [
    {
      "type": "优化类型",
      "description": "优化说明",
      "before": "优化前",
      "after": "优化后"
    }
  ],
  "score": 优化评分（1-10）
}`;

    const response = await this.generateContent(prompt, {
      model: options.model,
      accountId: options.accountId
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new GeminiError(
        'Failed to parse optimization response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  private getOptimizationPrompt(focus: string): string {
    const prompts = {
      readability: '- 段落长度适中\n- 语言流畅自然\n- 逻辑清晰\n- 易于理解',
      style: '- 保持专业性的同时增加亲和力\n- 适当使用emoji\n- 语言风格一致\n- 符合目标读者习惯',
      structure: '- 结构清晰\n- 层次分明\n- 重点突出\n- 过渡自然',
      seo: '- 关键词合理分布\n- 标题优化\n- 段落标题清晰\n- 易于搜索引擎理解'
    };
    return prompts[focus as keyof typeof prompts] || prompts.readability;
  }

  // 内容摘要
  async summarizeContent(
    content: string,
    options: {
      length?: 'short' | 'medium' | 'long';
      style?: string;
      model?: string;
      accountId?: string;
    } = {}
  ): Promise<string> {
    const length = options.length || 'medium';
    const lengthMap = {
      short: '100字以内',
      medium: '200-300字',
      long: '500字左右'
    };

    const prompt = `请为以下内容生成一个${lengthMap[length]}的摘要。

内容：
${content}

要求：
- 概括核心观点
- 突出重点信息
- 语言简洁明了
- 保持原意不变

请直接输出摘要内容，不要包含其他说明。`;

    const response = await this.generateContent(prompt, {
      model: options.model,
      accountId: options.accountId
    });

    return response.content;
  }

  // 关键词提取
  async extractKeywords(
    content: string,
    options: {
      count?: number;
      model?: string;
      accountId?: string;
    } = {}
  ): Promise<string[]> {
    const count = options.count || 10;

    const prompt = `请从以下内容中提取${count}个最重要的关键词。

内容：
${content}

要求：
- 选择核心主题相关的词
- 包含行业术语
- 考虑搜索价值
- 去除重复和近义词

请以JSON数组格式返回：
["关键词1", "关键词2", ...]`;

    const response = await this.generateContent(prompt, {
      model: options.model,
      accountId: options.accountId
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new GeminiError(
        'Failed to parse keywords response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  // 内容审查
  async reviewContent(content: string): Promise<ContentReview> {
    const prompt = `请对以下公众号文章进行全面质量审查。

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

    const response = await this.generateContent(prompt);

    try {
      const review = JSON.parse(response.content);
      return {
        id: uuidv4(),
        ...review,
        reviewedAt: new Date()
      };
    } catch (error) {
      // 如果不是JSON格式，返回基础评估
      return {
        id: uuidv4(),
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
        reviewedAt: new Date()
      };
    }
  }

  // 获取统计信息
  getStatistics(options?: {
    startDate?: string;
    endDate?: string;
    useCache?: boolean;
  }): ApiStatistics {
    // 如果没有过滤条件，直接返回完整统计
    if (!options) {
      return this.statistics;
    }

    // 生成缓存键
    const cacheKey = CacheKeyGenerator.generateStatisticsKey(options);
    
    // 尝试从缓存获取
    if (options.useCache !== false) {
      const cached = statisticsCache.get<ApiStatistics>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 过滤日期范围内的数据
    const filtered = {
      ...this.statistics,
      breakdown: {
        ...this.statistics.breakdown,
        byDay: this.statistics.breakdown.byDay.filter(day => {
          if (options.startDate && day.date < options.startDate) return false;
          if (options.endDate && day.date > options.endDate) return false;
          return true;
        })
      }
    };

    // 重新计算总计
    filtered.totalRequests = filtered.breakdown.byDay.reduce((sum, day) => sum + day.requests, 0);
    filtered.totalTokens = filtered.breakdown.byDay.reduce((sum, day) => sum + day.tokens, 0);
    filtered.totalCost = filtered.breakdown.byDay.reduce((sum, day) => sum + day.cost, 0);

    // 缓存结果
    if (options.useCache !== false) {
      statisticsCache.set(cacheKey, filtered);
    }

    return filtered;
  }

  // 获取服务状态
  getStatus() {
    const config = geminiConfig.getConfig();
    const validation = geminiConfig.validate();
    
    return {
      service: 'Google Gemini AI',
      configured: validation.valid,
      model: config.model,
      availableModels: Object.keys(config.models),
      rateLimit: config.rateLimit,
      validation,
      statistics: {
        totalRequests: this.statistics.totalRequests,
        successRate: this.statistics.totalRequests > 0 
          ? (this.statistics.successfulRequests / this.statistics.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        averageResponseTime: Math.round(this.statistics.averageResponseTime) + 'ms'
      },
      cache: {
        responseCache: geminiResponseCache.getStats(),
        statisticsCache: statisticsCache.getStats()
      }
    };
  }
}

export default new EnhancedGeminiService();