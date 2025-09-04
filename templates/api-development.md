# API 开发模板

## Express API 开发模板

### 1. 控制器模板

```typescript
// src/controllers/resourceController.ts
import { Request, Response } from 'express';
import { ResourceService } from '../services/resourceService';
import { CreateResourceDTO, UpdateResourceDTO } from '../dto/resourceDTO';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';

export class ResourceController {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  /**
   * 获取所有资源
   * @route GET /api/resources
   * @access public
   */
  getAllResources = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, sort } = req.query;
    
    const result = await this.resourceService.getAll({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      sort: sort as string,
    });

    res.json({
      success: true,
      data: result,
      message: 'Resources retrieved successfully',
    });
  });

  /**
   * 根据ID获取资源
   * @route GET /api/resources/:id
   * @access public
   */
  getResourceById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const resource = await this.resourceService.getById(Number(id));
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found',
        },
      });
    }

    res.json({
      success: true,
      data: resource,
      message: 'Resource retrieved successfully',
    });
  });

  /**
   * 创建新资源
   * @route POST /api/resources
   * @access private
   */
  createResource = [
    validateRequest(CreateResourceDTO),
    asyncHandler(async (req: Request, res: Response) => {
      const resourceData: CreateResourceDTO = req.body;
      const userId = req.user?.id; // 从认证中间件获取

      const resource = await this.resourceService.create({
        ...resourceData,
        userId,
      });

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully',
      });
    }),
  ];

  /**
   * 更新资源
   * @route PUT /api/resources/:id
   * @access private
   */
  updateResource = [
    validateRequest(UpdateResourceDTO),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const updateData: UpdateResourceDTO = req.body;
      const userId = req.user?.id;

      const resource = await this.resourceService.update(
        Number(id),
        updateData,
        userId
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found',
          },
        });
      }

      res.json({
        success: true,
        data: resource,
        message: 'Resource updated successfully',
      });
    }),
  ];

  /**
   * 删除资源
   * @route DELETE /api/resources/:id
   * @access private
   */
  deleteResource = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const deleted = await this.resourceService.delete(Number(id), userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found',
        },
      });
    }

    res.json({
      success: true,
      data: null,
      message: 'Resource deleted successfully',
    });
  });

  /**
   * 搜索资源
   * @route GET /api/resources/search
   * @access public
   */
  searchResources = asyncHandler(async (req: Request, res: Response) => {
    const { q, filters } = req.query;
    
    const results = await this.resourceService.search({
      query: q as string,
      filters: filters as Record<string, any>,
    });

    res.json({
      success: true,
      data: results,
      message: 'Search results retrieved successfully',
    });
  });
}
```

### 2. 服务层模板

