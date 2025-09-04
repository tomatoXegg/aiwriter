import { Request, Response } from 'express';
import { 
  GenerateContentRequest,
  GenerateCustomContentRequest,
  GenerateBatchContentRequest,
  ContentGenerationResult,
  BatchGenerationResult,
  ContentOptimizationRequest,
  CreateContentVersionRequest,
  ContentQueryOptions,
  ContentFilterOptions,
  ContentSortOptions
} from '../database/models/types';
import { Models } from '../database/models';
import { ContentGenerationService } from '../services/contentGenerationService';
import { BatchContentGenerationService } from '../services/batchContentGenerationService';
import { ContentOptimizationService } from '../services/contentOptimizationService';

export class ContentController {
  private models: Models;
  private contentGenerationService: ContentGenerationService;
  private batchGenerationService: BatchContentGenerationService;
  private optimizationService: ContentOptimizationService;

  constructor(
    models: Models,
    contentGenerationService: ContentGenerationService,
    batchGenerationService: BatchContentGenerationService,
    optimizationService: ContentOptimizationService
  ) {
    this.models = models;
    this.contentGenerationService = contentGenerationService;
    this.batchGenerationService = batchGenerationService;
    this.optimizationService = optimizationService;
  }

  // 内容生成相关接口
  async generateContent(req: Request, res: Response): Promise<void> {
    try {
      const request: GenerateContentRequest = {
        topicId: req.body.topicId,
        prompt: req.body.prompt,
        style: req.body.style,
        accountId: req.body.accountId || req.user?.id,
      };

      const result = await this.contentGenerationService.generateContent(request);

      res.json({
        success: true,
        data: {
          generationId: result.id,
          status: result.status,
          estimatedTime: result.estimatedTime,
        },
        message: '内容生成任务已启动',
      });
    } catch (error) {
      console.error('Generate content error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '内容生成失败',
      });
    }
  }

  async generateCustomContent(req: Request, res: Response): Promise<void> {
    try {
      const request: GenerateCustomContentRequest = {
        title: req.body.title,
        prompt: req.body.prompt,
        style: req.body.style,
        accountId: req.body.accountId || req.user?.id,
      };

      const result = await this.contentGenerationService.generateCustomContent(request);

      res.json({
        success: true,
        data: {
          generationId: result.id,
          status: result.status,
          estimatedTime: result.estimatedTime,
        },
        message: '自定义内容生成任务已启动',
      });
    } catch (error) {
      console.error('Generate custom content error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '自定义内容生成失败',
      });
    }
  }

  async getGenerationResult(req: Request, res: Response): Promise<void> {
    try {
      const generationId = req.params.id;
      const result = await this.contentGenerationService.getGenerationResult(generationId);

      res.json({
        success: true,
        data: result,
        message: '获取生成结果成功',
      });
    } catch (error) {
      console.error('Get generation result error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取生成结果失败',
      });
    }
  }

  // 批量生成相关接口
  async generateBatchContent(req: Request, res: Response): Promise<void> {
    try {
      const request: GenerateBatchContentRequest = {
        name: req.body.name,
        topicIds: req.body.topicIds,
        prompt: req.body.prompt,
        style: req.body.style,
        accountId: req.body.accountId || req.user?.id,
      };

      const result = await this.batchGenerationService.generateBatchContent(request);

      res.json({
        success: true,
        data: {
          batchId: result.batchId,
          status: result.status,
          taskCount: result.taskCount,
          estimatedTime: result.taskCount * 60, // 预估每个任务60秒
        },
        message: '批量内容生成任务已启动',
      });
    } catch (error) {
      console.error('Generate batch content error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '批量内容生成失败',
      });
    }
  }

  async getBatchResult(req: Request, res: Response): Promise<void> {
    try {
      const batchId = req.params.id;
      const result = await this.batchGenerationService.getBatchResult(batchId);

      res.json({
        success: true,
        data: result,
        message: '获取批量生成结果成功',
      });
    } catch (error) {
      console.error('Get batch result error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取批量生成结果失败',
      });
    }
  }

  async getBatchProgress(req: Request, res: Response): Promise<void> {
    try {
      const batchId = req.params.id;
      const progress = await this.batchGenerationService.getBatchProgress(batchId);

      res.json({
        success: true,
        data: progress,
        message: '获取批量生成进度成功',
      });
    } catch (error) {
      console.error('Get batch progress error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取批量生成进度失败',
      });
    }
  }

  async cancelBatchGeneration(req: Request, res: Response): Promise<void> {
    try {
      const batchId = req.params.id;
      const success = await this.batchGenerationService.cancelBatchGeneration(batchId);

      if (success) {
        res.json({
          success: true,
          message: '批量生成任务已取消',
        });
      } else {
        res.status(400).json({
          success: false,
          message: '无法取消已完成的批量生成任务',
        });
      }
    } catch (error) {
      console.error('Cancel batch generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '取消批量生成任务失败',
      });
    }
  }

  // 内容管理相关接口
  async getContentList(req: Request, res: Response): Promise<void> {
    try {
      const options: ContentQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        filters: {
          status: req.query.status as string,
          accountId: req.query.accountId as string,
          topicId: req.query.topicId as string,
          search: req.query.search as string,
          dateFrom: req.query.dateFrom as string,
          dateTo: req.query.dateTo as string,
        },
        sort: {
          field: (req.query.sortBy as string) || 'created_at',
          order: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        },
      };

      const result = await this.models.content.findAll({
        page: options.page,
        limit: options.limit,
        status: options.filters?.status,
        account_id: options.filters?.accountId,
        topic_id: options.filters?.topicId,
        search: options.filters?.search,
        sortBy: options.sort?.field,
        sortOrder: options.sort?.order,
      });

      res.json({
        success: true,
        data: {
          contents: result.data,
          total: result.total,
          page: options.page,
          limit: options.limit,
          filters: options.filters,
        },
        message: '获取内容列表成功',
      });
    } catch (error) {
      console.error('Get content list error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取内容列表失败',
      });
    }
  }

  async getContentById(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const content = await this.models.content.findById(contentId);

      if (!content) {
        res.status(404).json({
          success: false,
          message: '内容不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: content,
        message: '获取内容详情成功',
      });
    } catch (error) {
      console.error('Get content by id error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取内容详情失败',
      });
    }
  }

  async updateContent(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const updates = {
        title: req.body.title,
        body: req.body.body,
        topic_id: req.body.topicId,
        account_id: req.body.accountId,
        status: req.body.status,
        prompt: req.body.prompt,
      };

      const content = await this.models.content.update(contentId, updates);

      if (!content) {
        res.status(404).json({
          success: false,
          message: '内容不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: content,
        message: '更新内容成功',
      });
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '更新内容失败',
      });
    }
  }

  async deleteContent(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const success = await this.models.content.delete(contentId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: '内容不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '删除内容成功',
      });
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '删除内容失败',
      });
    }
  }

  // 内容优化相关接口
  async optimizeContent(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const request: ContentOptimizationRequest = {
        type: req.body.type,
        content: req.body.content,
      };

      const result = await this.optimizationService.optimizeContent(contentId, request);

      res.json({
        success: true,
        data: result,
        message: '内容优化完成',
      });
    } catch (error) {
      console.error('Optimize content error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '内容优化失败',
      });
    }
  }

  async generateContentSummary(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const result = await this.optimizationService.generateContentSummary(contentId);

      res.json({
        success: true,
        data: result,
        message: '生成内容摘要成功',
      });
    } catch (error) {
      console.error('Generate content summary error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '生成内容摘要失败',
      });
    }
  }

  async extractContentTags(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const tags = await this.optimizationService.extractContentTags(contentId);

      res.json({
        success: true,
        data: { tags },
        message: '提取内容标签成功',
      });
    } catch (error) {
      console.error('Extract content tags error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '提取内容标签失败',
      });
    }
  }

  // 统计相关接口
  async getContentStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.models.content.getStats();

      res.json({
        success: true,
        data: stats,
        message: '获取内容统计成功',
      });
    } catch (error) {
      console.error('Get content stats error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取内容统计失败',
      });
    }
  }

  async getGenerationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.models.contentGeneration.getStats();

      res.json({
        success: true,
        data: stats,
        message: '获取生成统计成功',
      });
    } catch (error) {
      console.error('Get generation stats error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取生成统计失败',
      });
    }
  }

  async getBatchStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.batchGenerationService.getBatchStats();

      res.json({
        success: true,
        data: stats,
        message: '获取批量生成统计成功',
      });
    } catch (error) {
      console.error('Get batch stats error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取批量生成统计失败',
      });
    }
  }
}