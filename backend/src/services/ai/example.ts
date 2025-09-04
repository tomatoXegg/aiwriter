import {
  AIServiceManager,
  ServiceRegistry,
  LoadBalancerFactory,
  CacheManagerFactory,
  MetricsCollector,
  AIServiceFactory,
  ServiceConfig,
  LoadBalancerConfig,
  CacheConfig,
  ServiceRegistryConfig
} from './index';

// 示例：创建和配置AI服务管理器
export async function createAIServiceManager(): Promise<AIServiceManager> {
  // 1. 创建各个组件
  
  // 服务注册中心
  const registry = new ServiceRegistry();
  
  // 负载均衡器配置
  const loadBalancerConfig: LoadBalancerConfig = {
    algorithm: 'weighted',
    healthCheck: {
      enabled: true,
      interval: 30000, // 30秒
      timeout: 5000,
      healthyThreshold: 2,
      unhealthyThreshold: 3
    }
  };
  const loadBalancer = LoadBalancerFactory.create(loadBalancerConfig);
  
  // 缓存配置
  const cacheConfig: CacheConfig = {
    type: 'hybrid',
    ttl: 1800, // 30分钟
    maxSize: 10000,
    strategy: 'lru',
    compression: true,
    serialization: 'json',
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0,
      keyPrefix: 'aiwriter'
    }
  };
  const cache = CacheManagerFactory.create(cacheConfig);
  
  // 指标收集器
  const metrics = new MetricsCollector({
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7天
    aggregationInterval: 60000, // 1分钟
    maxRecords: 100000,
    enableAggregation: true
  });
  
  // 服务注册配置
  const registryConfig: ServiceRegistryConfig = {
    autoDiscovery: true,
    healthCheckInterval: 30000,
    serviceTimeout: 30000,
    metricsRetention: 7
  };
  
  // 2. 创建AI服务管理器
  const serviceManager = new AIServiceManager(
    registry,
    loadBalancer,
    cache,
    metrics,
    registryConfig
  );
  
  // 3. 注册服务
  await registerServices(serviceManager);
  
  // 4. 初始化
  await serviceManager.initialize();
  
  return serviceManager;
}

// 注册AI服务
async function registerServices(serviceManager: AIServiceManager): Promise<void> {
  const factory = AIServiceFactory.getInstance();
  
  // Gemini服务配置
  const geminiConfig: ServiceConfig = {
    name: 'Gemini Pro',
    type: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    timeout: 30000,
    maxRetries: 3,
    enabled: true,
    weight: 100,
    rateLimit: {
      requests: 60,
      window: 60000
    },
    retryPolicy: {
      maxAttempts: 3,
      backoffFactor: 2,
      maxDelay: 10000
    },
    circuitBreaker: {
      failureThreshold: 50,
      recoveryTimeout: 60000,
      expectedException: ['timeout', 'rate_limit', 'network_error']
    },
    cache: {
      enabled: true,
      ttl: 1800,
      maxSize: 1000
    }
  };
  
  // 注册Gemini服务
  try {
    const geminiServiceId = await serviceManager.registerService(geminiConfig);
    console.log(`Gemini service registered with ID: ${geminiServiceId}`);
  } catch (error) {
    console.error('Failed to register Gemini service:', error);
  }
  
  // 可以注册更多服务...
  // const openaiConfig: ServiceConfig = { ... };
  // await serviceManager.registerService(openaiConfig);
}

// 使用示例
export async function exampleUsage() {
  try {
    // 创建服务管理器
    const serviceManager = await createAIServiceManager();
    
    // 生成文本
    const textResponse = await serviceManager.generateText({
      prompt: '写一篇关于人工智能发展的文章',
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 1000,
      userId: 'user123'
    });
    
    console.log('Generated text:', textResponse.content.substring(0, 100) + '...');
    
    // 生成选题
    const topicResponse = await serviceManager.generateTopics({
      material: '人工智能技术正在改变世界',
      count: 5,
      style: '专业科普',
      userId: 'user123'
    });
    
    console.log('Generated topics:', topicResponse.topics.map(t => t.title));
    
    // 优化内容
    const optimizationResponse = await serviceManager.optimizeContent({
      content: '这是一篇关于AI的文章...',
      focus: 'readability',
      targetAudience: '普通读者',
      userId: 'user123'
    });
    
    console.log('Optimization score:', optimizationResponse.score);
    
    // 获取服务状态
    const health = await serviceManager.healthCheck();
    console.log('Service health:', health.status);
    
    // 获取指标
    const metrics = await serviceManager.getMetrics();
    console.log('Total requests:', metrics.requestCount);
    console.log('Average response time:', metrics.averageResponseTime + 'ms');
    console.log('Cache hit rate:', ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2) + '%');
    
  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// 导出配置模板
export const CONFIG_TEMPLATES = {
  development: {
    services: [
      {
        name: 'Gemini Pro Dev',
        type: 'gemini',
        model: 'gemini-pro',
        enabled: true,
        weight: 100
      }
    ],
    loadBalancer: {
      algorithm: 'round-robin' as const,
      healthCheck: {
        enabled: true,
        interval: 30000
      }
    },
    cache: {
      type: 'memory' as const,
      ttl: 1800
    }
  },
  
  production: {
    services: [
      {
        name: 'Gemini Pro Primary',
        type: 'gemini',
        model: 'gemini-pro',
        enabled: true,
        weight: 70
      },
      {
        name: 'Gemini Pro Backup',
        type: 'gemini',
        model: 'gemini-pro',
        enabled: true,
        weight: 30
      }
    ],
    loadBalancer: {
      algorithm: 'weighted' as const,
      healthCheck: {
        enabled: true,
        interval: 10000
      }
    },
    cache: {
      type: 'hybrid' as const,
      ttl: 3600,
      redis: {
        host: 'redis-cluster.example.com',
        port: 6379
      }
    }
  }
};