```typescript
// src/services/resourceService.ts
import { Database } from '../database';
import { CreateResourceDTO, UpdateResourceDTO } from '../dto/resourceDTO';
import { Resource } from '../models/Resource';
import { logger } from '../utils/logger';

export class ResourceService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * 获取所有资源
   */
  async getAll(options: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
  }): Promise<{
    resources: Resource[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page, limit, search, sort } = options;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM resources';
      let countQuery = 'SELECT COUNT(*) as total FROM resources';
      const params: any[] = [];

      // 搜索条件
      if (search) {
        query += ' WHERE title LIKE ? OR description LIKE ?';
        countQuery += ' WHERE title LIKE ? OR description LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }

      // 排序
      if (sort) {
        query += ` ORDER BY ${sort}`;
      } else {
        query += ' ORDER BY created_at DESC';
      }

      // 分页
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // 执行查询
      const resources = await this.db.all(query, params);
      const [{ total }] = await this.db.get(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

      return {
        resources,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in ResourceService.getAll:', error);
      throw new Error('Failed to retrieve resources');
    }
  }

  /**
   * 根据ID获取资源
   */
  async getById(id: number): Promise<Resource | null> {
    try {
      const resource = await this.db.get(
        'SELECT * FROM resources WHERE id = ?',
        [id]
      );
      return resource || null;
    } catch (error) {
      logger.error('Error in ResourceService.getById:', error);
      throw new Error('Failed to retrieve resource');
    }
  }

  /**
   * 创建资源
   */
  async create(data: CreateResourceDTO & { userId: number }): Promise<Resource> {
    try {
      const result = await this.db.run(
        `INSERT INTO resources (title, description, user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [data.title, data.description, data.userId, data.status || 'active']
      );

      const newResource = await this.getById(result.lastID);
      if (!newResource) {
        throw new Error('Failed to create resource');
      }

      return newResource;
    } catch (error) {
      logger.error('Error in ResourceService.create:', error);
      throw new Error('Failed to create resource');
    }
  }

  /**
   * 更新资源
   */
  async update(
    id: number,
    data: UpdateResourceDTO,
    userId: number
  ): Promise<Resource | null> {
    try {
      // 检查资源是否存在且属于当前用户
      const existingResource = await this.getById(id);
      if (!existingResource || existingResource.user_id !== userId) {
        return null;
      }

      const updateFields = [];
      const params = [];

      if (data.title !== undefined) {
        updateFields.push('title = ?');
        params.push(data.title);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        params.push(data.description);
      }
      if (data.status !== undefined) {
        updateFields.push('status = ?');
        params.push(data.status);
      }

      if (updateFields.length === 0) {
        return existingResource;
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await this.db.run(
        `UPDATE resources SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      return await this.getById(id);
    } catch (error) {
      logger.error('Error in ResourceService.update:', error);
      throw new Error('Failed to update resource');
    }
  }

  /**
   * 删除资源
   */
  async delete(id: number, userId: number): Promise<boolean> {
    try {
      // 检查资源是否存在且属于当前用户
      const resource = await this.getById(id);
      if (!resource || resource.user_id !== userId) {
        return false;
      }

      await this.db.run('DELETE FROM resources WHERE id = ?', [id]);
      return true;
    } catch (error) {
      logger.error('Error in ResourceService.delete:', error);
      throw new Error('Failed to delete resource');
    }
  }

  /**
   * 搜索资源
   */
  async search(options: {
    query: string;
    filters?: Record<string, any>;
  }): Promise<Resource[]> {
    try {
      const { query, filters = {} } = options;
      let sql = 'SELECT * FROM resources WHERE (title LIKE ? OR description LIKE ?)';
      const params = [`%${query}%`, `%${query}%`];

      // 添加过滤条件
      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.userId) {
        sql += ' AND user_id = ?';
        params.push(filters.userId);
      }

      sql += ' ORDER BY created_at DESC LIMIT 50';

      return await this.db.all(sql, params);
    } catch (error) {
      logger.error('Error in ResourceService.search:', error);
      throw new Error('Failed to search resources');
    }
  }
}
```

### 3. DTO 模板

```typescript
// src/dto/resourceDTO.ts
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';

export class CreateResourceDTO {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(['active', 'inactive', 'draft'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'draft' = 'active';
}

export class UpdateResourceDTO {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(['active', 'inactive', 'draft'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'draft';
}

export class ResourceQueryDTO {
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sort?: string = 'created_at_desc';
}
```

### 4. 路由模板

```typescript
// src/routes/resourceRoutes.ts
import { Router } from 'express';
import { ResourceController } from '../controllers/resourceController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ResourceQueryDTO } from '../dto/resourceDTO';

const router = Router();
const resourceController = new ResourceController();

/**
 * @route GET /api/resources
 * @desc 获取所有资源
 * @access Public
 */
router.get('/', 
  validateRequest(ResourceQueryDTO, 'query'),
  resourceController.getAllResources
);

/**
 * @route GET /api/resources/:id
 * @desc 根据ID获取资源
 * @access Public
 */
router.get('/:id', resourceController.getResourceById);

/**
 * @route POST /api/resources
 * @desc 创建新资源
 * @access Private
 */
router.post('/', 
  authenticate,
  resourceController.createResource
);

/**
 * @route PUT /api/resources/:id
 * @desc 更新资源
 * @access Private
 */
router.put('/:id', 
  authenticate,
  resourceController.updateResource
);

/**
 * @route DELETE /api/resources/:id
 * @desc 删除资源
 * @access Private
 */
router.delete('/:id', 
  authenticate,
  resourceController.deleteResource
);

/**
 * @route GET /api/resources/search
 * @desc 搜索资源
 * @access Public
 */
router.get('/search', resourceController.searchResources);

export default router;
```

### 5. 中间件模板

```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export const validateRequest = (dtoClass: any, source: 'body' | 'query' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dtoInstance = plainToInstance(dtoClass, req[source]);
      const errors = await validate(dtoInstance);

      if (errors.length > 0) {
        const formattedErrors = errors.map(err => ({
          field: err.property,
          constraints: err.constraints,
          value: err.value,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formattedErrors,
          },
        });
      }

      // 将验证后的数据附加到请求对象
      req[source] = dtoInstance;
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### 6. 工具函数模板

```typescript
// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### 7. 测试模板

```typescript
// tests/controllers/resourceController.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { Database } from '../../src/database';

describe('ResourceController', () => {
  beforeAll(async () => {
    // 初始化数据库
    await Database.getInstance().initialize();
  });

  afterAll(async () => {
    // 关闭数据库连接
    await Database.getInstance().close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await Database.getInstance().clear();
  });

  describe('GET /api/resources', () => {
    it('should return all resources', async () => {
      const response = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.resources).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/resources?page=1&limit=5')
        .expect(200);

      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        pages: expect.any(Number),
      });
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/resources?search=test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/resources', () => {
    it('should create a new resource', async () => {
      const resourceData = {
        title: 'Test Resource',
        description: 'Test Description',
      };

      const response = await request(app)
        .post('/api/resources')
        .send(resourceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(resourceData.title);
      expect(response.body.data.description).toBe(resourceData.description);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/resources/:id', () => {
    it('should return resource by ID', async () => {
      // 先创建一个资源
      const createResponse = await request(app)
        .post('/api/resources')
        .send({ title: 'Test Resource' });

      const resourceId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/resources/${resourceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(resourceId);
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/resources/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
```

## API 开发检查清单

### 控制器检查清单
- [ ] 所有路由都有适当的 HTTP 方法装饰器
- [ ] 所有路由都有完整的 JSDoc 注释
- [ ] 输入验证完整
- [ ] 错误处理完善
- [ ] 使用 asyncHandler 包装异步函数
- [ ] 权限控制中间件正确应用
- [ ] 响应格式统一
- [ ] 状态码使用正确

### 服务层检查清单
- [ ] 业务逻辑与控制器分离
- [ ] 数据库操作使用参数化查询
- [ ] 错误处理完善
- [ ] 日志记录完整
- [ ] 事务处理正确
- [ ] 性能优化（索引、缓存）
- [ ] 单元测试覆盖

### DTO 检查清单
- [ ] 所有字段都有适当的验证装饰器
- [ ] 类型定义完整
- [ ] 必填字段标记正确
- [ ] 字段长度限制合理
- [ ] 枚举值定义完整

### 路由检查清单
- [ ] 路由命名符合 RESTful 规范
- [ ] 路由参数验证
- [ ] 查询参数验证
- [ ] 路由组织合理
- [ ] 版本控制策略

### 安全检查清单
- [ ] 输入验证和消毒
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 认证和授权
- [ ] 速率限制
- [ ] 敏感数据加密
- [ ] CORS 配置

### 性能检查清单
- [ ] 数据库查询优化
- [ ] 分页实现
- [ ] 缓存策略
- [ ] 响应时间监控
- [ ] 内存使用优化

---

这个模板提供了完整的 Express API 开发规范和最佳实践。请根据具体需求调整模板内容。