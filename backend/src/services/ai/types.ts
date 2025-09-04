export interface ServiceConfig {
  id?: string;
  name: string;
  type: 'gemini' | 'openai' | 'claude' | 'local' | 'azure';
  baseUrl?: string;
  apiKey?: string;
  model: string;
  timeout: number;
  maxRetries: number;
  enabled: boolean;
  weight?: number;
  rateLimit: {
    requests: number;
    window: number; // in milliseconds
  };
  retryPolicy: {
    maxAttempts: number;
    backoffFactor: number;
    maxDelay: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    expectedException: string[];
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize?: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  details?: Record<string, any>;
}

export interface ServiceMetrics {
  serviceId: string;
  timestamp: Date;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  cacheHits: number;
  cacheMisses: number;
  errorRate: number;
  availability: number;
}

export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'weighted' | 'least-connections' | 'random' | 'fastest-response';
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    healthyThreshold: number;
    unhealthyThreshold: number;
  };
  stickySessions?: boolean;
  sessionTimeout?: number;
}

export interface CacheConfig {
  type: 'memory' | 'redis' | 'hybrid';
  ttl: number;
  maxSize?: number;
  strategy: 'lru' | 'lfu' | 'fifo';
  compression: boolean;
  serialization: 'json' | 'msgpack';
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
  };
}

export interface ServiceInstance {
  id: string;
  name: string;
  type: string;
  config: ServiceConfig;
  status: 'active' | 'inactive' | 'error';
  health: HealthStatus;
  metrics: ServiceMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRegistryConfig {
  autoDiscovery: boolean;
  healthCheckInterval: number;
  serviceTimeout: number;
  metricsRetention: number; // in days
}

export interface AITimeoutError extends Error {
  code: 'TIMEOUT_ERROR';
  serviceId: string;
  operation: string;
  timeout: number;
}

export interface AIRateLimitError extends Error {
  code: 'RATE_LIMIT_ERROR';
  serviceId: string;
  retryAfter?: number;
  details?: any;
}

export interface AIQuotaExceededError extends Error {
  code: 'QUOTA_EXCEEDED_ERROR';
  serviceId: string;
  quotaType: string;
  resetTime?: Date;
}

export type AIServiceError = AITimeoutError | AIRateLimitError | AIQuotaExceededError;