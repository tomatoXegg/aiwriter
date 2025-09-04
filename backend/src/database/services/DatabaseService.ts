import Database from '../init';
import { Models, createModels } from '../models';
import { DatabaseUtils, QueryBuilder } from '../utils';

export class DatabaseService {
  private db: Database;
  private models: Models;

  constructor(database: Database) {
    this.db = database;
    this.models = createModels(database);
  }

  // Initialize database
  async initialize(): Promise<void> {
    await this.db.connect();
    await this.db.initTables();
  }

  // Get database status
  async getStatus(): Promise<any> {
    return this.db.getStatus();
  }

  // Account operations
  async createAccount(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      name: { required: true, type: 'string', min: 1, max: 100 },
      description: { type: 'string', max: 500 },
      platform: { type: 'string', pattern: /^(wechat|weibo|zhihu|other)$/ }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return this.models.account.create(data);
  }

  async getAccounts(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.account.findAll(options);
  }

  async getAccountById(id: string): Promise<any | null> {
    return this.models.account.findById(id);
  }

  async updateAccount(id: string, data: any): Promise<any | null> {
    return this.models.account.update(id, data);
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.models.account.delete(id);
  }

  async getAccountStats(): Promise<any> {
    return this.models.account.getStats();
  }

  // Material operations
  async createMaterial(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      title: { required: true, type: 'string', min: 1, max: 200 },
      content: { required: true, type: 'string', min: 1 },
      tags: { type: 'json' },
      type: { type: 'string', pattern: /^(text|file|link|image)$/ }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return this.models.material.create(data);
  }

  async getMaterials(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.material.findAll(options);
  }

  async getMaterialById(id: string): Promise<any | null> {
    return this.models.material.findById(id);
  }

  async updateMaterial(id: string, data: any): Promise<any | null> {
    return this.models.material.update(id, data);
  }

  async deleteMaterial(id: string): Promise<boolean> {
    return this.models.material.delete(id);
  }

  async searchMaterialsByTags(tags: string[]): Promise<any[]> {
    return this.models.material.searchByTags(tags);
  }

  async getMaterialStats(): Promise<any> {
    return this.models.material.getStats();
  }

  // Topic operations
  async createTopic(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      title: { required: true, type: 'string', min: 1, max: 200 },
      description: { type: 'string', max: 1000 },
      material_id: { type: 'string' }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return this.models.topic.create(data);
  }

  async getTopics(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.topic.findAll(options);
  }

  async getTopicById(id: string): Promise<any | null> {
    return this.models.topic.findById(id);
  }

  async updateTopic(id: string, data: any): Promise<any | null> {
    return this.models.topic.update(id, data);
  }

  async deleteTopic(id: string): Promise<boolean> {
    return this.models.topic.delete(id);
  }

  async getTopTopics(limit: number = 10): Promise<any[]> {
    return this.models.topic.getTopTopics(limit);
  }

  async getTopicStats(): Promise<any> {
    return this.models.topic.getStats();
  }

  // Content operations
  async createContent(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      title: { required: true, type: 'string', min: 1, max: 200 },
      body: { required: true, type: 'string', min: 1 },
      topic_id: { type: 'string' },
      account_id: { type: 'string' }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    const content = await this.models.content.create(data);
    
    // Update account content count
    if (data.account_id) {
      await this.models.account.incrementContentCount(data.account_id);
    }

    return content;
  }

  async getContents(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.content.findAll(options);
  }

  async getContentById(id: string): Promise<any | null> {
    return this.models.content.findById(id);
  }

  async updateContent(id: string, data: any): Promise<any | null> {
    return this.models.content.update(id, data);
  }

  async deleteContent(id: string): Promise<boolean> {
    const content = await this.models.content.findById(id);
    if (!content) return false;

    const result = await this.models.content.delete(id);
    
    // Update account content count
    if (content.account_id) {
      await this.models.account.decrementContentCount(content.account_id);
    }

    return result;
  }

  async publishContent(id: string): Promise<any | null> {
    return this.models.content.publish(id);
  }

  async archiveContent(id: string): Promise<any | null> {
    return this.models.content.archive(id);
  }

  async getContentStats(): Promise<any> {
    return this.models.content.getStats();
  }

  // Review operations
  async createReview(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      content_id: { required: true, type: 'string' },
      quality_score: { required: true, type: 'number', min: 0, max: 10 },
      originality_score: { required: true, type: 'number', min: 0, max: 10 },
      suggestions: { type: 'json' }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return this.models.review.create(data);
  }

  async getReviews(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.review.findAll(options);
  }

  async getReviewById(id: string): Promise<any | null> {
    return this.models.review.findById(id);
  }

  async updateReview(id: string, data: any): Promise<any | null> {
    return this.models.review.update(id, data);
  }

  async deleteReview(id: string): Promise<boolean> {
    return this.models.review.delete(id);
  }

  async approveReview(id: string): Promise<any | null> {
    return this.models.review.approve(id);
  }

  async rejectReview(id: string): Promise<any | null> {
    return this.models.review.reject(id);
  }

  async getReviewStats(): Promise<any> {
    return this.models.review.getQualityStats();
  }

