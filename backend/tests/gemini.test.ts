import request from 'supertest';
import app from '../src/index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// 模拟用户认证
const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com'
};

// 创建认证中间件的模拟
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  }
}));

describe('Gemini API Routes', () => {
  let server: any;

  beforeAll(() => {
    // 设置环境变量用于测试
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.NODE_ENV = 'test';
  });

  describe('POST /api/gemini/generate', () => {
    it('should generate content successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/generate')
        .send({
          prompt: '写一篇关于人工智能的文章',
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 500
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('model');
      expect(response.body.data).toHaveProperty('usage');
    });

    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/api/gemini/generate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Prompt is required');
    });

    it('should return error for too long prompt', async () => {
      const longPrompt = 'a'.repeat(10001);
      
      const response = await request(app)
        .post('/api/gemini/generate')
        .send({ prompt: longPrompt })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Prompt too long');
    });
  });

  describe('POST /api/gemini/topics', () => {
    it('should generate topics successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/topics')
        .send({
          material: '人工智能是未来科技发展的重要方向，包括机器学习、深度学习、自然语言处理等多个领域。',
          count: 3,
          style: '专业科普'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('topics');
      expect(Array.isArray(response.body.data.topics)).toBe(true);
      expect(response.body.data.count).toBe(response.body.data.topics.length);
    });

    it('should return error for missing material', async () => {
      const response = await request(app)
        .post('/api/gemini/topics')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Material is required');
    });
  });

  describe('POST /api/gemini/optimize', () => {
    it('should optimize content successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/optimize')
        .send({
          content: '这是一篇关于人工智能的文章。人工智能有很多应用。',
          focus: 'readability',
          targetAudience: '普通读者'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimizedContent');
      expect(response.body.data).toHaveProperty('improvements');
      expect(response.body.data).toHaveProperty('score');
    });
  });

  describe('POST /api/gemini/summarize', () => {
    it('should summarize content successfully', async () => {
      const longContent = '人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。' +
        '该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。' +
        '人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大。' +
        '可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。' +
        '人工智能可以对人的意识、思维的信息过程的模拟。' +
        '人工智能不是人的智能，但能像人那样思考、也可能超过人的智能。';

      const response = await request(app)
        .post('/api/gemini/summarize')
        .send({
          content: longContent,
          length: 'short'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('originalLength');
      expect(response.body.data).toHaveProperty('summaryLength');
    });
  });

  describe('POST /api/gemini/keywords', () => {
    it('should extract keywords successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/keywords')
        .send({
          content: '机器学习是人工智能的一个核心领域。深度学习是机器学习的一个分支，使用神经网络来模拟人脑的学习过程。',
          count: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('keywords');
      expect(Array.isArray(response.body.data.keywords)).toBe(true);
      expect(response.body.data.count).toBe(response.body.data.keywords.length);
    });
  });

  describe('POST /api/gemini/chat', () => {
    it('should handle chat conversation', async () => {
      const response = await request(app)
        .post('/api/gemini/chat')
        .send({
          messages: [
            { role: 'user', content: '你好，我想了解人工智能' }
          ],
          context: '技术咨询'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('conversationId');
    });

    it('should return error for invalid messages format', async () => {
      const response = await request(app)
        .post('/api/gemini/chat')
        .send({
          messages: 'invalid format'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Messages array is required');
    });
  });

  describe('POST /api/gemini/style', () => {
    it('should convert content style successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/style')
        .send({
          content: '这是一个技术文章，介绍了很多专业知识。',
          targetStyle: '轻松幽默'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('styledContent');
      expect(response.body.data).toHaveProperty('targetStyle');
    });
  });

  describe('POST /api/gemini/expand', () => {
    it('should expand content successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/expand')
        .send({
          content: '人工智能有很多应用领域。',
          expansionPoints: ['具体例子', '实际应用场景', '未来发展趋势']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('expandedContent');
    });
  });

  describe('POST /api/gemini/rewrite', () => {
    it('should rewrite content successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/rewrite')
        .send({
          content: '这个技术很复杂，需要深入学习。',
          rewriteType: 'simplify'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rewrittenContent');
      expect(response.body.data).toHaveProperty('rewriteType');
    });
  });

  describe('POST /api/gemini/translate', () => {
    it('should translate content successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/translate')
        .send({
          content: 'Artificial Intelligence is transforming the world.',
          targetLanguage: '中文',
          sourceLanguage: 'English'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('translatedContent');
      expect(response.body.data).toHaveProperty('targetLanguage');
    });
  });

  describe('GET /api/gemini/statistics', () => {
    it('should retrieve statistics successfully', async () => {
      const response = await request(app)
        .get('/api/gemini/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRequests');
      expect(response.body.data).toHaveProperty('successfulRequests');
      expect(response.body.data).toHaveProperty('failedRequests');
      expect(response.body.data).toHaveProperty('totalTokens');
      expect(response.body.data).toHaveProperty('successRate');
    });
  });

  describe('GET /api/gemini/status', () => {
    it('should retrieve service status successfully', async () => {
      const response = await request(app)
        .get('/api/gemini/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('configured');
      expect(response.body.data).toHaveProperty('model');
      expect(response.body.data).toHaveProperty('statistics');
    });
  });
});