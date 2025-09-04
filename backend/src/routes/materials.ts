import { Router } from 'express';
import { MaterialController } from '../controllers/materialController';
import { Models } from '../database/models';
import { FileUploadService } from '../services';
import { authenticate } from '../middleware/auth';

const createMaterialsRouter = (models: Models, fileUploadService: FileUploadService): Router => {
  const router = Router();
  const controller = new MaterialController(models, fileUploadService);

  // 素材管理路由
  router.post('/text', authenticate, controller.createTextMaterial.bind(controller));
  router.get('/', authenticate, controller.getMaterials.bind(controller));
  router.get('/:id', authenticate, controller.getMaterialById.bind(controller));
  router.put('/:id', authenticate, controller.updateMaterial.bind(controller));
  router.delete('/:id', authenticate, controller.deleteMaterial.bind(controller));

  // 文件上传路由
  router.post('/upload', authenticate, controller.uploadFile.bind(controller));

  // 搜索路由
  router.get('/search', authenticate, controller.searchMaterials.bind(controller));

  // 分类管理路由
  router.post('/categories', authenticate, controller.createCategory.bind(controller));
  router.get('/categories', authenticate, controller.getCategories.bind(controller));
  router.put('/categories/:id', authenticate, controller.updateCategory.bind(controller));
  router.delete('/categories/:id', authenticate, controller.deleteCategory.bind(controller));

  // 标签管理路由
  router.post('/tags', authenticate, controller.createTag.bind(controller));
  router.get('/tags', authenticate, controller.getTags.bind(controller));
  router.get('/tags/popular', authenticate, controller.getPopularTags.bind(controller));
  router.put('/tags/:id', authenticate, controller.updateTag.bind(controller));
  router.delete('/tags/:id', authenticate, controller.deleteTag.bind(controller));

  // 统计信息路由
  router.get('/stats/materials', authenticate, controller.getMaterialStats.bind(controller));
  router.get('/stats/categories', authenticate, controller.getCategoryStats.bind(controller));
  router.get('/stats/tags', authenticate, controller.getTagStats.bind(controller));

  return router;
};

export default createMaterialsRouter;