  // Configuration operations
  async createConfiguration(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      key: { required: true, type: 'string', min: 1, max: 100 },
      value: { required: true },
      type: { type: 'string', pattern: /^(string|integer|float|boolean|json)$/ }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return this.models.configuration.create(data);
  }

  async getConfigurations(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.configuration.findAll(options);
  }

  async getConfigurationById(id: string): Promise<any | null> {
    return this.models.configuration.findById(id);
  }

  async getConfigurationByKey(key: string): Promise<any | null> {
    return this.models.configuration.findByKey(key);
  }

  async updateConfiguration(id: string, data: any): Promise<any | null> {
    return this.models.configuration.update(id, data);
  }

  async updateConfigurationByKey(key: string, value: any, type?: string): Promise<any | null> {
    return this.models.configuration.updateByKey(key, value, type);
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    return this.models.configuration.delete(id);
  }

  async getConfigurationValue(key: string, defaultValue?: any): Promise<any> {
    return this.models.configuration.getValue(key, defaultValue);
  }

  async getAllConfigurations(): Promise<Record<string, any>> {
    return this.models.configuration.getAllAsObject();
  }

  // Prompt Template operations
  async createPromptTemplate(data: any): Promise<any> {
    const errors = DatabaseUtils.validate(data, {
      name: { required: true, type: 'string', min: 1, max: 100 },
      type: { required: true, type: 'string', pattern: /^(topic|content|review)$/ },
      template: { required: true, type: 'string', min: 1 }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return this.models.promptTemplate.create(data);
  }

  async getPromptTemplates(options: any = {}): Promise<{ data: any[]; total: number }> {
    return this.models.promptTemplate.findAll(options);
  }

  async getPromptTemplateById(id: string): Promise<any | null> {
    return this.models.promptTemplate.findById(id);
  }

  async getPromptTemplatesByType(type: string): Promise<any[]> {
    return this.models.promptTemplate.findByType(type);
  }

  async getDefaultPromptTemplate(type: string): Promise<any | null> {
    return this.models.promptTemplate.findDefaultByType(type);
  }

  async updatePromptTemplate(id: string, data: any): Promise<any | null> {
    return this.models.promptTemplate.update(id, data);
  }

  async deletePromptTemplate(id: string): Promise<boolean> {
    return this.models.promptTemplate.delete(id);
  }

  async setPromptTemplateAsDefault(id: string): Promise<any | null> {
    return this.models.promptTemplate.setAsDefault(id);
  }

  async renderPromptTemplate(id: string, variables: Record<string, any>): Promise<string> {
    return this.models.promptTemplate.renderTemplate(id, variables);
  }

  async validatePromptTemplate(template: string): Promise<{ valid: boolean; errors: string[] }> {
    return this.models.promptTemplate.validateTemplate(template);
  }

  // Advanced queries
  async getDashboardStats(): Promise<any> {
    const [accountStats, materialStats, topicStats, contentStats, reviewStats] = await Promise.all([
      this.models.account.getStats(),
      this.models.material.getStats(),
      this.models.topic.getStats(),
      this.models.content.getStats(),
      this.models.review.getQualityStats()
    ]);

    return {
      accounts: accountStats,
      materials: materialStats,
      topics: topicStats,
      contents: contentStats,
      reviews: reviewStats
    };
  }

  async searchContent(searchTerm: string, options: any = {}): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Search in contents table
    const searchResults = await DatabaseUtils.search(
      this.db,
      'contents',
      searchTerm,
      {
        searchFields: ['title', 'body'],
        limit,
        offset
      }
    );

    return {
      data: searchResults.data,
      total: searchResults.total,
      page,
      limit,
      totalPages: Math.ceil(searchResults.total / limit)
    };
  }

  async getContentWorkflow(options: any = {}): Promise<any[]> {
    const { status, limit = 50 } = options;
    
    let query = QueryBuilder.table('contents')
      .select(['contents.*', 'accounts.name as account_name', 'topics.title as topic_title'])
      .join('accounts', 'contents.account_id = accounts.id', 'LEFT')
      .join('topics', 'contents.topic_id = topics.id', 'LEFT')
      .orderBy('contents.updated_at', 'DESC')
      .limit(limit);

    if (status) {
      query = query.where({ status });
    }

    return query.execute(this.db);
  }

  // Database maintenance
  async backupDatabase(backupPath?: string): Promise<string> {
    const path = require('path');
    const fs = require('fs');
    
    if (!backupPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = path.join(process.cwd(), 'backups', `aiwriter-backup-${timestamp}.db`);
    }

    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    await this.db.backup(backupPath);
    return backupPath;
  }

  async optimizeDatabase(): Promise<void> {
    await this.db.vacuum();
    console.log('Database optimized successfully');
  }

  async getDatabaseInfo(): Promise<any> {
    const [status, stats] = await Promise.all([
      this.db.getStatus(),
      DatabaseUtils.getDatabaseStats(this.db)
    ]);

    return {
      status,
      stats
    };
  }

  // Close database connection
  async close(): Promise<void> {
    await this.db.close();
  }
}