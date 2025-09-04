import { 
  IAIService, 
  TextGenerationRequest,
  TextGenerationResponse,
  TopicGenerationRequest,
  TopicGenerationResponse,
  ContentOptimizationRequest,
  ContentOptimizationResponse,
  ChatRequest,
  ChatResponse,
  ServiceConfig,
  ServiceMetrics,
  HealthStatus
} from './interfaces';
import { ServiceConfig as GeminiServiceConfig } from './types';
import EnhancedGeminiService from '../enhancedGeminiService';
import { CircuitBreaker } from './circuitBreaker';
import { EventEmitter } from 'events';

export class GeminiServiceAdapter extends EventEmitter implements IAIService {
  readonly id: string;
  readonly name: string;
  readonly type: string = 'gemini';
  readonly config: ServiceConfig;
  
  private service: EnhancedGeminiService;
  private circuitBreaker: CircuitBreaker;
  private metrics: ServiceMetrics;
  private health: HealthStatus;
  private initialized = false;

  constructor(config: ServiceConfig) {
    super();
    this.id = config.id || `gemini-${Date.now()}`;
    this.name = config.name;
    this.config = config;
    
    this.service = new EnhancedGeminiService();
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.metrics = this.createEmptyMetrics();
    this.health = {
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 0
    };

    // 监听熔断器事件
    this.circuitBreaker.on('stateChange', (event) => {
      this.emit('circuitBreakerStateChange', event);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 验证配置
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid Gemini service config: ${validation.errors.join(', ')}`);
      }

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    return this.circuitBreaker.execute(async () => {
      const startTime = Date.now();
      
      try {
        const response = await this.service.generateContent(
          request.prompt,
          {
            model: request.model,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            accountId: request.userId,
            useCache: true
          }
        );

        const processingTime = Date.now() - startTime;
        this.updateMetrics({
          duration: processingTime,
          success: true,
          usage: response.usage,
          cost: this.calculateCost(response.usage.totalTokens, request.model)
        });

        return {
          id: response.id,
          content: response.content,
          model: response.model,
          usage: response.usage,
          metadata: {
            processingTime,
            timestamp: new Date(),
            finishReason: response.metadata.finishReason,
            cached: response.metadata.fromCache
          }
        };
      } catch (error) {
        const processingTime = Date.now() - startTime;
        this.updateMetrics({
          duration: processingTime,
          success: false
        });
        throw error;
      }
    });
  }

  async generateTopics(request: TopicGenerationRequest): Promise<TopicGenerationResponse> {
    return this.circuitBreaker.execute(async () => {
      const startTime = Date.now();
      
      try {
        const response = await this.service.generateTopics(
          request.material,
          {
            count: request.count,
            style: request.style,
            accountId: request.userId
          }
        );

        const processingTime = Date.now() - startTime;
        this.updateMetrics({
          duration: processingTime,
          success: true,
          usage: response.usage,
          cost: this.calculateCost(response.usage.totalTokens)
        });

        return {
          topics: response,
          model: response.model,
          usage: response.usage,
          metadata: {
            processingTime,
            timestamp: new Date()
          }
        };
      } catch (error) {
        const processingTime = Date.now() - startTime;
        this.updateMetrics({
          duration: processingTime,
          success: false
        });
        throw error;
      }
    });
  }

  async optimizeContent(request: ContentOptimizationRequest): Promise<ContentOptimizationResponse> {
    return this.circuitBreaker.execute(async () => {
      const startTime = Date.now();
      
      try {
        const response = await this.service.optimizeContent(
          request.content,
          {
            focus: request.focus,
            targetAudience: request.targetAudience,
            accountId: request.userId
          }
        );

        const processingTime = Date.now() - startTime;
        this.updateMetrics({
          duration: processingTime,
          success: true,
          usage: response.usage,
          cost: this.calculateCost(response.usage.totalTokens)
        });

        return response;
      } catch (error) {
        const processingTime = Date.now() - startTime;
        this.updateMetrics({
          duration: processingTime,
          success: false
        });
        throw error;
      }
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Chat功能在Gemini服务中暂未实现，需要添加
    throw new Error('Chat functionality not implemented for Gemini service');
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const status = this.service.getStatus();
      const isHealthy = status.configured && 
                      (status.statistics?.successRate !== '0%' || this.metrics.requestCount === 0);

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: parseInt(status.statistics?.averageResponseTime || '0'),
        errorRate: this.metrics.requestCount > 0 
          ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
          : 0,
        details: {
          model: status.model,
          availableModels: status.availableModels,
          statistics: status.statistics
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorRate: 100,
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  async getMetrics(): Promise<ServiceMetrics> {
    // 获取最新的统计数据
    const serviceStats = this.service.getStatistics();
    
    // 更新指标
    this.metrics = {
      ...this.metrics,
      totalRequests: serviceStats.totalRequests,
      successCount: serviceStats.successfulRequests,
      errorCount: serviceStats.failedRequests,
      totalTokens: serviceStats.totalTokens,
      totalCost: serviceStats.totalCost,
      averageResponseTime: serviceStats.averageResponseTime,
      errorRate: serviceStats.totalRequests > 0 
        ? (serviceStats.failedRequests / serviceStats.totalRequests) * 100 
        : 0,
      availability: serviceStats.totalRequests > 0 
        ? ((serviceStats.totalRequests - serviceStats.failedRequests) / serviceStats.totalRequests) * 100 
        : 100,
      cacheHits: serviceStats.breakdown?.byModel[this.config.model]?.requests || 0,
      cacheMisses: 0 // 需要从缓存服务获取
    };

    return { ...this.metrics };
  }

  async updateConfig(config: Partial<ServiceConfig>): Promise<void> {
    Object.assign(this.config, config);
    
    // 如果熔断器配置改变，更新熔断器
    if (config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    }
    
    this.emit('configUpdated', config);
  }

  async clearCache(pattern?: string): Promise<number> {
    // 这里需要调用缓存服务的清除方法
    // 暂时返回0
    return 0;
  }

  async getCacheStats(): Promise<any> {
    // 这里需要调用缓存服务的统计方法
    // 暂时返回空对象
    return {};
  }

  private validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    if (!this.config.model) {
      errors.push('Model is required');
    }

    if (!this.config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (this.config.timeout && (this.config.timeout < 1000 || this.config.timeout > 60000)) {
      errors.push('Timeout must be between 1000 and 60000 ms');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private createEmptyMetrics(): ServiceMetrics {
    return {
      serviceId: this.id,
      timestamp: new Date(),
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0
      },
      cost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorRate: 0,
      availability: 100
    };
  }

  private updateMetrics(data: {
    duration: number;
    success: boolean;
    usage?: any;
    cost?: number;
  }): void {
    this.metrics.requestCount++;
    this.metrics.timestamp = new Date();

    if (data.success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    // 更新响应时间
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.requestCount - 1);
    this.metrics.averageResponseTime = (totalResponseTime + data.duration) / this.metrics.requestCount;

    // 更新token使用
    if (data.usage) {
      this.metrics.tokenUsage.prompt += data.usage.promptTokens || 0;
      this.metrics.tokenUsage.completion += data.usage.completionTokens || 0;
      this.metrics.tokenUsage.total += data.usage.totalTokens || 0;
    }

    // 更新成本
    if (data.cost) {
      this.metrics.totalCost += data.cost;
    }

    // 更新错误率和可用性
    this.metrics.errorRate = (this.metrics.errorCount / this.metrics.requestCount) * 100;
    this.metrics.availability = ((this.metrics.requestCount - this.metrics.errorCount) / this.metrics.requestCount) * 100;
  }

  private calculateCost(tokens: number, model?: string): number {
    // 简化的成本计算
    const rates: Record<string, number> = {
      'gemini-pro': 0.000125 / 1000,
      'gemini-1.5-pro': 0.00125 / 1000,
      'gemini-1.5-flash': 0.000075 / 1000
    };
    
    const modelKey = model || this.config.model;
    return tokens * (rates[modelKey] || rates['gemini-pro']);
  }
}