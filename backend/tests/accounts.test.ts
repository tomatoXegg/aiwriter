import request from 'supertest';
import { app } from '../src/index';
import { Database } from '../src/database/init';

describe('Account API', () => {
  let db: Database;

  beforeAll(async () => {
    // 设置测试数据库
    db = new Database(':memory:');
    await db.initialize();
    
    // 等待数据库初始化完成
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  beforeEach(async () => {
    // 清理数据库
    await db.run('DELETE FROM accounts');
  });

  describe('POST /api/accounts', () => {
    it('应该成功创建账号', async () => {
      const accountData = {
        name: '测试账号',
        description: '这是一个测试账号',
        platform: 'wechat'
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(accountData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(accountData.name);
      expect(response.body.data.platform).toBe(accountData.platform);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.id).toBeDefined();
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('name is required');
    });

    it('应该验证平台类型', async () => {
      const accountData = {
        name: '测试账号',
        platform: 'invalid_platform'
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(accountData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Platform must be one of');
    });

    it('应该使用默认平台', async () => {
      const accountData = {
        name: '测试账号',
        description: '这是一个测试账号'
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(accountData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe('wechat');
    });
  });

  describe('GET /api/accounts', () => {
    beforeEach(async () => {
      // 创建测试数据
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES 
        ('1', '账号1', '描述1', 'wechat', 'active', 5, '2023-01-01T00:00:00Z'),
        ('2', '账号2', '描述2', 'weibo', 'inactive', 3, '2023-01-02T00:00:00Z'),
        ('3', '账号3', '描述3', 'wechat', 'active', 8, '2023-01-03T00:00:00Z')
      `);
    });

    it('应该获取所有账号', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/accounts?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('应该支持状态过滤', async () => {
      const response = await request(app)
        .get('/api/accounts?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toHaveLength(2);
      expect(response.body.data.accounts.every((acc: any) => acc.status === 'active')).toBe(true);
    });

    it('应该支持平台过滤', async () => {
      const response = await request(app)
        .get('/api/accounts?platform=wechat')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toHaveLength(2);
      expect(response.body.data.accounts.every((acc: any) => acc.platform === 'wechat')).toBe(true);
    });

    it('应该支持搜索', async () => {
      const response = await request(app)
        .get('/api/accounts?search=账号1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toHaveLength(1);
      expect(response.body.data.accounts[0].name).toBe('账号1');
    });
  });

  describe('GET /api/accounts/:id', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES ('1', '测试账号', '测试描述', 'wechat', 'active', 5, '2023-01-01T00:00:00Z')
      `);
    });

    it('应该获取指定账号', async () => {
      const response = await request(app)
        .get('/api/accounts/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
      expect(response.body.data.name).toBe('测试账号');
    });

    it('应该返回404当账号不存在', async () => {
      const response = await request(app)
        .get('/api/accounts/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account not found');
    });
  });

  describe('PUT /api/accounts/:id', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES ('1', '原始账号', '原始描述', 'wechat', 'active', 5, '2023-01-01T00:00:00Z')
      `);
    });

    it('应该更新账号', async () => {
      const updateData = {
        name: '更新后的账号',
        description: '更新后的描述',
        status: 'inactive'
      };

      const response = await request(app)
        .put('/api/accounts/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('应该部分更新账号', async () => {
      const updateData = {
        name: '仅更新名称'
      };

      const response = await request(app)
        .put('/api/accounts/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe('原始描述'); // 保持不变
    });

    it('应该返回404当账号不存在', async () => {
      const response = await request(app)
        .put('/api/accounts/nonexistent')
        .send({ name: '新名称' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account not found');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES ('1', '要删除的账号', '测试描述', 'wechat', 'active', 5, '2023-01-01T00:00:00Z')
      `);
    });

    it('应该删除账号', async () => {
      const response = await request(app)
        .delete('/api/accounts/1')
        .expect(204);

      // 验证账号已被删除
      const getResponse = await request(app)
        .get('/api/accounts/1')
        .expect(404);
    });

    it('应该返回404当账号不存在', async () => {
      const response = await request(app)
        .delete('/api/accounts/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account not found');
    });
  });

  describe('POST /api/accounts/:id/activate', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES ('1', '非活跃账号', '测试描述', 'wechat', 'inactive', 5, '2023-01-01T00:00:00Z')
      `);
    });

    it('应该激活账号', async () => {
      const response = await request(app)
        .post('/api/accounts/1/activate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('应该返回404当账号不存在', async () => {
      const response = await request(app)
        .post('/api/accounts/nonexistent/activate')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account not found');
    });
  });

  describe('POST /api/accounts/:id/deactivate', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES ('1', '活跃账号', '测试描述', 'wechat', 'active', 5, '2023-01-01T00:00:00Z')
      `);
    });

    it('应该停用账号', async () => {
      const response = await request(app)
        .post('/api/accounts/1/deactivate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });
  });

  describe('PUT /api/accounts/status/bulk', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES 
        ('1', '账号1', '描述1', 'wechat', 'active', 5, '2023-01-01T00:00:00Z'),
        ('2', '账号2', '描述2', 'weibo', 'active', 3, '2023-01-02T00:00:00Z'),
        ('3', '账号3', '描述3', 'wechat', 'inactive', 8, '2023-01-03T00:00:00Z')
      `);
    });

    it('应该批量更新状态', async () => {
      const bulkData = {
        accountIds: ['1', '2'],
        status: 'inactive'
      };

      const response = await request(app)
        .put('/api/accounts/status/bulk')
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(2);
      expect(response.body.data.failureCount).toBe(0);
      expect(response.body.data.status).toBe('inactive');
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .put('/api/accounts/status/bulk')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Account IDs array is required');
    });

    it('应该验证状态类型', async () => {
      const bulkData = {
        accountIds: ['1', '2'],
        status: 'invalid_status'
      };

      const response = await request(app)
        .put('/api/accounts/status/bulk')
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Status must be one of');
    });
  });

  describe('GET /api/accounts/:id/stats', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES ('1', '统计账号', '测试描述', 'wechat', 'active', 15, '2023-01-01T00:00:00Z')
      `);
    });

    it('应该获取账号统计', async () => {
      const response = await request(app)
        .get('/api/accounts/1/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accountId).toBe('1');
      expect(response.body.data.accountName).toBe('统计账号');
      expect(response.body.data.totalContent).toBe(15);
      expect(response.body.data.platform).toBe('wechat');
      expect(response.body.data.status).toBe('active');
    });
  });

  describe('GET /api/accounts/stats/overview', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES 
        ('1', '活跃账号1', '描述1', 'wechat', 'active', 5, '2023-01-01T00:00:00Z'),
        ('2', '活跃账号2', '描述2', 'weibo', 'active', 3, '2023-01-02T00:00:00Z'),
        ('3', '非活跃账号', '描述3', 'wechat', 'inactive', 8, '2023-01-03T00:00:00Z')
      `);
    });

    it('应该获取所有账号统计', async () => {
      const response = await request(app)
        .get('/api/accounts/stats/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.active).toBe(2);
      expect(response.body.data.inactive).toBe(1);
      expect(response.body.data.byPlatform.wechat).toBe(2);
      expect(response.body.data.byPlatform.weibo).toBe(1);
    });
  });

  describe('GET /api/accounts/activity', () => {
    beforeEach(async () => {
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES 
        ('1', '活跃账号', '描述1', 'wechat', 'active', 5, '2023-01-01T00:00:00Z'),
        ('2', '非活跃账号', '描述2', 'weibo', 'inactive', 0, '2023-01-02T00:00:00Z')
      `);
    });

    it('应该获取账号活跃度', async () => {
      const response = await request(app)
        .get('/api/accounts/activity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activeAccounts).toBe(1);
      expect(response.body.data.inactiveAccounts).toBe(1);
      expect(response.body.data.recentActivity).toBeDefined();
      expect(response.body.data.inactiveList).toBeDefined();
    });
  });

  describe('GET /api/accounts/trends', () => {
    beforeEach(async () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      await db.run(`
        INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
        VALUES 
        ('1', '今日账号', '描述1', 'wechat', 'active', 5, ?),
        ('2', '昨日账号', '描述2', 'weibo', 'active', 3, ?)
      `, [today, yesterday]);
    });

    it('应该获取账号创建趋势', async () => {
      const response = await request(app)
        .get('/api/accounts/trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.period.days).toBe(30);
    });

    it('应该支持自定义时间范围', async () => {
      const response = await request(app)
        .get('/api/accounts/trends?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period.days).toBe(7);
    });
  });
});