import { v4 as uuidv4 } from 'uuid';
import { Account, CreateAccountDto, UpdateAccountDto } from './types';
import Database from '../init';

export class AccountModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateAccountDto): Promise<Account> {
    const account: Account = {
      id: uuidv4(),
      name: data.name,
      description: data.description || null,
      platform: data.platform || 'wechat',
      status: 'active',
      content_count: 0,
      created_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO accounts (id, name, description, platform, status, content_count, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [account.id, account.name, account.description, account.platform, account.status, account.content_count, account.created_at]
    );

    return account;
  }

  async findById(id: string): Promise<Account | null> {
    const row = await this.db.get('SELECT * FROM accounts WHERE id = ?', [id]);
    return row ? this.rowToAccount(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
    search?: string;
  } = {}): Promise<{ data: Account[]; total: number }> {
    const { page = 1, limit = 10, status, platform, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (platform) {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM accounts WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM accounts 
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToAccount);

    return { data, total };
  }

  async update(id: string, data: UpdateAccountDto): Promise<Account | null> {
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
    if (data.platform !== undefined) {
      updates.push('platform = ?');
      params.push(data.platform);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM accounts WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async incrementContentCount(id: string): Promise<void> {
    await this.db.run(
      'UPDATE accounts SET content_count = content_count + 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  async decrementContentCount(id: string): Promise<void> {
    await this.db.run(
      'UPDATE accounts SET content_count = CASE WHEN content_count > 0 THEN content_count - 1 ELSE 0 END, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byPlatform: Record<string, number>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM accounts');
    const active = await this.db.get('SELECT COUNT(*) as active FROM accounts WHERE status = "active"');
    const inactive = await this.db.get('SELECT COUNT(*) as inactive FROM accounts WHERE status = "inactive"');
    const byPlatform = await this.db.all('SELECT platform, COUNT(*) as count FROM accounts GROUP BY platform');

    return {
      total: total?.total || 0,
      active: active?.active || 0,
      inactive: inactive?.inactive || 0,
      byPlatform: byPlatform.reduce((acc, row) => {
        acc[row.platform] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private rowToAccount(row: any): Account {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      platform: row.platform,
      status: row.status,
      content_count: row.content_count,
      created_at: row.created_at,
    };
  }
}