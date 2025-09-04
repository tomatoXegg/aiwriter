import { v4 as uuidv4 } from 'uuid';
import { Tag, CreateTagDto, UpdateTagDto } from './types';
import Database from '../init';

export class TagModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateTagDto): Promise<Tag> {
    const tag: Tag = {
      id: uuidv4(),
      name: data.name,
      color: data.color || '#10B981',
      usage_count: 0,
      created_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO tags (id, name, color, usage_count, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        tag.id,
        tag.name,
        tag.color,
        tag.usage_count,
        tag.created_at,
      ]
    );

    return tag;
  }

  async findById(id: string): Promise<Tag | null> {
    const row = await this.db.get('SELECT * FROM tags WHERE id = ?', [id]);
    return row ? this.rowToTag(row) : null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const row = await this.db.get('SELECT * FROM tags WHERE name = ?', [name]);
    return row ? this.rowToTag(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'name' | 'usage_count' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ data: Tag[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tags WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM tags 
      WHERE 1=1 ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToTag);

    return { data, total };
  }

  async update(id: string, data: UpdateTagDto): Promise<Tag | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }

    if (updates.length === 0) return existing;

    params.push(id);

    await this.db.run(
      `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM tags WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async incrementUsage(tagId: string): Promise<void> {
    await this.db.run(
      'UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?',
      [tagId]
    );
  }

  async decrementUsage(tagId: string): Promise<void> {
    await this.db.run(
      'UPDATE tags SET usage_count = MAX(0, usage_count - 1) WHERE id = ?',
      [tagId]
    );
  }

  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    const rows = await this.db.all(
      'SELECT * FROM tags ORDER BY usage_count DESC LIMIT ?',
      [limit]
    );
    return rows.map(this.rowToTag);
  }

  async getOrCreateTag(name: string, color?: string): Promise<Tag> {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }

    return this.create({ name, color });
  }

  async getUsageStats(): Promise<{
    total: number;
    totalUsage: number;
    averageUsage: number;
    mostPopular: Tag | null;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM tags');
    const totalUsage = await this.db.get('SELECT SUM(usage_count) as total FROM tags');
    const mostPopular = await this.db.get(
      'SELECT * FROM tags ORDER BY usage_count DESC LIMIT 1'
    );

    return {
      total: total?.total || 0,
      totalUsage: totalUsage?.total || 0,
      averageUsage: total?.total ? Math.round((totalUsage?.total || 0) / total.total) : 0,
      mostPopular: mostPopular ? this.rowToTag(mostPopular) : null
    };
  }

  private rowToTag(row: any): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      usage_count: row.usage_count,
      created_at: row.created_at,
    };
  }
}