import { v4 as uuidv4 } from 'uuid';
import { 
  ContentGeneration, 
  ContentGenerationResult, 
  GenerateContentRequest,
  ContentWithStyle,
  ContentStyle
} from './types';
import Database from '../init';

export class ContentGenerationModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async createGeneration(request: GenerateContentRequest): Promise<ContentGeneration> {
    const generation: ContentGeneration = {
      id: uuidv4(),
      topicId: request.topicId,
      prompt: request.prompt || '',
      style: request.style,
      status: 'pending',
      progress: 0,
      estimatedTime: 60, // 预估60秒
      createdAt: new Date(),
    };

    await this.db.run(
      `INSERT INTO content_generations (
        id, topic_id, prompt, style, status, progress, 
        estimated_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generation.id,
        generation.topicId,
        generation.prompt,
        JSON.stringify(generation.style),
        generation.status,
        generation.progress,
        generation.estimatedTime,
        generation.createdAt.toISOString(),
      ]
    );

    return generation;
  }

  async findById(id: string): Promise<ContentGeneration | null> {
    const row = await this.db.get('SELECT * FROM content_generations WHERE id = ?', [id]);
    return row ? this.rowToContentGeneration(row) : null;
  }

  async updateStatus(id: string, status: string, progress?: number, error?: string): Promise<ContentGeneration | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    updates.push('status = ?');
    params.push(status);

    if (progress !== undefined) {
      updates.push('progress = ?');
      params.push(progress);
    }

    if (error !== undefined) {
      updates.push('error = ?');
      params.push(error);
    }

    if (status === 'completed') {
      updates.push('completed_at = ?');
      params.push(new Date().toISOString());
    }

    params.push(id);

    await this.db.run(
      `UPDATE content_generations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async completeGeneration(id: string, result: ContentWithStyle): Promise<ContentGeneration | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db.run(
      `UPDATE content_generations 
       SET status = ?, progress = ?, result = ?, completed_at = ? 
       WHERE id = ?`,
      [
        'completed',
        100,
        JSON.stringify(result),
        new Date().toISOString(),
        id
      ]
    );

    return this.findById(id);
  }

  async failGeneration(id: string, error: string): Promise<ContentGeneration | null> {
    return this.updateStatus(id, 'failed', 0, error);
  }

  async findByTopicId(topicId: string): Promise<ContentGeneration[]> {
    const rows = await this.db.all(
      'SELECT * FROM content_generations WHERE topic_id = ? ORDER BY created_at DESC',
      [topicId]
    );
    return rows.map(this.rowToContentGeneration);
  }

  async findByStatus(status: string): Promise<ContentGeneration[]> {
    const rows = await this.db.all(
      'SELECT * FROM content_generations WHERE status = ? ORDER BY created_at ASC',
      [status]
    );
    return rows.map(this.rowToContentGeneration);
  }

  async getRecentGenerations(limit: number = 10): Promise<ContentGeneration[]> {
    const rows = await this.db.all(
      'SELECT * FROM content_generations ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows.map(this.rowToContentGeneration);
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageTime: number;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM content_generations');
    const byStatus = await this.db.all('SELECT status, COUNT(*) as count FROM content_generations GROUP BY status');
    
    // 计算平均完成时间
    const completedGenerations = await this.db.all(
      'SELECT (julianday(completed_at) - julianday(created_at)) * 24 * 60 as duration_minutes 
       FROM content_generations 
       WHERE status = "completed" AND completed_at IS NOT NULL'
    );
    
    const averageTime = completedGenerations.length > 0 
      ? completedGenerations.reduce((sum, gen) => sum + gen.duration_minutes, 0) / completedGenerations.length
      : 0;

    return {
      total: total?.total || 0,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      averageTime: Math.round(averageTime)
    };
  }

  async cleanupOldGenerations(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.db.run(
      'DELETE FROM content_generations WHERE created_at < ? AND status = "completed"',
      [cutoffDate.toISOString()]
    );
    
    return result.changes;
  }

  private rowToContentGeneration(row: any): ContentGeneration {
    return {
      id: row.id,
      topicId: row.topic_id,
      prompt: row.prompt,
      style: row.style ? JSON.parse(row.style) : undefined,
      status: row.status,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error,
      progress: row.progress,
      estimatedTime: row.estimated_time,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }
}