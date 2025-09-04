import request from 'supertest';
import { app } from '../src/index';
import Database from '../src/database/init';
import { TopicModel } from '../src/database/models/Topic';
import { PromptTemplateModel } from '../src/database/models/PromptTemplate';
import { MaterialModel } from '../src/database/models/Material';

describe('Topic API Tests', () => {
  let db: Database;
  let topicModel: TopicModel;
  let templateModel: PromptTemplateModel;
  let materialModel: MaterialModel;

  beforeAll(async () => {
    db = new Database();
    await db.initialize();
    topicModel = new TopicModel(db);
    templateModel = new PromptTemplateModel(db);
    materialModel = new MaterialModel(db);
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  beforeEach(async () => {
    // 清理测试数据
    await db.run('DELETE FROM topics');
    await db.run('DELETE FROM prompt_templates');
    await db.run('DELETE FROM materials');
  });

  describe('POST /api/topics/generate', () => {
    it('should generate topics successfully', async () => {
      // 创建测试素材
      const material = await materialModel.create({
        title: '测试素材',
        content: '这是一个关于人工智能发展的素材内容，包含了最新的技术趋势和应用案例。',
        tags: ['AI', '技术'],
        type: 'text'
      });

      const response = await request(app)
        .post('/api/topics/generate')
        .send({
          materialId: material.id,
          count: 3,
          style: '专业科普',
          category: '技术'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(3);
      expect(response.body.data.materialId).toBe(material.id);
      expect(response.body.data.total).toBe(3);
    });

    it('should return error when materialId is missing', async () => {
      const response = await request(app)
        .post('/api/topics/generate')
        .send({
          count: 3
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('素材ID不能为空');
    });

    it('should return error when material not found', async () => {
      const response = await request(app)
        .post('/api/topics/generate')
        .send({
          materialId: 'non-existent-id',
          count: 3
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('素材不存在');
    });
  });

  describe('POST /api/topics/generate/batch', () => {
    it('should generate topics for multiple materials', async () => {
      // 创建测试素材
      const material1 = await materialModel.create({
        title: '素材1',
        content: '素材1内容',
        tags: ['tag1'],
        type: 'text'
      });

      const material2 = await materialModel.create({
        title: '素材2',
        content: '素材2内容',
        tags: ['tag2'],
        type: 'text'
      });

      const response = await request(app)
        .post('/api/topics/generate/batch')
        .send({
          materialIds: [material1.id, material2.id],
          count: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.summary.totalMaterials).toBe(2);
      expect(response.body.data.summary.successCount).toBe(2);
    });

    it('should return error when materialIds array is empty', async () => {
      const response = await request(app)
        .post('/api/topics/generate/batch')
        .send({
          materialIds: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('素材ID列表不能为空');
    });

    it('should return error when too many materials', async () => {
      const materialIds = Array(11).fill('test-id');
      
      const response = await request(app)
        .post('/api/topics/generate/batch')
        .send({
          materialIds
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('一次最多处理10个素材');
    });
  });

  describe('POST /api/topics/generate/custom', () => {
    it('should generate topics with custom prompt', async () => {
      const response = await request(app)
        .post('/api/topics/generate/custom')
        .send({
          prompt: '基于区块链技术，生成3个关于数字货币的选题',
          count: 3,
          category: '区块链'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(3);
      expect(response.body.data.isCustom).toBe(true);
    });

    it('should return error when prompt is missing', async () => {
      const response = await request(app)
        .post('/api/topics/generate/custom')
        .send({
          count: 3
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('自定义prompt不能为空');
    });
  });

  describe('GET /api/topics', () => {
    beforeEach(async () => {
      // 创建测试数据
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      await topicModel.create({
        title: '选题1',
        description: '描述1',
        material_id: material.id,
        category: '技术',
        score: 8
      });

      await topicModel.create({
        title: '选题2',
        description: '描述2',
        material_id: material.id,
        category: '生活',
        score: 6
      });
    });

    it('should get topics list', async () => {
      const response = await request(app)
        .get('/api/topics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter topics by category', async () => {
      const response = await request(app)
        .get('/api/topics?category=技术')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(1);
      expect(response.body.data.topics[0].category).toBe('技术');
    });

    it('should filter topics by min score', async () => {
      const response = await request(app)
        .get('/api/topics?min_score=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(1);
      expect(response.body.data.topics[0].score).toBeGreaterThanOrEqual(7);
    });

    it('should paginate topics', async () => {
      const response = await request(app)
        .get('/api/topics?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
      expect(response.body.data.totalPages).toBe(2);
    });
  });

  describe('GET /api/topics/:id', () => {
    it('should get topic by id', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic = await topicModel.create({
        title: '测试选题',
        description: '测试描述',
        material_id: material.id
      });

      const response = await request(app)
        .get(`/api/topics/${topic.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(topic.id);
      expect(response.body.data.title).toBe('测试选题');
    });

    it('should return error when topic not found', async () => {
      const response = await request(app)
        .get('/api/topics/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('选题不存在');
    });
  });

  describe('PUT /api/topics/:id', () => {
    it('should update topic successfully', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic = await topicModel.create({
        title: '原标题',
        description: '原描述',
        material_id: material.id
      });

      const response = await request(app)
        .put(`/api/topics/${topic.id}`)
        .send({
          title: '新标题',
          category: '新分类',
          tags: ['新标签']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('新标题');
      expect(response.body.data.category).toBe('新分类');
    });

    it('should return error when topic not found', async () => {
      const response = await request(app)
        .put('/api/topics/non-existent-id')
        .send({
          title: '新标题'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('选题不存在');
    });
  });

  describe('PUT /api/topics/:id/status', () => {
    it('should update topic status successfully', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic = await topicModel.create({
        title: '测试选题',
        description: '测试描述',
        material_id: material.id
      });

      const response = await request(app)
        .put(`/api/topics/${topic.id}/status`)
        .send({
          status: 'selected'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('selected');
    });

    it('should return error for invalid status', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic = await topicModel.create({
        title: '测试选题',
        description: '测试描述',
        material_id: material.id
      });

      const response = await request(app)
        .put(`/api/topics/${topic.id}/status`)
        .send({
          status: 'invalid_status'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的状态值');
    });
  });

  describe('DELETE /api/topics/:id', () => {
    it('should delete topic successfully', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic = await topicModel.create({
        title: '测试选题',
        description: '测试描述',
        material_id: material.id
      });

      const response = await request(app)
        .delete(`/api/topics/${topic.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(topic.id);

      // 验证删除成功
      const deleted = await topicModel.findById(topic.id);
      expect(deleted).toBeNull();
    });

    it('should return error when topic not found', async () => {
      const response = await request(app)
        .delete('/api/topics/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('选题不存在');
    });
  });

  describe('POST /api/topics/:id/evaluate', () => {
    it('should evaluate topic successfully', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic = await topicModel.create({
        title: '测试选题',
        description: '测试描述',
        material_id: material.id
      });

      const response = await request(app)
        .post(`/api/topics/${topic.id}/evaluate`)
        .send({
          criteria: {
            relevance: 8,
            creativity: 7,
            feasibility: 9
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topicId).toBe(topic.id);
      expect(response.body.data.evaluation).toBeDefined();
    });

    it('should return error when topic not found', async () => {
      const response = await request(app)
        .post('/api/topics/non-existent-id/evaluate')
        .send({
          criteria: {
            relevance: 8
          }
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('选题不存在');
    });
  });

  describe('GET /api/topics/stats/overview', () => {
    it('should get topic statistics', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      await topicModel.create({
        title: '选题1',
        description: '描述1',
        material_id: material.id,
        score: 8
      });

      await topicModel.create({
        title: '选题2',
        description: '描述2',
        material_id: material.id,
        score: 6
      });

      const response = await request(app)
        .get('/api/topics/stats/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.averageScore).toBe(7);
    });
  });

  describe('POST /api/topics/batch', () => {
    it('should batch update topics successfully', async () => {
      const material = await materialModel.create({
        title: '测试素材',
        content: '测试内容',
        tags: ['test'],
        type: 'text'
      });

      const topic1 = await topicModel.create({
        title: '选题1',
        description: '描述1',
        material_id: material.id
      });

      const topic2 = await topicModel.create({
        title: '选题2',
        description: '描述2',
        material_id: material.id
      });

      const response = await request(app)
        .post('/api/topics/batch')
        .send({
          topicIds: [topic1.id, topic2.id],
          action: 'update_status',
          data: {
            status: 'selected'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.summary.successCount).toBe(2);
    });

    it('should return error for invalid action', async () => {
      const response = await request(app)
        .post('/api/topics/batch')
        .send({
          topicIds: ['test-id'],
          action: 'invalid_action'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的操作类型');
    });
  });
});

describe('Prompt Template API Tests', () => {
  let db: Database;
  let templateModel: PromptTemplateModel;

  beforeAll(async () => {
    db = new Database();
    await db.initialize();
    templateModel = new PromptTemplateModel(db);
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  beforeEach(async () => {
    await db.run('DELETE FROM prompt_templates');
  });

  describe('POST /api/templates', () => {
    it('should create template successfully', async () => {
      const templateData = {
        name: '测试模板',
        type: 'topic',
        template: '基于{material}生成{count}个{style}风格的选题',
        is_default: false
      };

      const response = await request(app)
        .post('/api/templates')
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试模板');
      expect(response.body.data.type).toBe('topic');
    });

    it('should return error for invalid template type', async () => {
      const response = await request(app)
        .post('/api/templates')
        .send({
          name: '测试模板',
          type: 'invalid_type',
          template: '测试模板内容'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('模板类型必须是topic、content或review');
    });

    it('should return error for invalid template format', async () => {
      const response = await request(app)
        .post('/api/templates')
        .send({
          name: '测试模板',
          type: 'topic',
          template: '模板包含不匹配的{括号'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('模板验证失败');
    });
  });

  describe('GET /api/templates', () => {
    beforeEach(async () => {
      await templateModel.create({
        name: '模板1',
        type: 'topic',
        template: '模板1内容'
      });

      await templateModel.create({
        name: '模板2',
        type: 'content',
        template: '模板2内容'
      });
    });

    it('should get templates list', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter templates by type', async () => {
      const response = await request(app)
        .get('/api/templates?type=topic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(1);
      expect(response.body.data.templates[0].type).toBe('topic');
    });

    it('should search templates', async () => {
      const response = await request(app)
        .get('/api/templates?search=模板1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(1);
      expect(response.body.data.templates[0].name).toBe('模板1');
    });
  });

  describe('POST /api/templates/:id/render', () => {
    it('should render template successfully', async () => {
      const template = await templateModel.create({
        name: '测试模板',
        type: 'topic',
        template: '基于{material}生成{count}个{style}风格的选题'
      });

      const response = await request(app)
        .post(`/api/templates/${template.id}/render`)
        .send({
          variables: {
            material: 'AI技术',
            count: 5,
            style: '专业科普'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rendered).toBe('基于AI技术生成5个专业科普风格的选题');
    });

    it('should return error when variables missing', async () => {
      const template = await templateModel.create({
        name: '测试模板',
        type: 'topic',
        template: '基于{material}生成选题'
      });

      const response = await request(app)
        .post(`/api/templates/${template.id}/render`)
        .send({
          variables: {}
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/templates/:id/default', () => {
    it('should set template as default successfully', async () => {
      const template = await templateModel.create({
        name: '测试模板',
        type: 'topic',
        template: '模板内容',
        is_default: false
      });

      const response = await request(app)
        .put(`/api/templates/${template.id}/default`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(true);
    });
  });

  describe('GET /api/templates/categories/list', () => {
    it('should get template categories', async () => {
      await templateModel.create({
        name: '模板1',
        type: 'topic',
        template: '模板1内容'
      });

      await templateModel.create({
        name: '模板2',
        type: 'content',
        template: '模板2内容'
      });

      const response = await request(app)
        .get('/api/templates/categories/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toContain('topic');
      expect(response.body.data.categories).toContain('content');
    });
  });

  describe('POST /api/templates/validate', () => {
    it('should validate valid template', async () => {
      const response = await request(app)
        .post('/api/templates/validate')
        .send({
          template: '这是一个{valid}模板格式'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should return validation errors for invalid template', async () => {
      const response = await request(app)
        .post('/api/templates/validate')
        .send({
          template: '模板包含不匹配的{括号'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });
});