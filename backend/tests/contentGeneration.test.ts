import request from 'supertest';
import { app } from '../src/index';
import { Database } from '../src/database/init';

describe('Content Generation API', () => {
  let authToken: string;
  let testTopicId: string;
  let testAccountId: string;

  beforeAll(async () => {
    // 初始化测试数据库
    const db = new Database();
    await db.connect();
    await db.initTables();
    
    // 创建测试账号
    const accountResult = await request(app)
      .post('/api/accounts')
      .send({
        name: 'Test Account',
        description: 'Test account for content generation',
        platform: 'wechat'
      });
    
    testAccountId = accountResult.body.data.id;
    
    // 创建测试选题
    const topicResult = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Topic',
        description: 'Test topic for content generation',
        material_id: 'test-material-id'
      });
    
    testTopicId = topicResult.body.data.id;
  });

  describe('POST /api/content/generate', () => {
    it('should generate content from topic', async () => {
      const response = await request(app)
        .post('/api/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicId: testTopicId,
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.generationId).toBeDefined();
      expect(response.body.data.status).toBe('processing');
    });

    it('should return error for invalid topic ID', async () => {
      const response = await request(app)
        .post('/api/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicId: 'invalid-topic-id',
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/content/generate')
        .send({
          topicId: testTopicId,
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/content/generate/custom', () => {
    it('should generate custom content', async () => {
      const response = await request(app)
        .post('/api/content/generate/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Custom Test Article',
          prompt: 'Write an article about the benefits of AI in content creation',
          style: {
            tone: 'casual',
            length: 'short',
            format: 'blog'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.generationId).toBeDefined();
      expect(response.body.data.status).toBe('processing');
    });

    it('should return error for missing title', async () => {
      const response = await request(app)
        .post('/api/content/generate/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Write an article about AI',
          style: {
            tone: 'casual',
            length: 'short',
            format: 'blog'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/content/generations/:id', () => {
    it('should get generation result', async () => {
      // 首先创建一个生成任务
      const generateResponse = await request(app)
        .post('/api/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicId: testTopicId,
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      const generationId = generateResponse.body.data.generationId;

      // 获取生成结果
      const response = await request(app)
        .get(`/api/content/generations/${generationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(generationId);
      expect(response.body.data.status).toBeDefined();
    });

    it('should return error for invalid generation ID', async () => {
      const response = await request(app)
        .get('/api/content/generations/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/content/generate/batch', () => {
    it('should generate batch content', async () => {
      const response = await request(app)
        .post('/api/content/generate/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Batch Generation',
          topicIds: [testTopicId],
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batchId).toBeDefined();
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.taskCount).toBe(1);
    });

    it('should return error for empty topic list', async () => {
      const response = await request(app)
        .post('/api/content/generate/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Batch Generation',
          topicIds: [],
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/content/batch/:id', () => {
    it('should get batch result', async () => {
      // 首先创建一个批量生成任务
      const batchResponse = await request(app)
        .post('/api/content/generate/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Batch Generation',
          topicIds: [testTopicId],
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      const batchId = batchResponse.body.data.batchId;

      // 获取批量生成结果
      const response = await request(app)
        .get(`/api/content/batch/${batchId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batchId).toBe(batchId);
      expect(response.body.data.taskCount).toBeDefined();
    });
  });

  describe('GET /api/content', () => {
    it('should get content list', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contents).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(Array.isArray(response.body.data.contents)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/content?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
    });

    it('should support filtering', async () => {
      const response = await request(app)
        .get('/api/content?status=generated')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.status).toBe('generated');
    });
  });

  describe('GET /api/content/:id', () => {
    it('should get content by ID', async () => {
      // 首先创建一个内容
      const contentResponse = await request(app)
        .post('/api/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicId: testTopicId,
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      // 等待生成完成（在实际测试中可能需要更长时间）
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 获取内容列表来找到生成的内容
      const listResponse = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.data.contents.length > 0) {
        const contentId = listResponse.body.data.contents[0].id;
        
        const response = await request(app)
          .get(`/api/content/${contentId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(contentId);
      }
    });

    it('should return error for invalid content ID', async () => {
      const response = await request(app)
        .get('/api/content/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/content/:id/optimize', () => {
    it('should optimize content', async () => {
      // 首先创建一个内容
      const contentResponse = await request(app)
        .post('/api/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicId: testTopicId,
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      // 等待生成完成
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 获取内容列表
      const listResponse = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.data.contents.length > 0) {
        const contentId = listResponse.body.data.contents[0].id;
        
        const response = await request(app)
          .post(`/api/content/${contentId}/optimize`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'readability',
            content: 'Test content for optimization'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.suggestions).toBeDefined();
      }
    });
  });

  describe('POST /api/content/:id/versions', () => {
    it('should create content version', async () => {
      // 首先创建一个内容
      const contentResponse = await request(app)
        .post('/api/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicId: testTopicId,
          style: {
            tone: 'professional',
            length: 'medium',
            format: 'article'
          }
        });

      // 等待生成完成
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 获取内容列表
      const listResponse = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.data.contents.length > 0) {
        const contentId = listResponse.body.data.contents[0].id;
        
        const response = await request(app)
          .post(`/api/content/${contentId}/versions`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Version',
            body: 'Test content version',
            changeLog: 'Initial version'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.version).toBeDefined();
        expect(response.body.data.currentVersion).toBeDefined();
      }
    });
  });

  describe('GET /api/content/stats/content', () => {
    it('should get content statistics', async () => {
      const response = await request(app)
        .get('/api/content/stats/content')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byStatus).toBeDefined();
    });
  });

  describe('GET /api/content/stats/generation', () => {
    it('should get generation statistics', async () => {
      const response = await request(app)
        .get('/api/content/stats/generation')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byStatus).toBeDefined();
    });
  });

  afterAll(async () => {
    // 清理测试数据
    const db = new Database();
    await db.connect();
    await db.close();
  });
});