import { v4 as uuidv4 } from 'uuid';
import { Topic, CreateTopicDto } from './types';
import Database from '../init';

export class TopicModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateTopicDto): Promise<Topic> {
    const topic: Topic = {
      id: uuidv4(),
      title: data.title,
      description: data.description || null,
      material_id: data.material_id || null,
      prompt: data.prompt || null,
      status: 'pending',
      score: 0,
      category: data.category || null,
      tags: data.tags || null,
      keywords: data.keywords || null,
      target_audience: data.target_audience || null,
      estimated_read_time: data.estimated_read_time || null,
      difficulty_level: data.difficulty_level || null,
      quality_score: data.quality_score || null,
      creativity_score: data.creativity_score || null,
      feasibility_score: data.feasibility_score || null,
      relevance_score: data.relevance_score || null,
      ai_response: data.ai_response || null,
      generation_id: data.generation_id || null,
      template_id: data.template_id || null,
      created_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO topics (
        id, title, description, material_id, prompt, status, score, 
        category, tags, keywords, target_audience, estimated_read_time, 
        difficulty_level, quality_score, creativity_score, feasibility_score, 
        relevance_score, ai_response, generation_id, template_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        topic.id,
        topic.title,
        topic.description,
        topic.material_id,
        topic.prompt,
        topic.status,
        topic.score,
        topic.category,
        JSON.stringify(topic.tags),
        JSON.stringify(topic.keywords),
        topic.target_audience,
        topic.estimated_read_time,
        topic.difficulty_level,
        topic.quality_score,
        topic.creativity_score,
        topic.feasibility_score,
        topic.relevance_score,
        topic.ai_response,
        topic.generation_id,
        topic.template_id,
        topic.created_at,
      ]
    );

    return topic;
  }

  async findById(id: string): Promise<Topic | null> {
    const row = await this.db.get('SELECT * FROM topics WHERE id = ?', [id]);
    return row ? this.rowToTopic(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    material_id?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ data: Topic[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      material_id, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (material_id) {
      whereClause += ' AND material_id = ?';
      params.push(material_id);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM topics WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM topics 
      WHERE 1=1 ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToTopic);

    return { data, total };
  }

  async update(id: string, data: Partial<CreateTopicDto> & { 
  status?: string; 
  score?: number;
  quality_score?: number;
  creativity_score?: number;
  feasibility_score?: number;
  relevance_score?: number;
  selected_at?: string;
  discarded_at?: string;
}): Promise<Topic | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.material_id !== undefined) {
      updates.push('material_id = ?');
      params.push(data.material_id);
    }
    if (data.prompt !== undefined) {
      updates.push('prompt = ?');
      params.push(data.prompt);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
      
      // 设置状态变更时间
      if (data.status === 'selected') {
        updates.push('selected_at = ?');
        params.push(new Date().toISOString());
      }
      if (data.status === 'discarded') {
        updates.push('discarded_at = ?');
        params.push(new Date().toISOString());
      }
    }
    if (data.score !== undefined) {
      updates.push('score = ?');
      params.push(data.score);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(data.tags));
    }
    if (data.keywords !== undefined) {
      updates.push('keywords = ?');
      params.push(JSON.stringify(data.keywords));
    }
    if (data.target_audience !== undefined) {
      updates.push('target_audience = ?');
      params.push(data.target_audience);
    }
    if (data.estimated_read_time !== undefined) {
      updates.push('estimated_read_time = ?');
      params.push(data.estimated_read_time);
    }
    if (data.difficulty_level !== undefined) {
      updates.push('difficulty_level = ?');
      params.push(data.difficulty_level);
    }
    if (data.quality_score !== undefined) {
      updates.push('quality_score = ?');
      params.push(data.quality_score);
    }
    if (data.creativity_score !== undefined) {
      updates.push('creativity_score = ?');
      params.push(data.creativity_score);
    }
    if (data.feasibility_score !== undefined) {
      updates.push('feasibility_score = ?');
      params.push(data.feasibility_score);
    }
    if (data.relevance_score !== undefined) {
      updates.push('relevance_score = ?');
      params.push(data.relevance_score);
    }
    if (data.selected_at !== undefined) {
      updates.push('selected_at = ?');
      params.push(data.selected_at);
    }
    if (data.discarded_at !== undefined) {
      updates.push('discarded_at = ?');
      params.push(data.discarded_at);
    }

    if (updates.length === 0) return existing;

    // 添加更新时间
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    
    params.push(id);

    await this.db.run(
      `UPDATE topics SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM topics WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async findByMaterialId(materialId: string): Promise<Topic[]> {
    const rows = await this.db.all(
      'SELECT * FROM topics WHERE material_id = ? ORDER BY created_at DESC',
      [materialId]
    );
    return rows.map(this.rowToTopic);
  }

  async updateStatus(id: string, status: string): Promise<Topic | null> {
    return this.update(id, { status });
  }

  async updateScore(id: string, score: number): Promise<Topic | null> {
    return this.update(id, { score });
  }

  async getTopTopics(limit: number = 10): Promise<Topic[]> {
    const rows = await this.db.all(
      'SELECT * FROM topics WHERE status = "pending" ORDER BY score DESC LIMIT ?',
      [limit]
    );
    return rows.map(this.rowToTopic);
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageScore: number;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM topics');
    const byStatus = await this.db.all('SELECT status, COUNT(*) as count FROM topics GROUP BY status');
    const avgScore = await this.db.get('SELECT AVG(score) as average_score FROM topics');

    return {
      total: total?.total || 0,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      averageScore: avgScore?.average_score || 0
    };
  }

  private rowToTopic(row: any): Topic {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      material_id: row.material_id,
      prompt: row.prompt,
      status: row.status,
      score: row.score,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : null,
      keywords: row.keywords ? JSON.parse(row.keywords) : null,
      target_audience: row.target_audience,
      estimated_read_time: row.estimated_read_time,
      difficulty_level: row.difficulty_level,
      quality_score: row.quality_score,
      creativity_score: row.creativity_score,
      feasibility_score: row.feasibility_score,
      relevance_score: row.relevance_score,
      ai_response: row.ai_response,
      generation_id: row.generation_id,
      template_id: row.template_id,
      selected_at: row.selected_at,
      discarded_at: row.discarded_at,
      updated_at: row.updated_at,
      created_at: row.created_at,
    };
  }
}