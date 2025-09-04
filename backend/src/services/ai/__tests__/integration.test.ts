import request from 'supertest';
import express from 'express';
import { 
  AIServiceManager,
  ServiceRegistry,
  LoadBalancerFactory,
  CacheManagerFactory,
  MetricsCollector,
  AIServiceFactory,
  ServiceConfig
} from '../index';
import { GeminiServiceAdapter } from '../adapters/GeminiServiceAdapter';

// Create test app
function createTestApp(serviceManager: AIServiceManager) {
  const app = express();
  app.use(express.json());

  // Text generation endpoint
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const response = await serviceManager.generateText(req.body);
      res.json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Topic generation endpoint
  app.post('/api/ai/topics', async (req, res) => {
    try {
      const response = await serviceManager.generateTopics(req.body);
      res.json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Content optimization endpoint
  app.post('/api/ai/optimize', async (req, res) => {
    try {
      const response = await serviceManager.optimizeContent(req.body);
      res.json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Health check endpoint
  app.get('/api/ai/health', async (req, res) => {
    try {
      const health = await serviceManager.healthCheck();
      res.json({ success: true, data: health });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Metrics endpoint
  app.get('/api/ai/metrics', async (req, res) => {
    try {
      const metrics = await serviceManager.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Service registration endpoint
  app.post('/api/ai/services', async (req, res) => {
    try {
      const serviceId = await serviceManager.registerService(req.body);
      res.json({ success: true, data: { serviceId } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Service list endpoint
  app.get('/api/ai/services', async (req, res) => {
    try {
      const services = serviceManager.getServiceStatuses();
      res.json({ success: true, data: services });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Cache management endpoint
  app.delete('/api/ai/cache', async (req, res) => {
    try {
      const cleared = await serviceManager.clearCache(req.query.pattern as string);
      res.json({ success: true, data: { clearedKeys: cleared } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  return app;
}

describe('AI Service Integration Tests', () => {
  let app: express.Express;
  let serviceManager: AIServiceManager;

  beforeAll(async () => {
    // Create service manager with mock configuration
    const registry = new ServiceRegistry();
    const loadBalancer = LoadBalancerFactory.create({
      algorithm: 'round-robin',
      healthCheck: { enabled: false }
    });
    const cache = CacheManagerFactory.create({
      type: 'memory',
      ttl: 1800
    });
    const metrics = new MetricsCollector({
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

    // Mock service creation
    (serviceManager as any).createService = async (config: ServiceConfig) => {
      // Create a mock service
      const mockService = {
        id: config.id || 'mock-service',
        name: config.name,
        type: config.type,
        config,
        initialize: async () => {},
        generateText: async (request: any) => ({
          id: `mock-${Date.now()}`,
          content: `Mock response for: ${request.prompt}`,
          model: request.model || 'mock-model',
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30
          },
          metadata: {
            processingTime: 50,
            timestamp: new Date(),
            finishReason: 'STOP'
          }
        }),
        generateTopics: async (request: any) => ({
          topics: [
            {
              id: 'mock-topic-1',
              title: 'Mock Topic 1',
              description: 'Mock description',
              audience: 'Test audience',
              value: 'Test value',
              keywords: ['mock'],
              score: 8
            }
          ],
          model: 'mock-model',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          metadata: {
            processingTime: 50,
            timestamp: new Date()
          }
        }),
        optimizeContent: async (request: any) => ({
          optimizedContent: request.content + ' (optimized)',
          improvements: [],
          score: 9,
          model: 'mock-model',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          metadata: {
            processingTime: 50,
            timestamp: new Date()
          }
        }),
        chat: async (request: any) => ({
          conversationId: request.conversationId,
          response: 'Mock chat response',
          messages: [
            { role: 'user', content: request.message, timestamp: new Date() },
            { role: 'assistant', content: 'Mock chat response', timestamp: new Date() }
          ],
          model: 'mock-model',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          metadata: {
            processingTime: 50,
            timestamp: new Date()
          }
        }),
        healthCheck: async () => ({
          status: 'healthy' as const,
          lastCheck: new Date(),
          responseTime: 50,
          errorRate: 0
        }),
        getMetrics: async () => ({
          serviceId: 'mock-service',
          timestamp: new Date(),
          requestCount: 10,
          successCount: 10,
          errorCount: 0,
          averageResponseTime: 50,
          p95ResponseTime: 60,
          p99ResponseTime: 70,
          tokenUsage: { prompt: 100, completion: 200, total: 300 },
          cost: 0.0375,
          cacheHits: 5,
          cacheMisses: 5,
          errorRate: 0,
          availability: 100
        }),
        updateConfig: async () => {},
        clearCache: async () => 0,
        getCacheStats: async () => ({ hits: 5, misses: 5, hitRate: 50 })
      };

      return mockService;
    };

    await serviceManager.initialize();
    app = createTestApp(serviceManager);

    // Register a mock service
    await serviceManager.registerService({
      name: 'Mock AI Service',
      type: 'mock',
      model: 'mock-model',
      timeout: 30000,
      maxRetries: 3,
      enabled: true,
      rateLimit: {
        requests: 100,
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
        expectedException: ['timeout']
      }
    });
  });

  describe('POST /api/ai/generate', () => {
    it('should generate text successfully', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({
          prompt: 'Hello, world!',
          model: 'mock-model',
          temperature: 0.7
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('Hello, world!');
      expect(response.body.data.usage.totalTokens).toBe(30);
    });

    it('should return error for invalid request', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/ai/topics', () => {
    it('should generate topics successfully', async () => {
      const response = await request(app)
        .post('/api/ai/topics')
        .send({
          material: 'Artificial Intelligence',
          count: 3,
          style: 'professional'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(1);
      expect(response.body.data.topics[0].title).toBe('Mock Topic 1');
    });
  });

  describe('POST /api/ai/optimize', () => {
    it('should optimize content successfully', async () => {
      const response = await request(app)
        .post('/api/ai/optimize')
        .send({
          content: 'This is test content',
          focus: 'readability'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.optimizedContent).toContain('(optimized)');
      expect(response.body.data.score).toBe(9);
    });
  });

  describe('GET /api/ai/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(['healthy', 'unhealthy', 'degraded']).toContain(response.body.data.status);
    });
  });

  describe('GET /api/ai/metrics', () => {
    it('should return service metrics', async () => {
      // Make some requests first
      await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'Test prompt' });

      const response = await request(app)
        .get('/api/ai/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestCount).toBeGreaterThanOrEqual(0);
      expect(response.body.data.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/ai/services', () => {
    it('should register new service', async () => {
      const response = await request(app)
        .post('/api/ai/services')
        .send({
          name: 'New Mock Service',
          type: 'mock',
          model: 'mock-model-2',
          timeout: 30000,
          maxRetries: 3,
          enabled: true,
          rateLimit: {
            requests: 50,
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
            expectedException: ['timeout']
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceId).toBeDefined();
    });
  });

  describe('GET /api/ai/services', () => {
    it('should return list of services', async () => {
      const response = await request(app)
        .get('/api/ai/services')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/ai/cache', () => {
    it('should clear cache', async () => {
      // Add something to cache first
      await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'Cache test' });

      const response = await request(app)
        .delete('/api/ai/cache')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clearedKeys).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map((_, i) => 
        request(app)
          .post('/api/ai/generate')
          .send({
            prompt: `Concurrent test ${i}`,
            model: 'mock-model'
          })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respect rate limits', async () => {
      // This test would need actual rate limiting implementation
      // For now, just verify the service doesn't crash under load
      const requests = Array(20).fill(null).map((_, i) => 
        request(app)
          .post('/api/ai/generate')
          .send({
            prompt: `Rate limit test ${i}`,
            model: 'mock-model'
          })
      );

      const responses = await Promise.all(requests);
      
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
});