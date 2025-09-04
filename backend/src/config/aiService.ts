import { AIServiceManager } from './services/ai';
import { LoadBalancerFactory } from './services/ai';
import { CacheManagerFactory } from './services/ai';
import { MetricsCollector } from './services/ai';
import { ServiceRegistry } from './services/ai';

// AI服务配置
export const AI_SERVICE_CONFIG = {
  // 服务注册配置
  registry: {
    autoDiscovery: true,
    healthCheckInterval: 30000, // 30秒
    serviceTimeout: 30000,
    metricsRetention: 7 // 保留7天数据
  },

  // 负载均衡配置
  loadBalancer: {
    algorithm: 'weighted' as const,
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      healthyThreshold: 2,
      unhealthyThreshold: 3
    },
    stickySessions: false
  },

  // 缓存配置
  cache: {
    type: 'hybrid' as const,
    ttl: 1800, // 30分钟
    maxSize: 10000,
    strategy: 'lru' as const,
    compression: true,
    serialization: 'json' as const,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'aiwriter:'
    }
  },

  // 指标收集配置
  metrics: {
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7天
    aggregationInterval: 60000, // 1分钟
    maxRecords: 100000,
    enableAggregation: true
  },

  // AI服务列表
  services: [
    {
      name: 'Gemini Pro',
      type: 'gemini' as const,
      enabled: true,
      weight: 100,
      config: {
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-pro',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        timeout: 30000,
        maxRetries: 3,
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
      }
    }
  ]
};

// 创建AI服务管理器
let aiServiceManager: AIServiceManager | null = null;

export async function getAIServiceManager(): Promise<AIServiceManager> {
  if (aiServiceManager) {
    return aiServiceManager;
  }

  try {
    // 创建各个组件
    const registry = new ServiceRegistry();
    const loadBalancer = LoadBalancerFactory.create(AI_SERVICE_CONFIG.loadBalancer);
    const cache = CacheManagerFactory.create(AI_SERVICE_CONFIG.cache);
    const metrics = new MetricsCollector(AI_SERVICE_CONFIG.metrics);

    // 创建服务管理器
    aiServiceManager = new AIServiceManager(
      registry,
      loadBalancer,
      cache,
      metrics,
      AI_SERVICE_CONFIG.registry
    );

    // 注册所有服务
    for (const serviceConfig of AI_SERVICE_CONFIG.services) {
      if (serviceConfig.enabled) {
        try {
          await aiServiceManager.registerService({
            id: `${serviceConfig.type}-${serviceConfig.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: serviceConfig.name,
            type: serviceConfig.type,
            weight: serviceConfig.weight,
            ...serviceConfig.config
          });
          console.log(`AI service registered: ${serviceConfig.name}`);
        } catch (error) {
          console.error(`Failed to register AI service ${serviceConfig.name}:`, error);
        }
      }
    }

    // 初始化服务管理器
    await aiServiceManager.initialize();
    console.log('AI Service Manager initialized successfully');

    return aiServiceManager;
  } catch (error) {
    console.error('Failed to initialize AI Service Manager:', error);
    throw error;
  }
}

// 获取AI服务状态
export async function getAIServiceStatus() {
  const manager = await getAIServiceManager();
  return {
    health: await manager.healthCheck(),
    metrics: await manager.getMetrics(),
    services: manager.getServiceStatuses(),
    cacheStats: await manager.getCacheStats()
  };
}

// 清理资源
export async function cleanupAIServiceManager() {
  if (aiServiceManager) {
    // 清理缓存
    await aiServiceManager.clearCache();
    
    // 可以添加其他清理逻辑
    
    aiServiceManager = null;
  }
}