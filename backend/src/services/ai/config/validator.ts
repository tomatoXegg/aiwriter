import { ServiceConfig, LoadBalancerConfig, CacheConfig } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAIServiceConfig(config: ServiceConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 基本信息
  if (!config.name || config.name.trim() === '') {
    errors.push('Service name is required');
  }

  if (!config.type || !['gemini', 'openai', 'claude', 'local', 'azure'].includes(config.type)) {
    errors.push('Invalid service type');
  }

  if (!config.model || config.model.trim() === '') {
    errors.push('Model is required');
  }

  // 超时配置
  if (config.timeout && (config.timeout < 1000 || config.timeout > 120000)) {
    errors.push('Timeout must be between 1000 and 120000 ms');
  }

  // 重试配置
  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
    errors.push('Max retries must be between 0 and 10');
  }

  // 权重配置
  if (config.weight && (config.weight < 0 || config.weight > 100)) {
    warnings.push('Weight should be between 0 and 100');
  }

  // 速率限制
  if (config.rateLimit) {
    if (config.rateLimit.requests <= 0) {
      errors.push('Rate limit requests must be greater than 0');
    }
    if (config.rateLimit.window <= 0) {
      errors.push('Rate limit window must be greater than 0');
    }
    if (config.rateLimit.window > 3600000) {
      warnings.push('Rate limit window is longer than 1 hour');
    }
  }

  // 重试策略
  if (config.retryPolicy) {
    if (config.retryPolicy.maxAttempts <= 0) {
      errors.push('Retry max attempts must be greater than 0');
    }
    if (config.retryPolicy.backoffFactor < 1) {
      errors.push('Retry backoff factor must be at least 1');
    }
    if (config.retryPolicy.maxDelay && config.retryPolicy.maxDelay < 1000) {
      warnings.push('Retry max delay is less than 1000ms');
    }
  }

  // 熔断器配置
  if (config.circuitBreaker) {
    if (config.circuitBreaker.failureThreshold <= 0 || config.circuitBreaker.failureThreshold > 100) {
      errors.push('Circuit breaker failure threshold must be between 0 and 100');
    }
    if (config.circuitBreaker.recoveryTimeout <= 0) {
      errors.push('Circuit breaker recovery timeout must be greater than 0');
    }
    if (config.circuitBreaker.recoveryTimeout > 300000) {
      warnings.push('Circuit breaker recovery timeout is longer than 5 minutes');
    }
  }

  // 缓存配置
  if (config.cache) {
    if (config.cache.ttl < 0) {
      errors.push('Cache TTL must be non-negative');
    }
    if (config.cache.maxSize && config.cache.maxSize < 1) {
      errors.push('Cache max size must be at least 1');
    }
  }

  // 特定服务的验证
  switch (config.type) {
    case 'gemini':
      if (!config.apiKey) {
        errors.push('API key is required for Gemini service');
      }
      if (config.model && !config.model.startsWith('gemini-')) {
        warnings.push('Gemini model names should start with "gemini-"');
      }
      break;
    
    case 'openai':
      if (!config.apiKey) {
        errors.push('API key is required for OpenAI service');
      }
      if (config.model && !config.model.includes('gpt')) {
        warnings.push('OpenAI model name should include "gpt"');
      }
      break;
    
    case 'claude':
      if (!config.apiKey) {
        errors.push('API key is required for Claude service');
      }
      break;
    
    case 'local':
      if (!config.baseUrl) {
        errors.push('Base URL is required for local service');
      }
      break;
    
    case 'azure':
      if (!config.apiKey) {
        errors.push('API key is required for Azure service');
      }
      if (!config.baseUrl) {
        errors.push('Base URL is required for Azure service');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateLoadBalancerConfig(config: LoadBalancerConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 算法验证
  const validAlgorithms = ['round-robin', 'weighted', 'least-connections', 'fastest-response', 'random'];
  if (!validAlgorithms.includes(config.algorithm)) {
    errors.push(`Invalid load balancing algorithm: ${config.algorithm}`);
  }

  // 健康检查配置
  if (config.healthCheck) {
    if (config.healthCheck.enabled && config.healthCheck.interval <= 0) {
      errors.push('Health check interval must be greater than 0');
    }
    if (config.healthCheck.timeout <= 0) {
      errors.push('Health check timeout must be greater than 0');
    }
    if (config.healthCheck.healthyThreshold <= 0) {
      errors.push('Health check healthy threshold must be greater than 0');
    }
    if (config.healthCheck.unhealthyThreshold <= 0) {
      errors.push('Health check unhealthy threshold must be greater than 0');
    }
  }

  // 粘性会话
  if (config.stickySessions && !config.sessionTimeout) {
    warnings.push('Session timeout is recommended when using sticky sessions');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateCacheConfig(config: CacheConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 类型验证
  const validTypes = ['memory', 'redis', 'hybrid'];
  if (!validTypes.includes(config.type)) {
    errors.push(`Invalid cache type: ${config.type}`);
  }

  // TTL验证
  if (config.ttl < 0) {
    errors.push('Cache TTL must be non-negative');
  }
  if (config.ttl > 86400) {
    warnings.push('Cache TTL is longer than 24 hours');
  }

  // 大小限制
  if (config.maxSize && config.maxSize < 1) {
    errors.push('Cache max size must be at least 1');
  }

  // 策略验证
  const validStrategies = ['lru', 'lfu', 'fifo'];
  if (!validStrategies.includes(config.strategy)) {
    errors.push(`Invalid cache strategy: ${config.strategy}`);
  }

  // Redis配置
  if ((config.type === 'redis' || config.type === 'hybrid') && config.redis) {
    if (!config.redis.host) {
      errors.push('Redis host is required');
    }
    if (config.redis.port && (config.redis.port < 1 || config.redis.port > 65535)) {
      errors.push('Redis port must be between 1 and 65535');
    }
    if (config.redis.db && (config.redis.db < 0 || config.redis.db > 15)) {
      errors.push('Redis DB must be between 0 and 15');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// 配置优化建议
export function getConfigOptimizationSuggestions(config: ServiceConfig): string[] {
  const suggestions: string[] = [];

  // 性能优化建议
  if (config.timeout && config.timeout > 30000) {
    suggestions.push('Consider reducing timeout for better failover performance');
  }

  if (config.rateLimit && config.rateLimit.requests < 10) {
    suggestions.push('Low rate limit may impact performance under high load');
  }

  if (config.maxRetries && config.maxRetries > 3) {
    suggestions.push('High retry count may increase latency on failures');
  }

  // 成本优化建议
  if (config.cache && !config.cache.enabled) {
    suggestions.push('Enable caching to reduce API costs');
  }

  if (config.cache && config.cache.ttl > 3600) {
    suggestions.push('Consider reducing cache TTL for fresher results');
  }

  // 可靠性优化建议
  if (!config.circuitBreaker || config.circuitBreaker.failureThreshold > 80) {
    suggestions.push('Consider setting lower circuit breaker threshold for faster failover');
  }

  if (config.retryPolicy && config.retryPolicy.maxDelay && config.retryPolicy.maxDelay > 30000) {
    suggestions.push('High retry delay may impact user experience');
  }

  return suggestions;
}