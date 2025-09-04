import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { PromptTemplateModel } from '../database/models/PromptTemplate';
import { TopicModel } from '../database/models/Topic';
import { 
  PromptTemplate, 
  CreatePromptTemplateDto,
  QueryResult
} from '../database/models/types';
import Database from '../database/init';

export class PromptTemplateController {
  private templateModel: PromptTemplateModel;
  private topicModel: TopicModel;

  constructor(database: Database) {
    this.templateModel = new PromptTemplateModel(database);
    this.topicModel = new TopicModel(database);
  }

  // 创建模板
  async createTemplate(req: Request, res: Response) {
    try {
      const templateData: CreatePromptTemplateDto = req.body;

      // 验证模板
      const validation = await this.templateModel.validateTemplate(templateData.template);
      if (!validation.valid) {
        throw new AppError(`模板验证失败: ${validation.errors.join(', ')}`, 400);
      }

      const template = await this.templateModel.create(templateData);

      res.json({
        success: true,
        data: template,
        message: '模板创建成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建模板失败', 500, error);
    }
  }

  // 获取模板列表
  async getTemplates(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        is_default,
        search
      } = req.query;

      const result = await this.templateModel.findAll({
        page: Number(page),
        limit: Number(limit),
        type: type as string,
        is_default: is_default === 'true',
        search: search as string
      });

      res.json({
        success: true,
        data: {
          templates: result.data,
          total: result.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(result.total / Number(limit))
        },
        message: '获取模板列表成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取模板列表失败', 500, error);
    }
  }

  // 获取模板详情
  async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await this.templateModel.findById(id);

      if (!template) {
        throw new AppError('模板不存在', 404);
      }

