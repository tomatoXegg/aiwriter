import { v4 as uuidv4 } from 'uuid';
import { 
  BatchGeneration, 
  BatchGenerationResult, 
  GenerateBatchContentRequest,
  ContentGeneration
} from './types';
import Database from '../init';

export class BatchGenerationModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async createBatchGeneration(request: GenerateBatchContentRequest): Promise<BatchGeneration> {
    const batch: BatchGeneration = {
      id: uuidv4(),
      name: request.name,
      topics: request.topicIds,
      prompt: request.prompt || '',
      style: request.style,
      status: 'pending',
      results: [],
      createdAt: new Date(),
    };

    await this.db.run(
      `INSERT INTO batch_generations (
        id, name, topics, prompt, style, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        batch.id,
        batch.name,
        JSON.stringify(batch.topics),
        batch.prompt,
        JSON.stringify(batch.style),
        batch.status,
        batch.createdAt.toISOString(),
      ]
    );

    return batch;
  }

  async findById(id: string): Promise<BatchGeneration | null> {
    const row = await this.db.get('SELECT * FROM batch_generations WHERE id = ?', [id]);
    return row ? this.rowToBatchGeneration(row) : null;
  }

  async updateStatus(id: string, status: string): Promise<BatchGeneration | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db.run(
      'UPDATE batch_generations SET status = ? WHERE id = ?',
      [status, id]
    );

    if (status === 'completed') {
      await this.db.run(
        'UPDATE batch_generations SET completed_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
    }

    return this.findById(id);
  }

  async addGenerationResult(batchId: string, generation: ContentGeneration): Promise<void> {
    const batch = await this.findById(batchId);
    if (!batch) return;

    batch.results.push(generation);

    await this.db.run(
      'UPDATE batch_generations SET results = ? WHERE id = ?',
      [JSON.stringify(batch.results), batchId]
    );

    // 检查是否所有任务都完成了
    const allCompleted = batch.results.every(result => 
      result.status === 'completed' || result.status === 'failed'
    );

    if (allCompleted && batch.results.length === batch.topics.length) {
      await this.updateStatus(batchId, 'completed');
    }
  }

  async findByStatus(status: string): Promise<BatchGeneration[]> {
    const rows = await this.db.all(
      'SELECT * FROM batch_generations WHERE status = ? ORDER BY created_at ASC',
      [status]
    );
    return rows.map(this.rowToBatchGeneration);
  }

  async getRecentBatches(limit: number = 10): Promise<BatchGeneration[]> {
    const rows = await this.db.all(
      'SELECT * FROM batch_generations ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows.map(this.rowToBatchGeneration);
  }

  async getBatchProgress(batchId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
    progress: number;
  }> {
    const batch = await this.findById(batchId);
    if (!batch) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        processing: 0,
        pending: 0,
        progress: 0
      };
    }

    const total = batch.topics.length;
    const completed = batch.results.filter(r => r.status === 'completed').length;
    const failed = batch.results.filter(r => r.status === 'failed').length;
    const processing = batch.results.filter(r => r.status === 'processing').length;
    const pending = batch.results.filter(r => r.status === 'pending').length;
    const progress = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

    return {
      total,
      completed,
      failed,
      processing,
      pending,
      progress
    };
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalTasks: number;
    completedTasks: number;
    averageBatchSize: number;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM batch_generations');
    const byStatus = await this.db.all('SELECT status, COUNT(*) as count FROM batch_generations GROUP BY status');
    
    // 计算批次统计信息
    const batches = await this.db.all('SELECT topics, results FROM batch_generations');
    let totalTasks = 0;
    let completedTasks = 0;
    
    batches.forEach(batch => {
      const topics = JSON.parse(batch.topics) || [];
      const results = JSON.parse(batch.results) || [];
      totalTasks += topics.length;
      completedTasks += results.filter(r => r.status === 'completed').length;
    });

    const averageBatchSize = total > 0 ? Math.round(totalTasks / total) : 0;

    return {
      total: total?.total || 0,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      totalTasks,
      completedTasks,
      averageBatchSize
    };
  }

  async cleanupOldBatches(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.db.run(
      'DELETE FROM batch_generations WHERE created_at < ? AND status = "completed"',
      [cutoffDate.toISOString()]
    );
    
    return result.changes;
  }

  private rowToBatchGeneration(row: any): BatchGeneration {
    return {
      id: row.id,
      name: row.name,
      topics: JSON.parse(row.topics) || [],
      prompt: row.prompt,
      style: row.style ? JSON.parse(row.style) : undefined,
      status: row.status,
      results: JSON.parse(row.results) || [],
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }
}