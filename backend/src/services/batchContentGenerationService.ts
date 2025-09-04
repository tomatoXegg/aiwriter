import { v4 as uuidv4 } from 'uuid';
import { 
  BatchGeneration,
  GenerateBatchContentRequest,
  ContentGenerationResult,
  BatchGenerationResult
} from '../database/models/types';
import { Models } from '../database/models';
import { ContentGenerationService } from './contentGenerationService';

export class BatchContentGenerationService {
  private models: Models;
  private contentGenerationService: ContentGenerationService;

  constructor(models: Models, contentGenerationService: ContentGenerationService) {
    this.models = models;
    this.contentGenerationService = contentGenerationService;
  }

  async generateBatchContent(request: GenerateBatchContentRequest): Promise<BatchGenerationResult> {
    try {
      // 创建批量生成任务
      const batch = await this.models.batchGeneration.createBatchGeneration(request);

      // 异步开始批量生成过程
      this.performBatchGeneration(batch.id, request).catch(error => {
        console.error('Batch content generation failed:', error);
        this.models.batchGeneration.updateStatus(batch.id, 'failed');
      });

      return {
        batchId: batch.id,
        status: 'pending',
        taskCount: request.topicIds.length,
        completedTasks: 0,
        results: [],
        createdAt: batch.createdAt,
      };
    } catch (error) {
      console.error('Failed to start batch content generation:', error);
      throw error;
    }
  }

  async getBatchResult(batchId: string): Promise<BatchGenerationResult> {
    const batch = await this.models.batchGeneration.findById(batchId);
    if (!batch) {
      throw new Error('Batch generation not found');
    }

    const progress = await this.models.batchGeneration.getBatchProgress(batchId);

    return {
      batchId: batch.id,
      status: batch.status,
      taskCount: progress.total,
      completedTasks: progress.completed,
      results: batch.results.map(result => ({
        id: result.id,
        status: result.status,
        result: result.result,
        error: result.error,
        progress: result.progress,
        createdAt: result.createdAt,
        completedAt: result.completedAt,
      })),
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    };
  }

  async getBatchProgress(batchId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
    progress: number;
  }> {
    return this.models.batchGeneration.getBatchProgress(batchId);
  }

  async cancelBatchGeneration(batchId: string): Promise<boolean> {
    const batch = await this.models.batchGeneration.findById(batchId);
    if (!batch) {
      throw new Error('Batch generation not found');
    }

    if (batch.status === 'completed' || batch.status === 'failed') {
      return false;
    }

    await this.models.batchGeneration.updateStatus(batchId, 'failed');
    return true;
  }

  async getRecentBatches(limit: number = 10): Promise<BatchGenerationResult[]> {
    const batches = await this.models.batchGeneration.getRecentBatches(limit);
    
    return batches.map(batch => ({
      batchId: batch.id,
      status: batch.status,
      taskCount: batch.topics.length,
      completedTasks: batch.results.filter(r => r.status === 'completed').length,
      results: batch.results.map(result => ({
        id: result.id,
        status: result.status,
        result: result.result,
        error: result.error,
        progress: result.progress,
        createdAt: result.createdAt,
        completedAt: result.completedAt,
      })),
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    }));
  }

  async getBatchStats(): Promise<{
    totalBatches: number;
    byStatus: Record<string, number>;
    totalTasks: number;
    completedTasks: number;
    averageBatchSize: number;
  }> {
    return this.models.batchGeneration.getStats();
  }

  private async performBatchGeneration(
    batchId: string, 
    request: GenerateBatchContentRequest
  ): Promise<void> {
    try {
      // 更新状态为处理中
      await this.models.batchGeneration.updateStatus(batchId, 'processing');

      // 为每个选题创建生成任务
      const generationPromises = request.topicIds.map(async (topicId, index) => {
        try {
          // 添加延迟以避免API速率限制
          if (index > 0) {
            await this.delay(2000); // 2秒延迟
          }

          const generationResult = await this.contentGenerationService.generateContent({
            topicId,
            prompt: request.prompt,
            style: request.style,
            accountId: request.accountId,
          });

          // 添加到批量任务结果
          await this.models.batchGeneration.addGenerationResult(batchId, {
            id: generationResult.id,
            topicId: topicId,
            prompt: request.prompt || '',
            style: request.style,
            status: generationResult.status,
            progress: generationResult.progress,
            estimatedTime: generationResult.estimatedTime || 60,
            createdAt: generationResult.createdAt,
            completedAt: generationResult.completedAt,
          });

          console.log(`Batch generation task completed: ${topicId}`);
        } catch (error) {
          console.error(`Batch generation task failed for topic ${topicId}:`, error);
          
          // 添加失败的任务结果
          await this.models.batchGeneration.addGenerationResult(batchId, {
            id: uuidv4(),
            topicId: topicId,
            prompt: request.prompt || '',
            style: request.style,
            status: 'failed',
            progress: 0,
            estimatedTime: 60,
            createdAt: new Date(),
            error: error.message,
          });
        }
      });

      // 等待所有任务完成
      await Promise.all(generationPromises);

      console.log(`Batch generation completed: ${batchId}`);
    } catch (error) {
      console.error('Batch generation failed:', error);
      await this.models.batchGeneration.updateStatus(batchId, 'failed');
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}