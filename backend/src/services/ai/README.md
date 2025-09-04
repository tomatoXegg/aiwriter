# AI Service Framework

一个统一的AI服务封装和优化框架，提供服务抽象、负载均衡、缓存策略和性能优化。

## 特性

- 🔄 **统一接口**: 为所有AI服务提供统一的API接口
- ⚖️ **负载均衡**: 支持多种负载均衡算法（轮询、加权、最少连接等）
- 💾 **智能缓存**: 多层缓存策略（内存 + Redis）
- 🔌 **熔断器**: 自动故障恢复机制
- 📊 **监控指标**: 实时性能监控和指标收集
- 🏗️ **可扩展**: 插件化架构，易于添加新的AI服务

## 快速开始

### 1. 基本使用

```typescript
import {
  AIServiceManager,
  ServiceRegistry,
  LoadBalancerFactory,
  CacheManagerFactory,
  MetricsCollector,
  AIServiceFactory
} from './services/ai';

// 创建AI服务管理器
async function createServiceManager() {
  // 创建各个组件
  const registry = new ServiceRegistry();
  const loadBalancer = LoadBalancerFactory.create({
    algorithm: 'weighted',
    healthCheck: {
      enabled: true,
      interval: 30000
    }
  });
  const cache = CacheManagerFactory.create({
    type: 'hybrid',
    ttl: 1800,
    redis: {
      host: 'localhost',
      port: 6379
    }
  });
  const metrics = new MetricsCollector();

  // 创建服务管理器
  const manager = new AIServiceManager(
    registry,
    loadBalancer,
    cache,
    metrics,
    {
      autoDiscovery: true,
      healthCheckInterval: 30000
    }
  );

  // 注册服务
  await manager.registerService({
    name: 'Gemini Pro',
    type: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro',
    timeout: 30000,
    enabled: true,
    weight: 100
  });

  // 初始化
  await manager.initialize();

  return manager;
}

// 使用服务
const manager = await createServiceManager();

// 生成文本
const response = await manager.generateText({
  prompt: '写一篇关于人工智能的文章',
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 1000,
  userId: 'user123'
});

console.log(response.content);
```

### 2. 高级配置

```typescript
// 负载均衡配置
const loadBalancerConfig = {
  algorithm: 'weighted', // 'round-robin', 'least-connections', 'fastest-response', 'random'
  healthCheck: {
    enabled: true,
    interval: 30000,    // 30秒检查一次
    timeout: 5000,      // 5秒超时
    healthyThreshold: 2,
    unhealthyThreshold: 3
  },
  stickySessions: true
};

// 缓存配置
const cacheConfig = {
  type: 'hybrid',      // 'memory', 'redis', 'hybrid'
  ttl: 1800,           // 30分钟
  maxSize: 10000,
  strategy: 'lru',     // 'lfu', 'fifo'
  compression: true,
  redis: {
    host: 'redis-cluster.example.com',
    port: 6379,
    password: 'your-password',
    db: 0,
    keyPrefix: 'aiwriter:'
  }
};

// 熔断器配置
const circuitBreakerConfig = {
  failureThreshold: 50,      // 50%失败率触发熔断
  recoveryTimeout: 60000,    // 60秒后尝试恢复
  expectedException: ['timeout', 'rate_limit', 'network_error'],
  monitoringPeriod: 60000    // 60秒监控窗口
};
```

### 3. 多服务配置

```typescript
// 注册多个服务
await manager.registerService({
  name: 'Gemini Primary',
  type: 'gemini',
  model: 'gemini-pro',
  weight: 70,
  enabled: true
});

await manager.registerService({
  name: 'Gemini Backup',
  type: 'gemini',
  model: 'gemini-pro',
  weight: 30,
  enabled: true
});

// 负载均衡器会根据权重分配请求
```

## API 参考

### AIServiceManager

主要的服务管理器类，提供统一的AI服务接口。

#### 方法

- `generateText(request)`: 生成文本
- `generateTopics(request)`: 生成选题
- `optimizeContent(request)`: 优化内容
- `chat(request)`: 对话功能
- `healthCheck()`: 健康检查
- `getMetrics()`: 获取指标
- `registerService(config)`: 注册服务
- `clearCache(pattern)`: 清除缓存

### 服务接口

#### TextGenerationRequest

```typescript
interface TextGenerationRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  userId?: string;
  metadata?: Record<string, any>;
}
```

#### TopicGenerationRequest

```typescript
interface TopicGenerationRequest {
  material: string;
  count?: number;
  style?: string;
  targetAudience?: string;
  userId?: string;
}
```

### 监控指标

框架提供以下监控指标：

- 请求总数和成功率
- 平均响应时间（P50, P95, P99）
- Token使用量和成本
- 缓存命中率
- 错误率和可用性
- 服务健康状态

## 最佳实践

### 1. 缓存策略

- 为不同类型的请求设置不同的TTL
- 对相同参数的请求使用缓存键生成器
- 定期清理过期缓存

```typescript
// 生成缓存键
const cacheKey = cache.generateKey('gemini', 'generateText', {
  prompt,
  model,
  temperature
});
```

### 2. 错误处理

- 实现重试机制
- 使用熔断器防止级联故障
- 记录错误日志和指标

```typescript
try {
  const response = await manager.generateText(request);
} catch (error) {
  if (error.code === 'RATE_LIMIT_ERROR') {
    // 处理限流
  } else if (error.code === 'TIMEOUT_ERROR') {
    // 处理超时
  }
}
```

### 3. 性能优化

- 使用连接池
- 批量处理请求
- 合理设置超时时间
- 监控资源使用

### 4. 成本控制

- 启用缓存减少API调用
- 监控Token使用量
- 选择合适的模型
- 设置请求限制

## 扩展框架

### 添加新的AI服务

1. 实现服务适配器

```typescript
class MyAIServiceAdapter implements IAIService {
  // 实现所有接口方法
}
```

2. 注册到工厂

```typescript
AIServiceFactory.getInstance().registerServiceType(
  'my-service',
  (config) => new MyAIServiceAdapter(config)
);
```

### 自定义负载均衡算法

```typescript
class CustomLoadBalancer extends BaseLoadBalancer {
  async selectService(request: any): Promise<IAIService> {
    // 实现自定义选择逻辑
  }
}
```

## 故障排查

### 常见问题

1. **服务不可用**
   - 检查API密钥配置
   - 查看服务健康状态
   - 检查网络连接

2. **响应慢**
   - 检查缓存命中率
   - 查看负载均衡状态
   - 监控资源使用

3. **错误率高**
   - 查看错误日志
   - 检查熔断器状态
   - 验证请求参数

### 日志和监控

```typescript
// 监听服务事件
manager.on('error', (error) => {
  console.error('Service error:', error);
});

manager.on('serviceRegistered', (service) => {
  console.log('Service registered:', service.name);
});

// 获取详细指标
const metrics = await manager.getMetrics();
console.log('Performance metrics:', metrics);
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License