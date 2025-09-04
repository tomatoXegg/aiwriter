import { v4 as uuidv4 } from 'uuid';
import { Configuration, CreateConfigurationDto } from './types';
import Database from '../init';

export class ConfigurationModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateConfigurationDto): Promise<Configuration> {
    const config: Configuration = {
      id: uuidv4(),
      key: data.key,
      value: data.value,
      type: data.type,
      description: data.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO configurations (id, key, value, type, description, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        config.id,
        config.key,
        this.serializeValue(config.value, config.type),
        config.type,
        config.description,
        config.created_at,
        config.updated_at,
      ]
    );

    return config;
  }

  async findById(id: string): Promise<Configuration | null> {
    const row = await this.db.get('SELECT * FROM configurations WHERE id = ?', [id]);
    return row ? this.rowToConfiguration(row) : null;
  }

  async findByKey(key: string): Promise<Configuration | null> {
    const row = await this.db.get('SELECT * FROM configurations WHERE key = ?', [key]);
    return row ? this.rowToConfiguration(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  } = {}): Promise<{ data: Configuration[]; total: number }> {
    const { page = 1, limit = 10, type, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      whereClause += ' AND (key LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM configurations WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM configurations 
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToConfiguration);

    return { data, total };
  }

  async update(id: string, data: Partial<CreateConfigurationDto>): Promise<Configuration | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.key !== undefined) {
      updates.push('key = ?');
      params.push(data.key);
    }
    if (data.value !== undefined) {
      updates.push('value = ?');
      params.push(this.serializeValue(data.value, data.type || existing.type));
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE configurations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async updateByKey(key: string, value: any, type?: string): Promise<Configuration | null> {
    const existing = await this.findByKey(key);
    if (!existing) return null;

    return this.update(existing.id, { key, value, type: type || existing.type });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM configurations WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async deleteByKey(key: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM configurations WHERE key = ?', [key]);
    return result.changes > 0;
  }

  async getValue(key: string, defaultValue?: any): Promise<any> {
    const config = await this.findByKey(key);
    if (!config) return defaultValue;
    return config.value;
  }

  async getString(key: string, defaultValue?: string): Promise<string> {
    const value = await this.getValue(key, defaultValue);
    return String(value);
  }

  async getNumber(key: string, defaultValue?: number): Promise<number> {
    const value = await this.getValue(key, defaultValue);
    return Number(value);
  }

  async getBoolean(key: string, defaultValue?: boolean): Promise<boolean> {
    const value = await this.getValue(key, defaultValue);
    return Boolean(value);
  }

  async getJSON(key: string, defaultValue?: any): Promise<any> {
    const value = await this.getValue(key, defaultValue);
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    return value;
  }

  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const key of keys) {
      const config = await this.findByKey(key);
      if (config) {
        result[key] = config.value;
      }
    }
    
    return result;
  }

  async getByType(type: string): Promise<Configuration[]> {
    const rows = await this.db.all(
      'SELECT * FROM configurations WHERE type = ? ORDER BY key',
      [type]
    );
    return rows.map(this.rowToConfiguration);
  }

  async getAllAsObject(): Promise<Record<string, any>> {
    const rows = await this.db.all('SELECT * FROM configurations');
    return rows.reduce((acc, row) => {
      acc[row.key] = this.rowToConfiguration(row).value;
      return acc;
    }, {} as Record<string, any>);
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM configurations');
    const byType = await this.db.all('SELECT type, COUNT(*) as count FROM configurations GROUP BY type');

    return {
      total: total?.total || 0,
      byType: byType.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private serializeValue(value: any, type: string): string {
    switch (type) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? '1' : '0';
      case 'integer':
      case 'float':
        return String(value);
      case 'string':
      default:
        return String(value);
    }
  }

  private deserializeValue(value: string, type: string): any {
    switch (type) {
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'boolean':
        return value === '1' || value.toLowerCase() === 'true';
      case 'integer':
        return parseInt(value, 10);
      case 'float':
        return parseFloat(value);
      case 'string':
      default:
        return value;
    }
  }

  private rowToConfiguration(row: any): Configuration {
    return {
      id: row.id,
      key: row.key,
      value: this.deserializeValue(row.value, row.type),
      type: row.type,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}