      res.json({
        success: true,
        data: template,
        message: '获取模板详情成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取模板详情失败', 500, error);
    }
  }

  // 更新模板
  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existing = await this.templateModel.findById(id);
      if (!existing) {
        throw new AppError('模板不存在', 404);
      }

      // 如果更新了模板内容，验证新模板
      if (updateData.template) {
        const validation = await this.templateModel.validateTemplate(updateData.template);
        if (!validation.valid) {
          throw new AppError(`模板验证失败: ${validation.errors.join(', ')}`, 400);
        }
      }

      const updated = await this.templateModel.update(id, updateData);

      res.json({
        success: true,
        data: updated,
        message: '模板更新成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新模板失败', 500, error);
    }
  }

  // 删除模板
  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.templateModel.delete(id);

      if (!deleted) {
        throw new AppError('模板不存在', 404);
      }

      res.json({
        success: true,
        data: { id },
        message: '模板删除成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除模板失败', 500, error);
    }
  }

  // 渲染模板
  async renderTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { variables } = req.body;

      if (!variables || typeof variables !== 'object') {
        throw new AppError('变量必须是对象', 400);
      }

      const rendered = await this.templateModel.renderTemplate(id, variables);

      res.json({
        success: true,
        data: {
          templateId: id,
          variables,
          rendered
        },
        message: '模板渲染成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('模板渲染失败', 500, error);
    }
  }

  // 设置默认模板
  async setDefaultTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await this.templateModel.setAsDefault(id);

      if (!template) {
        throw new AppError('模板不存在', 404);
      }

      res.json({
        success: true,
        data: template,
        message: '设置默认模板成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('设置默认模板失败', 500, error);
    }
  }

  // 获取模板分类
  async getTemplateCategories(req: Request, res: Response) {
    try {
      const templates = await this.templateModel.findAll();
      const categories = [...new Set(templates.data.map(t => t.type))];

      res.json({
        success: true,
        data: {
          categories,
          total: categories.length
        },
        message: '获取模板分类成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取模板分类失败', 500, error);
    }
  }

  // 根据类型获取模板
  async getTemplatesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { includeDefault } = req.query;

      let templates;
      if (includeDefault === 'true') {
        const defaultTemplate = await this.templateModel.findDefaultByType(type);
        const allTemplates = await this.templateModel.findByType(type);
        templates = defaultTemplate ? [defaultTemplate, ...allTemplates.filter(t => t.id !== defaultTemplate.id)] : allTemplates;
      } else {
        templates = await this.templateModel.findByType(type);
      }

      res.json({
        success: true,
        data: {
          type,
          templates,
          total: templates.length
        },
        message: '获取类型模板成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取类型模板失败', 500, error);
    }
  }

  // 验证模板
  async validateTemplate(req: Request, res: Response) {
    try {
      const { template } = req.body;

      if (!template) {
        throw new AppError('模板内容不能为空', 400);
      }

      const validation = await this.templateModel.validateTemplate(template);

      res.json({
        success: true,
        data: validation,
        message: '模板验证完成'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('模板验证失败', 500, error);
    }
  }

  // 获取模板使用统计
  async getTemplateStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const template = await this.templateModel.findById(id);
      if (!template) {
        throw new AppError('模板不存在', 404);
      }

      // 获取使用该模板生成的选题数量
      const topics = await this.topicModel.findByMaterialId(''); // 这里需要修改TopicModel的查询方法
      const usageCount = topics.filter(topic => topic.template_id === id).length;

      // 获取模板统计
      const stats = await this.templateModel.getStats();

      res.json({
        success: true,
        data: {
          templateId: id,
          usageCount,
          templateStats: stats,
          performance: {
            averageScore: topics.length > 0 
              ? topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length 
              : 0,
            totalTopics: topics.length,
            selectedTopics: topics.filter(topic => topic.status === 'selected').length
          }
        },
        message: '获取模板统计成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取模板统计失败', 500, error);
    }
  }

  // 推荐模板
  async getRecommendedTemplates(req: Request, res: Response) {
    try {
      const { type, materialId } = req.query;

      let templates;
      if (type) {
        templates = await this.templateModel.findByType(type as string);
      } else {
        const result = await this.templateModel.findAll({ limit: 20 });
        templates = result.data;
      }

      // 简单的推荐算法：优先推荐默认模板和使用频率高的模板
      const recommended = templates
        .sort((a, b) => {
          // 默认模板优先
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          // 按创建时间排序
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          templates: recommended,
          total: recommended.length,
          filters: {
            type: type || 'all',
            materialId: materialId || null
          }
        },
        message: '获取推荐模板成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取推荐模板失败', 500, error);
    }
  }

  // 复制模板
  async duplicateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const original = await this.templateModel.findById(id);
      if (!original) {
        throw new AppError('模板不存在', 404);
      }

      const duplicateData: CreatePromptTemplateDto = {
        name: name || `${original.name} (副本)`,
        type: original.type,
        template: original.template,
        is_default: false, // 副本不能是默认模板
        description: original.description,
        category: original.category,
        variables: original.variables,
        is_public: original.is_public
      };

      const duplicate = await this.templateModel.create(duplicateData);

      res.json({
        success: true,
        data: {
          originalId: id,
          duplicate,
          message: '模板复制成功'
        },
        message: '模板复制成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('模板复制失败', 500, error);
    }
  }

  // 批量操作模板
  async batchUpdateTemplates(req: Request, res: Response) {
    try {
      const { templateIds, action, data } = req.body;

      if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
        throw new AppError('模板ID列表不能为空', 400);
      }

      if (!action) {
        throw new AppError('操作类型不能为空', 400);
      }

      const validActions = ['delete', 'update_category', 'set_public', 'set_private'];
      if (!validActions.includes(action)) {
        throw new AppError('无效的操作类型', 400);
      }

      const results = [];
      for (const templateId of templateIds) {
        try {
          let result;
          switch (action) {
            case 'delete':
              result = await this.templateModel.delete(templateId);
              break;
            case 'update_category':
              result = await this.templateModel.update(templateId, { category: data.category });
              break;
            case 'set_public':
              result = await this.templateModel.update(templateId, { is_public: true });
              break;
            case 'set_private':
              result = await this.templateModel.update(templateId, { is_public: false });
              break;
          }
          results.push({ templateId, success: true, result });
        } catch (error) {
          results.push({
            templateId,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            totalTemplates: templateIds.length,
            successCount,
            failureCount: templateIds.length - successCount,
            action
          }
        },
        message: `批量操作完成，成功处理${successCount}/${templateIds.length}个模板`
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('批量操作模板失败', 500, error);
    }
  }
}