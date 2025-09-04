import {
  AIServiceManager,
  ServiceRegistry,
  LoadBalancerFactory,
  CacheManagerFactory,
  MetricsCollector,
  AIServiceFactory,
  ServiceConfig,
  LoadBalancerConfig,
  CacheConfig
} from '../index';
import { CircuitBreaker } from '../circuitBreaker';
import { MetricsCollector as MetricsCollectorImpl } from '../metrics';

// Mock Gemini Service
class MockGeminiService {
  async generateContent(prompt: string, options: any = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      id: `test-${Date.now()}`,
      content: `Generated content for: ${prompt}`,
      model: options.model || 'gemini-pro',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      },
      metadata: {
        processingTime: 100,
        timestamp: new Date(),
        finishReason: 'STOP'
      }
    };
  }

  async generateTopics(material: string, options: any = {}) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return [
      {
        id: 'topic-1',
        title: 'Test Topic 1',
        description: 'Test description',
        audience: 'Test audience',
        value: 'Test value',
        keywords: ['test'],
        score: 8
      }
    ];
  }

  getStatus() {
    return {
      service: 'Google Gemini AI',
      configured: true,
      model: 'gemini-pro',
      availableModels: ['gemini-pro'],
      rateLimit: { requests: 60, window: 60000 },
      validation: { valid: true },
      statistics: {
        totalRequests: 100,
        successRate: '95%',
        averageResponseTime: '150ms'
      }
    };
  }

  getStatistics() {
    return {
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      totalTokens: 3000,
      totalCost: 0.375,
      averageResponseTime: 150,
      breakdown: {
        byModel: {
          'gemini-pro': {
            requests: 100,
            tokens: 3000,
            cost: 0.375,
            avgResponseTime: 150
          }
        },
        byAccount: {},
        byDay: []
      }
    };
  }
}

