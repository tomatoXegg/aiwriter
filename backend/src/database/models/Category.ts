import { v4 as uuidv4 } from 'uuid';
import { Category, CreateCategoryDto, UpdateCategoryDto } from './types';
import Database from '../init';

export class CategoryModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const category: Category = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      color: data.color || '#3B82F6',
      created_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO categories (id, name, description, color, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        category.id,
        category.name,
        category.description,
        category.color,
        category.created_at,
      ]
    );

    return category;
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.db.get('SELECT * FROM categories WHERE id = ?', [id]);
    return row ? this.rowToCategory(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{ data: Category[]; total: number }> {
    const { page = 1, limit = 10, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM categories WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM categories 
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToCategory);

    return { data, total };
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }

    if (updates.length === 0) return existing;

    params.push(id);

    await this.db.run(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async getMaterialCount(categoryId: string): Promise<number> {
    const result = await this.db.get(
      'SELECT COUNT(*) as count FROM materials WHERE category_id = ?',
      [categoryId]
    );
    return result ? result.count : 0;
  }

  async getUsageStats(): Promise<{
    total: number;
    withMaterials: number;
    topCategories: Array<{ category: Category; materialCount: number }>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM categories');
    
    const withMaterials = await this.db.get(`
      SELECT COUNT(DISTINCT category_id) as count 
      FROM materials 
      WHERE category_id IS NOT NULL
    `);

    const topCategories = await this.db.all(`
      SELECT c.*, COUNT(m.id) as material_count
      FROM categories c
      LEFT JOIN materials m ON c.id = m.category_id
      GROUP BY c.id
      ORDER BY material_count DESC
      LIMIT 10
    `);

    return {
      total: total?.total || 0,
      withMaterials: withMaterials?.count || 0,
      topCategories: topCategories.map((row: any) => ({
        category: this.rowToCategory(row),
        materialCount: row.material_count
      }))
    };
  }

  private rowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      created_at: row.created_at,
    };
  }
}