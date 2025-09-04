import { 
  IAIService, 
  IServiceRegistry, 
  ILoadBalancer, 
  ICacheManager, 
  IMetricsCollector,
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
import { AIServiceFactory } from './AIServiceFactory';
import { ServiceInstance, ServiceRegistryConfig } from './types';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export class AIServiceManager extends EventEmitter implements IAIService {
  private services: Map<string, IAIService> = new Map();
  private registry: IServiceRegistry;
  private loadBalancer: ILoadBalancer;
  private cache: ICacheManager;
  private metrics: IMetricsCollector;
  private config: ServiceRegistryConfig;
  private initialized = false;

  constructor(
    registry: IServiceRegistry,
    loadBalancer: ILoadBalancer,
    cache: ICacheManager,
    metrics: IMetricsCollector,
    config: ServiceRegistryConfig
  ) {
    super();
    this.registry = registry;
    this.loadBalancer = loadBalancer;
    this.cache = cache;
    this.metrics = metrics;
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 初始化所有已注册的服务
      const services = this.registry.getAllServices();
      for (const service of services) {
        await service.initialize();
      }

      // 启动健康检查
      if (this.config.autoDiscovery) {
        this.startHealthCheck();
      }

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  get id(): string {
    return 'ai-service-manager';
  }

  get name(): string {
    return 'AI Service Manager';
  }

  get type(): string {
    return 'manager';
  }

  get config(): ServiceConfig {
    return {
      name: this.name,
      type: 'manager',
      model: 'manager',
      timeout: 30000,
      maxRetries: 3,
      enabled: true,
      rateLimit: {
        requests: 1000,
        window: 60000
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffFactor: 2,
        maxDelay: 10000
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        expectedException: ['timeout', 'rate_limit']
      }
    };
  }

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    return this.executeWithCacheAndMetrics(
      'generateText',
      request,
      async (service) => await service.generateText(request)
    );
  }

  async generateTopics(request: TopicGenerationRequest): Promise<TopicGenerationResponse> {
    return this.executeWithCacheAndMetrics(
      'generateTopics',
      request,
      async (service) => await service.generateTopics(request)
    );
  }

  async optimizeContent(request: ContentOptimizationRequest): Promise<ContentOptimizationResponse> {
    return this.executeWithCacheAndMetrics(
      'optimizeContent',
      request,
      async (service) => await service.optimizeContent(request)
    );
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Chat 通常不缓存，因为每次对话都是独特的
    return this.executeWithMetrics(
      'chat',
      request,
      async (service) => await service.chat(request)
    );
  }

  private async executeWithCacheAndMetrics<T>(
    operation: string,
    request: any,
    executor: (service: IAIService) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.cache.generateKey('ai-service', operation, request);

    // 尝试从缓存获取
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) {
      this.metrics.recordCacheHit(this.id, operation);
      return cached;
    }

    this.metrics.recordCacheMiss(this.id, operation);

    // 执行请求
    const result = await this.executeWithMetrics(operation, request, executor);

    // 缓存结果
    await this.cache.set(cacheKey, result, this.getCacheTTL(operation));

    return result;
  }

  private async executeWithMetrics<T>(
    operation: string,
    request: any,
    executor: (service: IAIService) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let selectedService: IAIService | undefined;
    let success = false;
    let result: T;
    let error: Error | undefined;

    try {
      // 选择服务
      selectedService = await this.loadBalancer.selectService(request);
      if (!selectedService) {
        throw new Error('No available AI services');
      }

      // 执行操作
      result = await executor(selectedService);
      success = true;

      // 记录指标
      const duration = Date.now() - startTime;
      this.metrics.recordRequest(
        selectedService.id,
        operation,
        duration,
        success,
        result && typeof result === 'object' && 'usage' in result ? result.usage : undefined
      );

      return result;
    } catch (err) {
      error = err as Error;
      success = false;

      // 记录错误指标
      const duration = Date.now() - startTime;
      this.metrics.recordRequest(selectedService?.id || 'unknown', operation, duration, success);
      this.metrics.recordError(selectedService?.id || 'unknown', operation, error);

      // 如果服务不可用，更新健康状态
      if (selectedService) {
        const health: HealthStatus = {
          status: 'unhealthy',
          lastCheck: new Date(),
          responseTime: duration,
          errorRate: 100,
          details: { error: error.message }
        };
        this.loadBalancer.updateServiceHealth(selectedService.id, health);
      }

      throw error;
    }
  }

  private getCacheTTL(operation: string): number {
    const ttls = {
      generateText: 1800, // 30分钟
      generateTopics: 3600, // 1小时
      optimizeContent: 1800, // 30分钟
      chat: 0 // 不缓存
    };
    return ttls[operation as keyof typeof ttls] || 1800;
  }

  async healthCheck(): Promise<HealthStatus> {
    const services = this.registry.getAllServices();
    const results = await Promise.allSettled(
      services.map(service => service.healthCheck())
    );

    const healthyCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 'healthy'
    ).length;

    const totalServices = services.length;
    const healthPercentage = totalServices > 0 ? (healthyCount / totalServices) * 100 : 0;

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (healthPercentage >= 80) {
      status = 'healthy';
    } else if (healthPercentage >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 100 - healthPercentage,
      details: {
        healthyServices: healthyCount,
        totalServices,
        healthPercentage: Math.round(healthPercentage * 100) / 100
      }
    };
  }

  async getMetrics(): Promise<ServiceMetrics> {
    return this.metrics.getMetrics();
  }

  async updateConfig(config: Partial<ServiceConfig>): Promise<void> {
    // 更新管理器配置
    Object.assign(this.config, config);
    
    // 通知所有服务更新配置
    for (const service of this.services.values()) {
      await service.updateConfig(config);
    }
  }

  async clearCache(pattern?: string): Promise<number> {
    return this.cache.clear(pattern);
  }

  async getCacheStats(): Promise<any> {
    return this.cache.getStats();
  }

  // 服务注册管理
  async registerService(config: ServiceConfig): Promise<string> {
    const serviceId = config.id || uuidv4();
    config.id = serviceId;

    // 创建服务实例
    const service = await this.createService(config);
    
    // 初始化服务
    await service.initialize();
    
    // 注册到注册中心
    await this.registry.register(service);
    
    // 缓存服务
    this.services.set(serviceId, service);
    
    this.emit('serviceRegistered', service);
    
    return serviceId;
  }

  async unregisterService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (service) {
      await this.registry.unregister(serviceId);
      this.services.delete(serviceId);
      this.emit('serviceUnregistered', service);
    }
  }

  private async createService(config: ServiceConfig): Promise<IAIService> {
    const factory = AIServiceFactory.getInstance();
    return factory.createService(config.type, config);
  }

  private startHealthCheck(): void {
    setInterval(async () => {
      const services = this.registry.getAllServices();
      
      for (const service of services) {
        try {
          const health = await service.healthCheck();
          this.loadBalancer.updateServiceHealth(service.id, health);
        } catch (error) {
          const unhealthyHealth: HealthStatus = {
            status: 'unhealthy',
            lastCheck: new Date(),
            responseTime: 0,
            errorRate: 100,
            details: { error: (error as Error).message }
          };
          this.loadBalancer.updateServiceHealth(service.id, unhealthyHealth);
        }
      }
    }, this.config.healthCheckInterval);
  }

  // 获取所有服务状态
  getServiceStatuses(): Array<{
    id: string;
    name: string;
    type: string;
    status: HealthStatus;
    metrics: ServiceMetrics;
  }> {
    return Array.from(this.services.values()).map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      status: service['health'], // 假设服务有health属性
      metrics: service['metrics'] // 假设服务有metrics属性
    }));
  }
}