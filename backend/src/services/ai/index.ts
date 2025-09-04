// 核心接口
export * from './interfaces';

// 类型定义
export * from './types';

// 服务管理器
export { AIServiceManager } from './AIServiceManager';

// 服务注册中心
export { ServiceRegistry } from './ServiceRegistry';

// 服务工厂
export { AIServiceFactory } from './AIServiceFactory';

// 负载均衡
export * from './loadBalancer';

// 缓存管理
export * from './cache';

// 熔断器
export * from './circuitBreaker';

// 指标收集
export * from './metrics';

// 服务适配器
export { GeminiServiceAdapter } from './adapters/GeminiServiceAdapter';

// 配置验证
export { validateAIServiceConfig } from './config/validator';

// 常量
export const AI_SERVICE_TYPES = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CLAUDE: 'claude',
  LOCAL: 'local',
  AZURE: 'azure'
} as const;

export const LOAD_BALANCER_ALGORITHMS = {
  ROUND_ROBIN: 'round-robin',
  WEIGHTED: 'weighted',
  LEAST_CONNECTIONS: 'least-connections',
  FASTEST_RESPONSE: 'fastest-response',
  RANDOM: 'random'
} as const;

export const CACHE_STRATEGIES = {
  LRU: 'lru',
  LFU: 'lfu',
  FIFO: 'fifo'
} as const;

export const CACHE_TYPES = {
  MEMORY: 'memory',
  REDIS: 'redis',
  HYBRID: 'hybrid'
} as const;