describe('AIServiceManager', () => {
  let serviceManager: AIServiceManager;
  let mockGeminiService: MockGeminiService;

  beforeAll(async () => {
    // Create mock service
    mockGeminiService = new MockGeminiService();

    // Create service manager
    const registry = new ServiceRegistry();
    const loadBalancer = LoadBalancerFactory.create({
      algorithm: 'round-robin',
      healthCheck: { enabled: false }
    });
    const cache = CacheManagerFactory.create({
      type: 'memory',
      ttl: 1800
    });
    const metrics = new MetricsCollectorImpl({
      enableAggregation: false
    });

    serviceManager = new AIServiceManager(
      registry,
      loadBalancer,
      cache,
      metrics,
      {
        autoDiscovery: false,
        healthCheckInterval: 0,
        serviceTimeout: 30000,
        metricsRetention: 1
      }
    );

    // Mock the service creation
    (serviceManager as any).createService = async (config: ServiceConfig) => {
      return {
        id: config.id || 'test-service',
        name: config.name,
        type: config.type,
        config,
        initialize: async () => {},
        generateText: async (request: any) => {
          const response = await mockGeminiService.generateContent(request.prompt, {
            model: request.model,
            temperature: request.temperature,
            maxTokens: request.maxTokens
          });
          return {
            id: response.id,
            content: response.content,
            model: response.model,
            usage: response.usage,
            metadata: {
              processingTime: response.metadata.processingTime,
              timestamp: response.metadata.timestamp,
              finishReason: response.metadata.finishReason
            }
          };
        },
        generateTopics: async (request: any) => {
          const topics = await mockGeminiService.generateTopics(request.material, {
            count: request.count,
            style: request.style
          });
          return {
            topics,
            model: 'gemini-pro',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            metadata: {
              processingTime: 100,
              timestamp: new Date()
            }
          };
        },
        optimizeContent: async (request: any) => {
          return {
            optimizedContent: request.content,
            improvements: [],
            score: 8,
            model: 'gemini-pro',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            metadata: {
              processingTime: 100,
              timestamp: new Date()
            }
          };
        },
        chat: async (request: any) => {
          return {
            conversationId: request.conversationId,
            response: 'Chat response',
            messages: [],
            model: 'gemini-pro',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            metadata: {
              processingTime: 100,
              timestamp: new Date()
            }
          };
        },
        healthCheck: async () => ({
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: 100,
          errorRate: 5
        }),
        getMetrics: async () => ({
          serviceId: 'test-service',
          timestamp: new Date(),
          requestCount: 100,
          successCount: 95,
          errorCount: 5,
          averageResponseTime: 150,
          p95ResponseTime: 200,
          p99ResponseTime: 300,
          tokenUsage: { prompt: 1000, completion: 2000, total: 3000 },
          cost: 0.375,
          cacheHits: 80,
          cacheMisses: 20,
          errorRate: 5,
          availability: 95
        }),
        updateConfig: async () => {},
        clearCache: async () => 0,
        getCacheStats: async () => ({})
      };
    };

    await serviceManager.initialize();
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const request = {
        prompt: 'Test prompt',
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await serviceManager.generateText(request);

      expect(response).toBeDefined();
      expect(response.content).toContain('Test prompt');
      expect(response.model).toBe('gemini-pro');
      expect(response.usage.totalTokens).toBe(30);
    });

    it('should cache responses', async () => {
      const request = {
        prompt: 'Cache test prompt',
        model: 'gemini-pro'
      };

      // First request
      const response1 = await serviceManager.generateText(request);
      
      // Second request should hit cache
      const response2 = await serviceManager.generateText(request);

      expect(response1.content).toBe(response2.content);
      expect(response2.metadata.processingTime).toBe(0); // Cached response
    });
  });

  describe('generateTopics', () => {
    it('should generate topics successfully', async () => {
      const request = {
        material: 'Test material for topics',
        count: 3,
        style: 'professional'
      };

      const response = await serviceManager.generateTopics(request);

      expect(response).toBeDefined();
      expect(response.topics).toHaveLength(1);
      expect(response.topics[0].title).toBe('Test Topic 1');
    });
  });

  describe('optimizeContent', () => {
    it('should optimize content successfully', async () => {
      const request = {
        content: 'Test content to optimize',
        focus: 'readability'
      };

      const response = await serviceManager.optimizeContent(request);

      expect(response).toBeDefined();
      expect(response.optimizedContent).toBe(request.content);
      expect(response.score).toBe(8);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const health = await serviceManager.healthCheck();

      expect(health).toBeDefined();
      expect(['healthy', 'unhealthy', 'degraded']).toContain(health.status);
    });
  });

  describe('getMetrics', () => {
    it('should return service metrics', async () => {
      const metrics = await serviceManager.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.requestCount).toBeGreaterThanOrEqual(0);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 50,
      recoveryTimeout: 1000,
      expectedException: ['timeout']
    });
  });

  describe('execute', () => {
    it('should execute successful operation', async () => {
      const result = await circuitBreaker.execute(async () => 'success');
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open circuit after threshold failures', async () => {
      // Fail multiple times
      for (let i = 0; i < 6; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error('timeout');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should reject calls when circuit is open', async () => {
      // Force open
      (circuitBreaker as any).transitionToOpen();

      await expect(
        circuitBreaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('getMetrics', () => {
    it('should return circuit breaker metrics', async () => {
      // Execute some operations
      try {
        await circuitBreaker.execute(async () => 'success');
      } catch (error) {
        // Ignore
      }

      const metrics = circuitBreaker.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.state).toBeDefined();
      expect(metrics.requestCount).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('LoadBalancer', () => {
  it('should create round-robin load balancer', () => {
    const lb = LoadBalancerFactory.create({
      algorithm: 'round-robin',
      healthCheck: { enabled: false }
    });

    expect(lb).toBeDefined();
  });

  it('should create weighted load balancer', () => {
    const lb = LoadBalancerFactory.create({
      algorithm: 'weighted',
      healthCheck: { enabled: false }
    });

    expect(lb).toBeDefined();
  });

  it('should throw error for unknown algorithm', () => {
    expect(() => {
      LoadBalancerFactory.create({
        algorithm: 'unknown' as any,
        healthCheck: { enabled: false }
      });
    }).toThrow('Unknown load balancing algorithm');
  });
});

describe('CacheManager', () => {
  it('should create memory cache', () => {
    const cache = CacheManagerFactory.create({
      type: 'memory',
      ttl: 1800
    });

    expect(cache).toBeDefined();
  });

  it('should create hybrid cache', () => {
    const cache = CacheManagerFactory.create({
      type: 'hybrid',
      ttl: 1800
    });

    expect(cache).toBeDefined();
  });

  it('should cache and retrieve values', async () => {
    const cache = CacheManagerFactory.create({
      type: 'memory',
      ttl: 1800
    });

    await cache.set('test-key', { value: 'test-value' });
    const result = await cache.get('test-key');

    expect(result).toEqual({ value: 'test-value' });
  });
});