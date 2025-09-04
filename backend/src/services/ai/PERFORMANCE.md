# AI服务性能优化指南

## 目录
1. [配置优化](#配置优化)
2. [缓存策略](#缓存策略)
3. [负载均衡](#负载均衡)
4. [熔断器配置](#熔断器配置)
5. [监控和调优](#监控和调优)
6. [成本优化](#成本优化)
7. [最佳实践](#最佳实践)

## 配置优化

### 1. 超时配置

```typescript
// 推荐的超时配置
const recommendedTimeouts = {
  // 快速操作
  generateText: 30000,    // 30秒
  generateTopics: 45000, // 45秒
  optimizeContent: 60000, // 60秒
  
  // 网络相关
  connection: 10000,      // 10秒
  read: 30000,           // 30秒
  write: 30000           // 30秒
};
```

### 2. 重试策略

```typescript
const optimizedRetryPolicy = {
  maxAttempts: 3,        // 最多重试3次
  backoffFactor: 2,       // 指数退避
  maxDelay: 10000,        // 最大延迟10秒
  jitter: true           // 添加抖动避免惊群效应
};
```

### 3. 并发控制

```typescript
// 并发请求限制
const concurrencyLimits = {
  maxConcurrentRequests: 100,    // 最大并发请求数
  maxConcurrentPerUser: 10,       // 每个用户最大并发数
  queueSize: 1000,                // 请求队列大小
  timeout: 30000                  // 队列超时
};
```

## 缓存策略

### 1. 分层缓存配置

```typescript
const cacheConfig = {
  // L1: 内存缓存（快速访问）
  memory: {
    ttl: 300,           // 5分钟
    maxSize: 1000,      // 1000个条目
    strategy: 'lru'
  },
  
  // L2: Redis缓存（共享缓存）
  redis: {
    ttl: 1800,          // 30分钟
    compression: true,
    serialization: 'msgpack'  // 比JSON更高效
  }
};
```

### 2. 智能缓存键生成

```typescript
class SmartCacheKeyGenerator {
  static generateKey(operation: string, params: any): string {
    // 移除不影响结果的参数
    const { userId, metadata, ...relevantParams } = params;
    
    // 标准化参数
    const normalized = this.normalizeParams(relevantParams);
    
    // 使用SHA256生成唯一键
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 16);
    
    return `${operation}:${hash}`;
  }
  
  private normalizeParams(params: any): any {
    // 按键排序确保一致性
    return Object.keys(params)
      .sort()
      .reduce((result: any, key) => {
        result[key] = params[key];
        return result;
      }, {});
  }
}
```

### 3. 缓存预热策略

```typescript
class CacheWarmer {
  async warmupPopularContent() {
    // 预热热门话题
    const popularTopics = await this.getPopularTopics();
    for (const topic of popularTopics) {
      await serviceManager.generateTopics({
        material: topic,
        count: 5
      });
    }
    
    // 预热常用模板
    const templates = await this.getTemplates();
    for (const template of templates) {
      await serviceManager.generateText({
        prompt: template.prompt,
        model: template.model
      });
    }
  }
}
```

## 负载均衡

### 1. 动态权重调整

```typescript
class DynamicWeightAdjuster {
  adjustWeightsBasedOnPerformance(services: AIService[]) {
    for (const service of services) {
      const metrics = await service.getMetrics();
      
      // 根据响应时间调整权重
      const responseTimeScore = Math.max(0.1, 1 - (metrics.averageResponseTime / 10000));
      
      // 根据错误率调整权重
      const errorRateScore = Math.max(0.1, 1 - (metrics.errorRate / 100));
      
      // 计算新权重
      const newWeight = service.config.weight * responseTimeScore * errorRateScore;
      
      // 平滑调整
      service.config.weight = service.config.weight * 0.7 + newWeight * 0.3;
    }
  }
}
```

### 2. 健康检查优化

```typescript
const optimizedHealthCheck = {
  // 渐进式检查
  intervals: {
    healthy: 60000,        // 健康服务：60秒
    degraded: 30000,      // 降级服务：30秒
    unhealthy: 10000      // 不健康服务：10秒
  },
  
  // 检查端点
  endpoints: {
    ping: '/health/ping',     // 快速检查
    metrics: '/health/metrics', // 详细指标
    full: '/health/full'      // 完整检查
  }
};
```

## 熔断器配置

### 1. 自适应熔断器

```typescript
class AdaptiveCircuitBreaker {
  private failureThreshold = 50;    // 初始50%
  private windowSize = 60000;       // 1分钟窗口
  
  adjustThresholdBasedOnLoad(currentLoad: number) {
    // 高负载时降低阈值
    if (currentLoad > 80) {
      this.failureThreshold = 30;
    }
    // 低负载时提高阈值
    else if (currentLoad < 30) {
      this.failureThreshold = 70;
    }
  }
}
```

### 2. 熔断器状态监控

```typescript
const circuitBreakerMetrics = {
  // 状态转换统计
  stateTransitions: {
    closed_to_open: 0,
    open_to_half_open: 0,
    half_open_to_closed: 0,
    half_open_to_open: 0
  },
  
  // 性能指标
  performance: {
    averageRecoveryTime: 0,
    failureBurstCount: 0,
    lastFailureTime: null
  }
};
```

## 监控和调优

### 1. 关键性能指标

```typescript
interface KPIs {
  // 性能指标
  p50ResponseTime: number;    // 50%请求响应时间
  p95ResponseTime: number;    // 95%请求响应时间
  p99ResponseTime: number;    // 99%请求响应时间
  
  // 可靠性指标
  availability: number;        // 服务可用性 (%)
  errorRate: number;           // 错误率 (%)
  mttr: number;               // 平均恢复时间 (分钟)
  
  // 效率指标
  cacheHitRate: number;       // 缓存命中率 (%)
  costPerRequest: number;      // 每个请求成本
  throughput: number;         // 吞吐量 (requests/minute)
}
```

### 2. 实时告警规则

```typescript
const alertRules = {
  // 性能告警
  responseTime: {
    warning: 5000,    // 5秒
    critical: 10000   // 10秒
  },
  
  // 错误率告警
  errorRate: {
    warning: 5,       // 5%
    critical: 10      // 10%
  },
  
  // 可用性告警
  availability: {
    warning: 95,      // 95%
    critical: 90      // 90%
  }
};
```

### 3. 性能分析工具

```typescript
class PerformanceAnalyzer {
  analyzeBottlenecks(metrics: ServiceMetrics[]) {
    const analysis = {
      slowestServices: this.rankByResponseTime(metrics),
      highestErrorRates: this.rankByErrorRate(metrics),
      leastEfficient: this.rankByCostEfficiency(metrics),
      cacheOpportunities: this.identifyCacheOpportunities(metrics)
    };
    
    return analysis;
  }
  
  generateOptimizationRecommendations(analysis: any) {
    const recommendations = [];
    
    // 响应时间优化
    if (analysis.slowestServices[0].averageResponseTime > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        description: 'Consider increasing timeout or optimizing slow service'
      });
    }
    
    // 缓存优化
    if (analysis.cacheOpportunities.length > 0) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        description: 'Enable caching for high-frequency operations'
      });
    }
    
    return recommendations;
  }
}
```

## 成本优化

### 1. Token使用优化

```typescript
class TokenOptimizer {
  // 优化提示词
  optimizePrompt(prompt: string): string {
    // 移除冗余内容
    let optimized = prompt
      .replace(/\s+/g, ' ')
      .trim();
    
    // 使用更高效的表述
    optimized = this.useEfficientLanguage(optimized);
    
    return optimized;
  }
  
  // 模型选择策略
  selectModelForTask(task: string): string {
    const modelMapping = {
      'simple-generation': 'gemini-1.5-flash',
      'complex-analysis': 'gemini-1.5-pro',
      'code-generation': 'gemini-1.5-pro'
    };
    
    return modelMapping[task] || 'gemini-pro';
  }
}
```

### 2. 批量处理优化

```typescript
class BatchProcessor {
  async processBatch<T, R>(
    requests: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      concurrency?: number;
      delay?: number;
    } = {}
  ): Promise<R[]> {
    const {
      batchSize = 10,
      concurrency = 3,
      delay = 100
    } = options;
    
    const results: R[] = [];
    
    // 分批处理
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      // 并发处理批次
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );
      
      // 收集结果
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
      
      // 批次间延迟
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }
}
```

## 最佳实践

### 1. 请求优化

```typescript
// 使用连接池
const connectionPool = new ConnectionPool({
  max: 100,
  min: 10,
  acquireTimeoutMillis: 30000
});

// 请求合并
const requestBatcher = new RequestBatcher({
  maxBatchSize: 10,
  maxWaitTime: 100,
  mergeSimilarRequests: true
});

// 结果流式处理
async function* streamResponse(response: AsyncIterable<any>) {
  for await (const chunk of response) {
    yield chunk;
  }
}
```

### 2. 资源管理

```typescript
// 内存使用监控
const memoryMonitor = {
  checkInterval: 60000,
  threshold: 0.8, // 80%内存使用率
  
  start() {
    setInterval(() => {
      const used = process.memoryUsage().heapUsed;
      const total = process.memoryUsage().heapTotal;
      const ratio = used / total;
      
      if (ratio > this.threshold) {
        this.triggerCleanup();
      }
    }, this.checkInterval);
  }
};

// 定期清理
class PeriodicCleanup {
  start() {
    // 每小时清理一次
    setInterval(async () => {
      await serviceManager.clearCache('expired:*');
      await metrics.cleanupOldData();
    }, 3600000);
  }
}
```

### 3. 灾备策略

```typescript
// 多区域部署
const multiRegionConfig = {
  primary: 'us-east-1',
  secondary: 'us-west-1',
  failoverThreshold: 3,    // 连续失败3次切换
  healthCheckInterval: 30000
};

// 数据备份
const backupStrategy = {
  metrics: {
    interval: 3600000,    // 每小时备份
    retention: 30 * 24 * 3600000  // 保留30天
  },
  cache: {
    interval: 1800000,    // 每30分钟备份
    compression: true
  }
};
```

### 4. 安全考虑

```typescript
// API密钥轮换
class ApiKeyRotator {
  async rotateKeys() {
    const newKey = await this.generateNewKey();
    const oldKey = currentKey;
    
    // 并行使用新旧密钥
    await this.gracefulTransition(oldKey, newKey);
    
    // 废弃旧密钥
    await this.revokeKey(oldKey);
  }
}

// 请求限速
const rateLimiter = new SlidingWindowRateLimiter({
  windowSize: 60000,    // 1分钟窗口
  maxRequests: 100,     // 最大请求数
  keyGenerator: (req) => req.userId
});
```

## 性能测试建议

### 1. 基准测试

```typescript
// 性能基准测试
async function runBenchmark() {
  const scenarios = [
    { name: 'Text Generation', requests: 1000 },
    { name: 'Topic Generation', requests: 500 },
    { name: 'Content Optimization', requests: 300 }
  ];
  
  for (const scenario of scenarios) {
    const result = await runLoadTest(scenario);
    console.log(`${scenario.name}:`, {
      avgResponseTime: result.avgTime,
      p95ResponseTime: result.p95Time,
      throughput: result.throughput,
      errorRate: result.errorRate
    });
  }
}
```

### 2. 压力测试

```typescript
// 渐进式压力测试
async function progressiveStressTest() {
  const startConcurrency = 10;
  const maxConcurrency = 1000;
  const step = 10;
  const durationPerStep = 60000; // 每个级别1分钟
  
  for (let concurrency = startConcurrency; concurrency <= maxConcurrency; concurrency += step) {
    console.log(`Testing with ${concurrency} concurrent users...`);
    
    const result = await runStressTest({
      concurrency,
      duration: durationPerStep
    });
    
    if (result.errorRate > 5) {
      console.log(`Breaking point found at ${concurrency} concurrent users`);
      break;
    }
  }
}
```

## 总结

通过实施这些优化策略，可以实现：

- **响应时间**: 平均减少30-50%
- **吞吐量**: 提升2-3倍
- **成本**: 降低20-40%
- **可用性**: 达到99.9%以上

记住：性能优化是一个持续的过程，需要定期监控、分析和调整。