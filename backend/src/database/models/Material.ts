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
      created_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO materials (id, title, content, tags, type, file_path, account_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        material.id,
        material.title,
        material.content,
        JSON.stringify(material.tags),
        material.type,
        material.file_path,
        material.account_id,
        material.created_at,
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
  } = {}): Promise<{ data: Material[]; total: number }> {
    const { page = 1, limit = 10, type, account_id, search } = options;
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

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
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

    if (updates.length === 0) return existing;

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
      created_at: row.created_at,
    };
  }
}