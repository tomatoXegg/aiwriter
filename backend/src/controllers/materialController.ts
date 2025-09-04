import { Request, Response } from 'express';
import { Material, CreateMaterialDto, CreateCategoryDto, CreateTagDto } from '../database/models/types';
import { Models } from '../database/models';
import { FileUploadService, UploadedFile, ParsedContent } from '../services';
import { buildSuccessResponse, buildErrorResponse } from '../utils/responseBuilder';

export class MaterialController {
  private models: Models;
  private fileUploadService: FileUploadService;

  constructor(models: Models, fileUploadService: FileUploadService) {
    this.models = models;
    this.fileUploadService = fileUploadService;
  }

  // 文本素材管理
  async createTextMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, tags, category_id } = req.body;
      
      if (!title || !content) {
        res.status(400).json(buildErrorResponse('标题和内容不能为空'));
        return;
      }

      const materialData: CreateMaterialDto = {
        title,
        content,
        tags: tags || [],
        type: 'text',
        category_id,
        account_id: req.body.account_id
      };

      const material = await this.models.material.create(materialData);
      
      res.status(201).json(buildSuccessResponse(material, '文本素材创建成功'));
    } catch (error) {
      console.error('创建文本素材失败:', error);
      res.status(500).json(buildErrorResponse('创建文本素材失败'));
    }
  }

  async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category_id,
        account_id,
        search,
        tags,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        category_id: category_id as string,
        account_id: account_id as string,
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      const result = await this.models.material.findAll(options);
      
      res.json(buildSuccessResponse({
        materials: result.data,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / options.limit)
        }
      }, '获取素材列表成功'));
    } catch (error) {
      console.error('获取素材列表失败:', error);
      res.status(500).json(buildErrorResponse('获取素材列表失败'));
    }
  }

  async getMaterialById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const material = await this.models.material.findById(id);
      
      if (!material) {
        res.status(404).json(buildErrorResponse('素材不存在'));
        return;
      }

      res.json(buildSuccessResponse(material, '获取素材详情成功'));
    } catch (error) {
      console.error('获取素材详情失败:', error);
      res.status(500).json(buildErrorResponse('获取素材详情失败'));
    }
  }

  async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateMaterialDto> = req.body;
      
      const material = await this.models.material.update(id, updateData);
      
      if (!material) {
        res.status(404).json(buildErrorResponse('素材不存在'));
        return;
      }

      res.json(buildSuccessResponse(material, '更新素材成功'));
    } catch (error) {
      console.error('更新素材失败:', error);
      res.status(500).json(buildErrorResponse('更新素材失败'));
    }
  }

  async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 先获取素材信息，删除相关文件
      const material = await this.models.material.findById(id);
      if (material && material.file_path) {
        await this.fileUploadService.deleteFile(material.file_path);
      }
      
      const success = await this.models.material.delete(id);
      
      if (!success) {
        res.status(404).json(buildErrorResponse('素材不存在'));
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('删除素材失败:', error);
      res.status(500).json(buildErrorResponse('删除素材失败'));
    }
  }

  // 文件上传
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json(buildErrorResponse('没有上传文件'));
        return;
      }

      const { title, tags, category_id } = req.body;
      const file = req.file;

      // 保存文件
      const uploadedFile: UploadedFile = await this.fileUploadService.saveFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // 解析文件内容
      let parsedContent: ParsedContent;
      try {
        parsedContent = await this.fileUploadService.parseFile(uploadedFile.path, file.mimetype);
      } catch (error) {
        // 如果解析失败，至少保存文件信息
        parsedContent = {
          text: `[${file.originalname} 的内容]`,
          metadata: {
            error: '文件解析失败',
            originalName: file.originalname
          }
        };
      }

      // 创建素材记录
      const materialData: CreateMaterialDto = {
        title: title || file.originalname,
        content: parsedContent.text,
        tags: tags ? JSON.parse(tags) : [],
        type: 'file',
        file_path: uploadedFile.path,
        category_id,
        file_size: uploadedFile.size,
        word_count: parsedContent.metadata?.wordCount || 0,
        account_id: req.body.account_id
      };

      const material = await this.models.material.create(materialData);
      
      res.status(201).json(buildSuccessResponse({
        material,
        fileInfo: uploadedFile,
        parsedContent
      }, '文件上传成功'));
    } catch (error) {
      console.error('文件上传失败:', error);
      res.status(500).json(buildErrorResponse('文件上传失败'));
    }
  }

  // 搜索功能
  async searchMaterials(req: Request, res: Response): Promise<void> {
    try {
      const { q, page = 1, limit = 10, category_id, tags, type } = req.query;
      
      if (!q) {
        res.status(400).json(buildErrorResponse('搜索关键词不能为空'));
        return;
      }

      const options = {
        query: q as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category_id: category_id as string,
        tags: tags ? (tags as string).split(',') : undefined,
        type: type as string
      };

      const result = await this.models.material.searchAdvanced(options);
      
      res.json(buildSuccessResponse({
        materials: result.data,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / options.limit)
        },
        searchQuery: options.query
      }, '搜索素材成功'));
    } catch (error) {
      console.error('搜索素材失败:', error);
      res.status(500).json(buildErrorResponse('搜索素材失败'));
    }
  }

  // 分类管理
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color } = req.body;
      
      if (!name) {
        res.status(400).json(buildErrorResponse('分类名称不能为空'));
        return;
      }

      const categoryData: CreateCategoryDto = {
        name,
        description,
        color
      };

      const category = await this.models.category.create(categoryData);
      
      res.status(201).json(buildSuccessResponse(category, '分类创建成功'));
    } catch (error) {
      console.error('创建分类失败:', error);
      res.status(500).json(buildErrorResponse('创建分类失败'));
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string
      };

      const result = await this.models.category.findAll(options);
      
      res.json(buildSuccessResponse({
        categories: result.data,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / options.limit)
        }
      }, '获取分类列表成功'));
    } catch (error) {
      console.error('获取分类列表失败:', error);
      res.status(500).json(buildErrorResponse('获取分类列表失败'));
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const category = await this.models.category.update(id, updateData);
      
      if (!category) {
        res.status(404).json(buildErrorResponse('分类不存在'));
        return;
      }

      res.json(buildSuccessResponse(category, '更新分类成功'));
    } catch (error) {
      console.error('更新分类失败:', error);
      res.status(500).json(buildErrorResponse('更新分类失败'));
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const success = await this.models.category.delete(id);
      
      if (!success) {
        res.status(404).json(buildErrorResponse('分类不存在'));
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('删除分类失败:', error);
      res.status(500).json(buildErrorResponse('删除分类失败'));
    }
  }

  // 标签管理
  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const { name, color } = req.body;
      
      if (!name) {
        res.status(400).json(buildErrorResponse('标签名称不能为空'));
        return;
      }

      const tagData: CreateTagDto = {
        name,
        color
      };

      const tag = await this.models.tag.create(tagData);
      
      res.status(201).json(buildSuccessResponse(tag, '标签创建成功'));
    } catch (error) {
      console.error('创建标签失败:', error);
      res.status(500).json(buildErrorResponse('创建标签失败'));
    }
  }

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      const result = await this.models.tag.findAll(options);
      
      res.json(buildSuccessResponse({
        tags: result.data,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / options.limit)
        }
      }, '获取标签列表成功'));
    } catch (error) {
      console.error('获取标签列表失败:', error);
      res.status(500).json(buildErrorResponse('获取标签列表失败'));
    }
  }

  async getPopularTags(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      
      const tags = await this.models.tag.getPopularTags(parseInt(limit as string));
      
      res.json(buildSuccessResponse(tags, '获取热门标签成功'));
    } catch (error) {
      console.error('获取热门标签失败:', error);
      res.status(500).json(buildErrorResponse('获取热门标签失败'));
    }
  }

  async updateTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const tag = await this.models.tag.update(id, updateData);
      
      if (!tag) {
        res.status(404).json(buildErrorResponse('标签不存在'));
        return;
      }

      res.json(buildSuccessResponse(tag, '更新标签成功'));
    } catch (error) {
      console.error('更新标签失败:', error);
      res.status(500).json(buildErrorResponse('更新标签失败'));
    }
  }

  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const success = await this.models.tag.delete(id);
      
      if (!success) {
        res.status(404).json(buildErrorResponse('标签不存在'));
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('删除标签失败:', error);
      res.status(500).json(buildErrorResponse('删除标签失败'));
    }
  }

  // 统计信息
  async getMaterialStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.models.material.getAdvancedStats();
      
      res.json(buildSuccessResponse(stats, '获取素材统计信息成功'));
    } catch (error) {
      console.error('获取素材统计信息失败:', error);
      res.status(500).json(buildErrorResponse('获取素材统计信息失败'));
    }
  }

  async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.models.category.getUsageStats();
      
      res.json(buildSuccessResponse(stats, '获取分类统计信息成功'));
    } catch (error) {
      console.error('获取分类统计信息失败:', error);
      res.status(500).json(buildErrorResponse('获取分类统计信息失败'));
    }
  }

  async getTagStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.models.tag.getUsageStats();
      
      res.json(buildSuccessResponse(stats, '获取标签统计信息成功'));
    } catch (error) {
      console.error('获取标签统计信息失败:', error);
      res.status(500).json(buildErrorResponse('获取标签统计信息失败'));
    }
  }
}