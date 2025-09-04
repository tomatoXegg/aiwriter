import Database from '../init';
import { DatabaseService } from './DatabaseService';

export interface ReportOptions {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  format?: 'json' | 'csv' | 'html';
}

export interface ReportData {
  summary: any;
  accounts: any[];
  contents: any[];
  reviews: any;
  trends: any;
}

export class ReportService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  async generateContentReport(options: ReportOptions = {}): Promise<ReportData> {
    const { startDate, endDate, accountId } = options;

    // Build date filters
    const dateFilter: any = {};
    if (startDate) dateFilter.startDate = startDate;
    if (endDate) dateFilter.endDate = endDate;
    if (accountId) dateFilter.accountId = accountId;

    // Get summary statistics
    const summary = await this.getContentSummary(dateFilter);

    // Get account performance
    const accounts = await this.getAccountPerformance(dateFilter);

    // Get content details
    const contents = await this.getContentDetails(dateFilter);

    // Get review statistics
    const reviews = await this.getReviewStatistics(dateFilter);

    // Get trends
    const trends = await this.getContentTrends(dateFilter);

    return {
      summary,
      accounts,
      contents,
      reviews,
      trends
    };
  }

  private async getContentSummary(filters: any): Promise<any> {
    const db = this.dbService['db'];
    
    let whereClause = '';
    const params: any[] = [];

    if (filters.startDate) {
      whereClause += ' AND c.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND c.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.accountId) {
      whereClause += ' AND c.account_id = ?';
      params.push(filters.accountId);
    }

    const query = `
      SELECT 
        COUNT(*) as total_contents,
        SUM(c.word_count) as total_words,
        AVG(c.word_count) as avg_words,
        COUNT(CASE WHEN c.status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN c.status = 'archived' THEN 1 END) as archived_count,
        MIN(c.created_at) as earliest_content,
        MAX(c.created_at) as latest_content
      FROM contents c
      WHERE 1=1 ${whereClause}
    `;

    return db.get(query, params);
  }

  private async getAccountPerformance(filters: any): Promise<any[]> {
    const db = this.dbService['db'];
    
    let whereClause = '';
    const params: any[] = [];

    if (filters.startDate) {
      whereClause += ' AND c.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND c.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.accountId) {
      whereClause += ' AND c.account_id = ?';
      params.push(filters.accountId);
    }

    const query = `
      SELECT 
        a.id,
        a.name,
        a.platform,
        COUNT(c.id) as content_count,
        SUM(c.word_count) as total_words,
        AVG(c.word_count) as avg_words,
        COUNT(CASE WHEN c.status = 'published' THEN 1 END) as published_count,
        AVG(r.quality_score) as avg_quality_score,
        AVG(r.originality_score) as avg_originality_score
      FROM accounts a
      LEFT JOIN contents c ON a.id = c.account_id
      LEFT JOIN reviews r ON c.id = r.content_id
      WHERE 1=1 ${whereClause}
      GROUP BY a.id, a.name, a.platform
      ORDER BY content_count DESC
    `;

    return db.all(query, params);
  }

  private async getContentDetails(filters: any): Promise<any[]> {
    const db = this.dbService['db'];
    
    let whereClause = '';
    const params: any[] = [];

    if (filters.startDate) {
      whereClause += ' AND c.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND c.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.accountId) {
      whereClause += ' AND c.account_id = ?';
      params.push(filters.accountId);
    }

    const query = `
      SELECT 
        c.id,
        c.title,
        c.status,
        c.word_count,
        c.created_at,
        c.updated_at,
        a.name as account_name,
        t.title as topic_title,
        r.quality_score,
        r.originality_score,
        r.status as review_status
      FROM contents c
      LEFT JOIN accounts a ON c.account_id = a.id
      LEFT JOIN topics t ON c.topic_id = t.id
      LEFT JOIN reviews r ON c.id = r.content_id
      WHERE 1=1 ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT 100
    `;

    return db.all(query, params);
  }

  private async getReviewStatistics(filters: any): Promise<any> {
    const db = this.dbService['db'];
    
    let whereClause = '';
    const params: any[] = [];

    if (filters.startDate) {
      whereClause += ' AND r.reviewed_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND r.reviewed_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.accountId) {
      whereClause += ' AND c.account_id = ?';
      params.push(filters.accountId);
    }

    const query = `
      SELECT 
        COUNT(r.id) as total_reviews,
        AVG(r.quality_score) as avg_quality_score,
        AVG(r.originality_score) as avg_originality_score,
        COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN r.status = 'needs_revision' THEN 1 END) as needs_revision_count
      FROM reviews r
      LEFT JOIN contents c ON r.content_id = c.id
      WHERE 1=1 ${whereClause}
    `;

    return db.get(query, params);
  }

  private async getContentTrends(filters: any): Promise<any> {
    const db = this.dbService['db'];
    
    let whereClause = '';
    const params: any[] = [];

    if (filters.startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.accountId) {
      whereClause += ' AND account_id = ?';
      params.push(filters.accountId);
    }

    // Daily content creation trends
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as content_count,
        SUM(word_count) as total_words
      FROM contents
      WHERE 1=1 ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Monthly content creation trends
    const monthlyQuery = `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as content_count,
        SUM(word_count) as total_words
      FROM contents
      WHERE 1=1 ${whereClause}
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    const [dailyTrends, monthlyTrends] = await Promise.all([
      db.all(dailyQuery, params),
      db.all(monthlyQuery, params)
    ]);

    return {
      daily: dailyTrends,
      monthly: monthlyTrends
    };
  }

  async exportToCSV(data: any[], filename: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const { parse } = require('json2csv');

    try {
      const csv = parse(data);
      const filepath = path.join(process.cwd(), 'exports', filename);
      
      // Ensure exports directory exists
      const exportDir = path.dirname(filepath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      fs.writeFileSync(filepath, csv);
      return filepath;
    } catch (error) {
      throw new Error(`Failed to export CSV: ${error}`);
    }
  }

  async exportToJSON(data: any, filename: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    try {
      const filepath = path.join(process.cwd(), 'exports', filename);
      
      // Ensure exports directory exists
      const exportDir = path.dirname(filepath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      return filepath;
    } catch (error) {
      throw new Error(`Failed to export JSON: ${error}`);
    }
  }

  async exportToHTML(data: ReportData, filename: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    try {
      const html = this.generateHTMLReport(data);
      const filepath = path.join(process.cwd(), 'exports', filename);
      
      // Ensure exports directory exists
      const exportDir = path.dirname(filepath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      fs.writeFileSync(filepath, html);
      return filepath;
    } catch (error) {
      throw new Error(`Failed to export HTML: ${error}`);
    }
  }

  private generateHTMLReport(data: ReportData): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Writer 内容报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .stat-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; min-width: 200px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .chart { height: 300px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Writer 内容报告</h1>
        <p>生成时间: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>概览统计</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${data.summary.total_contents || 0}</div>
                <div class="stat-label">总内容数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(data.summary.avg_words || 0)}</div>
                <div class="stat-label">平均字数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.published_count || 0}</div>
                <div class="stat-label">已发布</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(data.reviews.avg_quality_score || 0)}</div>
                <div class="stat-label">平均质量分</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>账号表现</h2>
        <table>
            <thead>
                <tr>
                    <th>账号名称</th>
                    <th>平台</th>
                    <th>内容数</th>
                    <th>总字数</th>
                    <th>平均质量分</th>
                </tr>
            </thead>
            <tbody>
                ${data.accounts.map(account => `
                    <tr>
                        <td>${account.name}</td>
                        <td>${account.platform}</td>
                        <td>${account.content_count}</td>
                        <td>${account.total_words}</td>
                        <td>${Math.round(account.avg_quality_score || 0)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>内容趋势</h2>
        <div class="chart">
            <p>每日内容创建趋势</p>
            <ul>
                ${data.trends.daily.slice(0, 7).map(day => `
                    <li>${day.date}: ${day.content_count} 篇内容</li>
                `).join('')}
            </ul>
        </div>
    </div>
</body>
</html>
    `;
  }

  async generateScheduledReports(): Promise<void> {
    // Generate daily summary report
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dailyReport = await this.generateContentReport({
      startDate: yesterday.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });

    // Export daily report
    const timestamp = today.toISOString().split('T')[0];
    await this.exportToJSON(dailyReport, `reports/daily-summary-${timestamp}.json`);
    await this.exportToHTML(dailyReport, `reports/daily-summary-${timestamp}.html`);

    console.log(`Daily report generated for ${timestamp}`);
  }

  async cleanupOldReports(daysToKeep: number = 30): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(process.cwd(), 'reports');

    if (!fs.existsSync(reportsDir)) return;

    const files = fs.readdirSync(reportsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old report: ${file}`);
      }
    }
  }
}