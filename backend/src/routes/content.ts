import { Router } from 'express';
import { ContentController } from '../controllers/contentController';
import { ContentVersionController } from '../controllers/contentVersionController';
import { authenticate } from '../middleware/auth';

export function createContentRouter(
  models: any,
  contentGenerationService: any,
  batchGenerationService: any,
  optimizationService: any
): Router {
  const router = Router();
  const contentController = new ContentController(
    models,
    contentGenerationService,
    batchGenerationService,
    optimizationService
  );
  const versionController = new ContentVersionController(models);

  // 内容生成相关路由
  router.post('/generate', authenticate, contentController.generateContent.bind(contentController));
  router.post('/generate/custom', authenticate, contentController.generateCustomContent.bind(contentController));
  router.get('/generations/:id', authenticate, contentController.getGenerationResult.bind(contentController));

  // 批量生成相关路由
  router.post('/generate/batch', authenticate, contentController.generateBatchContent.bind(contentController));
  router.get('/batch/:id', authenticate, contentController.getBatchResult.bind(contentController));
  router.get('/batch/:id/progress', authenticate, contentController.getBatchProgress.bind(contentController));
  router.post('/batch/:id/cancel', authenticate, contentController.cancelBatchGeneration.bind(contentController));

  // 内容管理相关路由
  router.get('/', authenticate, contentController.getContentList.bind(contentController));
  router.get('/:id', authenticate, contentController.getContentById.bind(contentController));
  router.put('/:id', authenticate, contentController.updateContent.bind(contentController));
  router.delete('/:id', authenticate, contentController.deleteContent.bind(contentController));

  // 内容优化相关路由
  router.post('/:id/optimize', authenticate, contentController.optimizeContent.bind(contentController));
  router.post('/:id/summary', authenticate, contentController.generateContentSummary.bind(contentController));
  router.post('/:id/tags', authenticate, contentController.extractContentTags.bind(contentController));

  // 统计相关路由
  router.get('/stats/content', authenticate, contentController.getContentStats.bind(contentController));
  router.get('/stats/generation', authenticate, contentController.getGenerationStats.bind(contentController));
  router.get('/stats/batch', authenticate, contentController.getBatchStats.bind(contentController));

  // 内容版本管理路由
  router.post('/:id/versions', authenticate, versionController.createVersion.bind(versionController));
  router.get('/:id/versions', authenticate, versionController.getVersions.bind(versionController));
  router.get('/:id/versions/latest', authenticate, versionController.getLatestVersion.bind(versionController));
  router.get('/:id/versions/:version', authenticate, versionController.getVersion.bind(versionController));
  router.get('/:id/versions/compare', authenticate, versionController.compareVersions.bind(versionController));
  router.post('/:id/versions/:version/rollback', authenticate, versionController.rollbackVersion.bind(versionController));
  router.delete('/versions/:versionId', authenticate, versionController.deleteVersion.bind(versionController));
  router.get('/:id/versions/history', authenticate, versionController.getVersionHistory.bind(versionController));
  router.get('/stats/versions', authenticate, versionController.getVersionStats.bind(versionController));

  return router;
}