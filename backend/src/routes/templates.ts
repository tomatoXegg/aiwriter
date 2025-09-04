import { Router } from 'express';
import { PromptTemplateController } from '../controllers/promptTemplateController';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();
const templateController = new PromptTemplateController(require('../database/init').default);

// 创建模板
router.post('/', [
  body('name').notEmpty().withMessage('模板名称不能为空'),
  body('type').isIn(['topic', 'content', 'review']).withMessage('模板类型必须是topic、content或review'),
  body('template').notEmpty().withMessage('模板内容不能为空'),
  body('is_default').optional().isBoolean().withMessage('默认设置必须是布尔值'),
  body('is_public').optional().isBoolean().withMessage('公开设置必须是布尔值'),
  validateRequest
], templateController.createTemplate);

// 获取模板列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('type').optional().isIn(['topic', 'content', 'review']).withMessage('模板类型必须是topic、content或review'),
  query('is_default').optional().isBoolean().withMessage('默认设置必须是布尔值'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  validateRequest
], templateController.getTemplates);

// 获取模板详情
router.get('/:id', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  validateRequest
], templateController.getTemplateById);

// 更新模板
router.put('/:id', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  body('name').optional().isString().withMessage('模板名称必须是字符串'),
  body('type').optional().isIn(['topic', 'content', 'review']).withMessage('模板类型必须是topic、content或review'),
  body('template').optional().isString().withMessage('模板内容必须是字符串'),
  body('is_default').optional().isBoolean().withMessage('默认设置必须是布尔值'),
  body('is_public').optional().isBoolean().withMessage('公开设置必须是布尔值'),
  validateRequest
], templateController.updateTemplate);

// 删除模板
router.delete('/:id', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  validateRequest
], templateController.deleteTemplate);

// 渲染模板
router.post('/:id/render', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  body('variables').isObject().withMessage('变量必须是对象'),
  validateRequest
], templateController.renderTemplate);

// 设置默认模板
router.put('/:id/default', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  validateRequest
], templateController.setDefaultTemplate);

// 获取模板分类
router.get('/categories/list', templateController.getTemplateCategories);

// 根据类型获取模板
router.get('/type/:type', [
  param('type').isIn(['topic', 'content', 'review']).withMessage('模板类型必须是topic、content或review'),
  query('includeDefault').optional().isBoolean().withMessage('包含默认必须是布尔值'),
  validateRequest
], templateController.getTemplatesByType);

// 验证模板
router.post('/validate', [
  body('template').notEmpty().withMessage('模板内容不能为空'),
  validateRequest
], templateController.validateTemplate);

// 获取模板使用统计
router.get('/:id/stats', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  validateRequest
], templateController.getTemplateStats);

// 推荐模板
router.get('/recommend/list', [
  query('type').optional().isIn(['topic', 'content', 'review']).withMessage('模板类型必须是topic、content或review'),
  query('materialId').optional().isString().withMessage('素材ID必须是字符串'),
  validateRequest
], templateController.getRecommendedTemplates);

// 复制模板
router.post('/:id/duplicate', [
  param('id').isString().withMessage('模板ID必须是字符串'),
  body('name').optional().isString().withMessage('模板名称必须是字符串'),
  validateRequest
], templateController.duplicateTemplate);

// 批量操作模板
router.post('/batch', [
  body('templateIds').isArray({ min: 1, max: 50 }).withMessage('模板ID列表必须是数组，且最多50个'),
  body('templateIds.*').isString().withMessage('模板ID必须是字符串'),
  body('action').isIn(['delete', 'update_category', 'set_public', 'set_private']).withMessage('操作类型必须是delete、update_category、set_public或set_private'),
  body('data').optional().isObject().withMessage('操作数据必须是对象'),
  validateRequest
], templateController.batchUpdateTemplates);

export default router;