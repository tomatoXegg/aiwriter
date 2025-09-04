import { v4 as uuidv4 } from 'uuid';
import { Content, CreateContentDto } from './types';
import Database from '../init';

export class ContentModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateContentDto): Promise<Content> {
    const content: Content = {
      id: uuidv4(),
      title: data.title,
      body: data.body,
      topic_id: data.topic_id || null,
      account_id: data.account_id || null,
      status: 'draft',
      prompt: data.prompt || null,
      word_count: this.calculateWordCount(data.body),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO contents (id, title, body, topic_id, account_id, status, prompt, word_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
        content.title,
        content.body,
        content.topic_id,
        content.account_id,
        content.status,
        content.prompt,
        content.word_count,
        content.created_at,
        content.updated_at,
      ]
    );

    return content;
  }

  async findById(id: string): Promise<Content | null> {
    const row = await this.db.get('SELECT * FROM contents WHERE id = ?', [id]);
    return row ? this.rowToContent(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    account_id?: string;
    topic_id?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ data: Content[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      account_id, 
      topic_id,
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

    if (account_id) {
      whereClause += ' AND account_id = ?';
      params.push(account_id);
    }

    if (topic_id) {
      whereClause += ' AND topic_id = ?';
      params.push(topic_id);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR body LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM contents WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM contents 
      WHERE 1=1 ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToContent);

    return { data, total };
  }

  async update(id: string, data: Partial<CreateContentDto> & { status?: string }): Promise<Content | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.body !== undefined) {
      updates.push('body = ?');
      params.push(data.body);
      updates.push('word_count = ?');
      params.push(this.calculateWordCount(data.body));
    }
    if (data.topic_id !== undefined) {
      updates.push('topic_id = ?');
      params.push(data.topic_id);
    }
    if (data.account_id !== undefined) {
      updates.push('account_id = ?');
      params.push(data.account_id);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.prompt !== undefined) {
      updates.push('prompt = ?');
      params.push(data.prompt);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE contents SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM contents WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async findByAccountId(accountId: string): Promise<Content[]> {
    const rows = await this.db.all(
      'SELECT * FROM contents WHERE account_id = ? ORDER BY created_at DESC',
      [accountId]
    );
    return rows.map(this.rowToContent);
  }

  async findByTopicId(topicId: string): Promise<Content[]> {
    const rows = await this.db.all(
      'SELECT * FROM contents WHERE topic_id = ? ORDER BY created_at DESC',
      [topicId]
    );
    return rows.map(this.rowToContent);
  }

  async updateStatus(id: string, status: string): Promise<Content | null> {
    return this.update(id, { status });
  }

  async publish(id: string): Promise<Content | null> {
    return this.update(id, { status: 'published' });
  }

  async archive(id: string): Promise<Content | null> {
    return this.update(id, { status: 'archived' });
  }

  async getRecentContent(limit: number = 10): Promise<Content[]> {
    const rows = await this.db.all(
      'SELECT * FROM contents ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows.map(this.rowToContent);
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byAccount: Record<string, number>;
    totalWords: number;
    averageWords: number;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM contents');
    const byStatus = await this.db.all('SELECT status, COUNT(*) as count FROM contents GROUP BY status');
    const byAccount = await this.db.all('SELECT account_id, COUNT(*) as count FROM contents GROUP BY account_id');
    const wordStats = await this.db.get('SELECT SUM(word_count) as total_words, AVG(word_count) as avg_words FROM contents');

    return {
      total: total?.total || 0,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      byAccount: byAccount.reduce((acc, row) => {
        acc[row.account_id || 'unassigned'] = row.count;
        return acc;
      }, {} as Record<string, number>),
      totalWords: wordStats?.total_words || 0,
      averageWords: wordStats?.avg_words || 0
    };
  }

  private calculateWordCount(text: string): number {
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  private rowToContent(row: any): Content {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      topic_id: row.topic_id,
      account_id: row.account_id,
      status: row.status,
      prompt: row.prompt,
      word_count: row.word_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}