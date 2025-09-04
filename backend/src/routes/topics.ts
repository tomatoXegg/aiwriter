import { Router } from 'express';
import { TopicController } from '../controllers/topicController';
import { AppError } from '../middleware/errorHandler';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();
const topicController = new TopicController(require('../database/init').default);

// 生成选题
router.post('/generate', [
  body('materialId').notEmpty().withMessage('素材ID不能为空'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('生成数量必须在1-20之间'),
  body('style').optional().isString().withMessage('写作风格必须是字符串'),
  body('category').optional().isString().withMessage('分类必须是字符串'),
  body('targetAudience').optional().isString().withMessage('目标读者必须是字符串'),
  body('difficultyLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('难度级别必须是beginner、intermediate或advanced'),
  validateRequest
], topicController.generateTopics);

// 批量生成选题
router.post('/generate/batch', [
  body('materialIds').isArray({ min: 1, max: 10 }).withMessage('素材ID列表必须是数组，且最多10个'),
  body('materialIds.*').isString().withMessage('素材ID必须是字符串'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('生成数量必须在1-20之间'),
  validateRequest
], topicController.generateBatchTopics);

// 自定义选题生成
router.post('/generate/custom', [
  body('prompt').notEmpty().withMessage('自定义prompt不能为空'),
  body('materialId').optional().isString().withMessage('素材ID必须是字符串'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('生成数量必须在1-20之间'),
  validateRequest
], topicController.generateCustomTopics);

// 获取选题列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('status').optional().isString().withMessage('状态必须是字符串'),
  query('material_id').optional().isString().withMessage('素材ID必须是字符串'),
  query('category').optional().isString().withMessage('分类必须是字符串'),
  query('min_score').optional().isFloat({ min: 0, max: 10 }).withMessage('最低分数必须在0-10之间'),
  query('max_score').optional().isFloat({ min: 0, max: 10 }).withMessage('最高分数必须在0-10之间'),
  query('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('难度级别必须是beginner、intermediate或advanced'),
  query('target_audience').optional().isString().withMessage('目标读者必须是字符串'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('sortBy').optional().isString().withMessage('排序字段必须是字符串'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('排序顺序必须是ASC或DESC'),
  validateRequest
], topicController.getTopics);

// 获取选题详情
router.get('/:id', [
  param('id').isString().withMessage('选题ID必须是字符串'),
  validateRequest
], topicController.getTopicById);

// 更新选题
router.put('/:id', [
  param('id').isString().withMessage('选题ID必须是字符串'),
  body('title').optional().isString().withMessage('标题必须是字符串'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('category').optional().isString().withMessage('分类必须是字符串'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('keywords').optional().isArray().withMessage('关键词必须是数组'),
  body('target_audience').optional().isString().withMessage('目标读者必须是字符串'),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('难度级别必须是beginner、intermediate或advanced'),
  validateRequest
], topicController.updateTopic);

// 更新选题状态
router.put('/:id/status', [
  param('id').isString().withMessage('选题ID必须是字符串'),
  body('status').isIn(['pending', 'selected', 'discarded', 'in_progress', 'completed']).withMessage('状态必须是pending、selected、discarded、in_progress或completed'),
  validateRequest
], topicController.updateTopicStatus);

// 删除选题
router.delete('/:id', [
  param('id').isString().withMessage('选题ID必须是字符串'),
  validateRequest
], topicController.deleteTopic);

// 选题质量评估
router.post('/:id/evaluate', [
  param('id').isString().withMessage('选题ID必须是字符串'),
  body('criteria').optional().isObject().withMessage('评估条件必须是对象'),
  validateRequest
], topicController.evaluateTopic);

// 获取选题统计
router.get('/stats/overview', topicController.getTopicStats);

// 获取素材相关的选题
router.get('/material/:materialId', [
  param('materialId').isString().withMessage('素材ID必须是字符串'),
  query('status').optional().isString().withMessage('状态必须是字符串'),
  validateRequest
], topicController.getTopicsByMaterial);

// 批量操作选题
router.post('/batch', [
  body('topicIds').isArray({ min: 1, max: 50 }).withMessage('选题ID列表必须是数组，且最多50个'),
  body('topicIds.*').isString().withMessage('选题ID必须是字符串'),
  body('action').isIn(['update_status', 'delete', 'update_category', 'update_tags']).withMessage('操作类型必须是update_status、delete、update_category或update_tags'),
  body('data').optional().isObject().withMessage('操作数据必须是对象'),
  validateRequest
], topicController.batchUpdateTopics);

export default router;