import { v4 as uuidv4 } from 'uuid';
import { Material, CreateMaterialDto } from './types';
import Database from '../init';

export class MaterialModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateMaterialDto): Promise<Material> {
    const material: Material = {
      id: uuidv4(),
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      type: data.type || 'text',
      file_path: data.file_path || null,
      account_id: data.account_id || null,
      category_id: data.category_id || null,
      file_size: data.file_size || null,
      word_count: data.word_count || this.calculateWordCount(data.content),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO materials (id, title, content, tags, type, file_path, account_id, category_id, file_size, word_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        material.id,
        material.title,
        material.content,
        JSON.stringify(material.tags),
        material.type,
        material.file_path,
        material.account_id,
        material.category_id,
        material.file_size,
        material.word_count,
        material.created_at,
        material.updated_at,
      ]
    );

    return material;
  }

  async findById(id: string): Promise<Material | null> {
    const row = await this.db.get('SELECT * FROM materials WHERE id = ?', [id]);
    return row ? this.rowToMaterial(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    type?: string;
    account_id?: string;
    search?: string;
    category_id?: string;
    tags?: string[];
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'word_count';
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ data: Material[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      account_id, 
      search, 
      category_id, 
      tags,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (account_id) {
      whereClause += ' AND account_id = ?';
      params.push(account_id);
    }

    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tags && tags.length > 0) {
      whereClause += ' AND (';
      const tagConditions = tags.map((tag, index) => {
        params.push(`%"${tag}"%`);
        return `tags LIKE ?`;
      });
      whereClause += tagConditions.join(' OR ');
      whereClause += ')';
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM materials WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM materials 
      WHERE 1=1 ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToMaterial);

    return { data, total };
  }

  async update(id: string, data: Partial<CreateMaterialDto>): Promise<Material | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(data.content);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(data.tags));
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.file_path !== undefined) {
      updates.push('file_path = ?');
      params.push(data.file_path);
    }
    if (data.account_id !== undefined) {
      updates.push('account_id = ?');
      params.push(data.account_id);
    }
    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(data.category_id);
    }
    if (data.file_size !== undefined) {
      updates.push('file_size = ?');
      params.push(data.file_size);
    }
    if (data.content !== undefined) {
      updates.push('word_count = ?');
      params.push(this.calculateWordCount(data.content));
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE materials SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM materials WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async findByAccountId(accountId: string): Promise<Material[]> {
    const rows = await this.db.all(
      'SELECT * FROM materials WHERE account_id = ? ORDER BY created_at DESC',
      [accountId]
    );
    return rows.map(this.rowToMaterial);
  }

  async searchByTags(tags: string[]): Promise<Material[]> {
    const rows = await this.db.all(
      `SELECT * FROM materials WHERE json_extract(tags, '$') LIKE ?`,
      [`%${tags[0]}%`]
    );
    return rows.filter(row => {
      const materialTags = JSON.parse(row.tags || '[]');
      return tags.some(tag => materialTags.includes(tag));
    }).map(this.rowToMaterial);
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byAccount: Record<string, number>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM materials');
    const byType = await this.db.all('SELECT type, COUNT(*) as count FROM materials GROUP BY type');
    const byAccount = await this.db.all('SELECT account_id, COUNT(*) as count FROM materials GROUP BY account_id');

    return {
      total: total?.total || 0,
      byType: byType.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>),
      byAccount: byAccount.reduce((acc, row) => {
        acc[row.account_id || 'unassigned'] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private rowToMaterial(row: any): Material {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags || '[]'),
      type: row.type,
      file_path: row.file_path,
      account_id: row.account_id,
      category_id: row.category_id,
      file_size: row.file_size,
      word_count: row.word_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private calculateWordCount(content: string): number {
    if (!content) return 0;
    // 移除多余的空白字符，按空格分割计算单词数
    const words = content.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }

  async findByCategory(categoryId: string): Promise<Material[]> {
    const rows = await this.db.all(
      'SELECT * FROM materials WHERE category_id = ? ORDER BY created_at DESC',
      [categoryId]
    );
    return rows.map(this.rowToMaterial);
  }

  async findByTags(tags: string[]): Promise<Material[]> {
    const rows = await this.db.all(
      `SELECT * FROM materials WHERE json_extract(tags, '$') LIKE ?`,
      [`%${tags[0]}%`]
    );
    return rows.filter(row => {
      const materialTags = JSON.parse(row.tags || '[]');
      return tags.some(tag => materialTags.includes(tag));
    }).map(this.rowToMaterial);
  }

  async searchAdvanced(options: {
    query?: string;
    category_id?: string;
    tags?: string[];
    type?: string;
    account_id?: string;
    min_word_count?: number;
    max_word_count?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Material[]; total: number }> {
    const {
      query,
      category_id,
      tags,
      type,
      account_id,
      min_word_count,
      max_word_count,
      date_from,
      date_to,
      page = 1,
      limit = 10
    } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (query) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }

    if (tags && tags.length > 0) {
      whereClause += ' AND (';
      const tagConditions = tags.map((tag, index) => {
        params.push(`%"${tag}"%`);
        return `tags LIKE ?`;
      });
      whereClause += tagConditions.join(' OR ');
      whereClause += ')';
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (account_id) {
      whereClause += ' AND account_id = ?';
      params.push(account_id);
    }

    if (min_word_count !== undefined) {
      whereClause += ' AND word_count >= ?';
      params.push(min_word_count);
    }

    if (max_word_count !== undefined) {
      whereClause += ' AND word_count <= ?';
      params.push(max_word_count);
    }

    if (date_from) {
      whereClause += ' AND created_at >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND created_at <= ?';
      params.push(date_to);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM materials WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM materials 
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToMaterial);

    return { data, total };
  }

  async getAdvancedStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byCategory: Array<{ category: string; count: number }>;
    byAccount: Record<string, number>;
    averageWordCount: number;
    totalWordCount: number;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM materials');
    const byType = await this.db.all('SELECT type, COUNT(*) as count FROM materials GROUP BY type');
    const byCategory = await this.db.all(`
      SELECT c.name as category, COUNT(m.id) as count 
      FROM categories c 
      LEFT JOIN materials m ON c.id = m.category_id 
      GROUP BY c.id, c.name
    `);
    const byAccount = await this.db.all('SELECT account_id, COUNT(*) as count FROM materials GROUP BY account_id');
    const wordCountStats = await this.db.get('SELECT AVG(word_count) as avg, SUM(word_count) as total FROM materials WHERE word_count > 0');
    
    // 最近7天的活动统计
    const recentActivity = await this.db.all(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM materials 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return {
      total: total?.total || 0,
      byType: byType.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: byCategory.map(row => ({
        category: row.category || '未分类',
        count: row.count
      })),
      byAccount: byAccount.reduce((acc, row) => {
        acc[row.account_id || 'unassigned'] = row.count;
        return acc;
      }, {} as Record<string, number>),
      averageWordCount: Math.round(wordCountStats?.avg || 0),
      totalWordCount: wordCountStats?.total || 0,
      recentActivity: recentActivity.map(row => ({
        date: row.date,
        count: row.count
      }))
    };
  }
}