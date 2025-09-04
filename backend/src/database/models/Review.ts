import { v4 as uuidv4 } from 'uuid';
import { Review, CreateReviewDto, ReviewSuggestion } from './types';
import Database from '../init';

export class ReviewModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreateReviewDto): Promise<Review> {
    const review: Review = {
      id: uuidv4(),
      content_id: data.content_id,
      quality_score: data.quality_score,
      originality_score: data.originality_score,
      suggestions: data.suggestions || [],
      status: 'pending',
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO reviews (id, content_id, quality_score, originality_score, suggestions, status, reviewed_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        review.id,
        review.content_id,
        review.quality_score,
        review.originality_score,
        JSON.stringify(review.suggestions),
        review.status,
        review.reviewed_at,
        review.created_at,
      ]
    );

    return review;
  }

  async findById(id: string): Promise<Review | null> {
    const row = await this.db.get('SELECT * FROM reviews WHERE id = ?', [id]);
    return row ? this.rowToReview(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    content_id?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{ data: Review[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      content_id,
      sortBy = 'reviewed_at',
      sortOrder = 'DESC'
    } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (content_id) {
      whereClause += ' AND content_id = ?';
      params.push(content_id);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM reviews WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM reviews 
      WHERE 1=1 ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToReview);

    return { data, total };
  }

  async update(id: string, data: Partial<CreateReviewDto> & { status?: string }): Promise<Review | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.quality_score !== undefined) {
      updates.push('quality_score = ?');
      params.push(data.quality_score);
    }
    if (data.originality_score !== undefined) {
      updates.push('originality_score = ?');
      params.push(data.originality_score);
    }
    if (data.suggestions !== undefined) {
      updates.push('suggestions = ?');
      params.push(JSON.stringify(data.suggestions));
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (updates.length === 0) return existing;

    updates.push('reviewed_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM reviews WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async findByContentId(contentId: string): Promise<Review[]> {
    const rows = await this.db.all(
      'SELECT * FROM reviews WHERE content_id = ? ORDER BY reviewed_at DESC',
      [contentId]
    );
    return rows.map(this.rowToReview);
  }

  async findLatestByContentId(contentId: string): Promise<Review | null> {
    const row = await this.db.get(
      'SELECT * FROM reviews WHERE content_id = ? ORDER BY reviewed_at DESC LIMIT 1',
      [contentId]
    );
    return row ? this.rowToReview(row) : null;
  }

  async updateStatus(id: string, status: string): Promise<Review | null> {
    return this.update(id, { status });
  }

  async approve(id: string): Promise<Review | null> {
    return this.update(id, { status: 'approved' });
  }

  async reject(id: string): Promise<Review | null> {
    return this.update(id, { status: 'rejected' });
  }

  async requestRevision(id: string): Promise<Review | null> {
    return this.update(id, { status: 'needs_revision' });
  }

  async getQualityStats(): Promise<{
    averageQualityScore: number;
    averageOriginalityScore: number;
    byStatus: Record<string, number>;
    totalReviews: number;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM reviews');
    const avgQuality = await this.db.get('SELECT AVG(quality_score) as avg_quality FROM reviews');
    const avgOriginality = await this.db.get('SELECT AVG(originality_score) as avg_originality FROM reviews');
    const byStatus = await this.db.all('SELECT status, COUNT(*) as count FROM reviews GROUP BY status');

    return {
      averageQualityScore: avgQuality?.avg_quality || 0,
      averageOriginalityScore: avgOriginality?.avg_originality || 0,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      totalReviews: total?.total || 0
    };
  }

  async getTopQualityContent(limit: number = 10): Promise<Array<{ content_id: string; average_score: number }>> {
    const rows = await this.db.all(`
      SELECT 
        content_id,
        AVG((quality_score + originality_score) / 2) as average_score
      FROM reviews 
      GROUP BY content_id 
      ORDER BY average_score DESC 
      LIMIT ?
    `, [limit]);
    
    return rows.map(row => ({
      content_id: row.content_id,
      average_score: row.average_score
    }));
  }

  private rowToReview(row: any): Review {
    return {
      id: row.id,
      content_id: row.content_id,
      quality_score: row.quality_score,
      originality_score: row.originality_score,
      suggestions: JSON.parse(row.suggestions || '[]'),
      status: row.status,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
    };
  }
}