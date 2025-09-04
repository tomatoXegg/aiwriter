import Database from '../init';
import { QueryBuilder } from './QueryBuilder';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'json';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export class DatabaseUtils {
  // Utility methods for common database operations
  static async tableExists(db: Database, tableName: string): Promise<boolean> {
    const result = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result !== null;
  }

  static async getTableInfo(db: Database, tableName: string): Promise<any[]> {
    return db.all(`PRAGMA table_info(${tableName})`);
  }

  static async getTableIndexes(db: Database, tableName: string): Promise<any[]> {
    return db.all(`PRAGMA index_list(${tableName})`);
  }

  static async getForeignKeyInfo(db: Database, tableName: string): Promise<any[]> {
    return db.all(`PRAGMA foreign_key_list(${tableName})`);
  }

  static async getDatabaseStats(db: Database): Promise<{
    tables: number;
    indexes: number;
    size: number;
    tablesInfo: Array<{ name: string; rows: number; size: number }>;
  }> {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    const tablesInfo = [];
    let totalSize = 0;

    for (const table of tables) {
      const rowCount = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
      const sizeInfo = await db.get(`SELECT SUM(pgsize) as size FROM dbstat WHERE name='${table.name}'`);
      
      const size = sizeInfo?.size || 0;
      totalSize += size;
      
      tablesInfo.push({
        name: table.name,
        rows: rowCount?.count || 0,
        size
      });
    }

    const indexes = await db.all(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    );

    return {
      tables: tables.length,
      indexes: indexes[0]?.count || 0,
      size: totalSize,
      tablesInfo
    };
  }

  static async backupDatabase(db: Database, backupPath: string): Promise<void> {
    return db.backup(backupPath);
  }

  static async optimizeDatabase(db: Database): Promise<void> {
    await db.run('VACUUM');
    await db.run('ANALYZE');
  }

  static async executeInTransaction(db: Database, operations: Array<() => Promise<any>>): Promise<any[]> {
    try {
      await db.beginTransaction();
      const results = [];
      
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      
      await db.commitTransaction();
      return results;
    } catch (error) {
      await db.rollbackTransaction();
      throw error;
    }
  }

  // Query helpers
  static createQueryBuilder(table: string): QueryBuilder {
    return QueryBuilder.table(table);
  }

  static async paginate(db: Database, table: string, options: {
    page?: number;
    limit?: number;
    where?: Record<string, any>;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, where, orderBy = 'created_at', order = 'DESC' } = options;
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = QueryBuilder.table(table);
    if (where) countQuery = countQuery.where(where);
    const total = await countQuery.count(db);

    // Build data query
    let dataQuery = QueryBuilder.table(table);
    if (where) dataQuery = dataQuery.where(where);
    dataQuery = dataQuery.orderBy(orderBy, order).limit(limit).offset(offset);
    const data = await dataQuery.execute(db);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async search(db: Database, table: string, searchTerm: string, options: {
    searchFields: string[];
    where?: Record<string, any>;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    data: any[];
    total: number;
  }> {
    const { searchFields, where = {}, limit = 50, offset = 0 } = options;
    
    // Build search conditions
    const searchConditions: Record<string, string> = {};
    for (const field of searchFields) {
      searchConditions[field] = searchTerm;
    }

    // Build count query
    let countQuery = QueryBuilder.table(table).where(where);
    for (const [field, term] of Object.entries(searchConditions)) {
      countQuery = countQuery.whereLike({ [field]: term });
    }
    const total = await countQuery.count(db);

    // Build data query
    let dataQuery = QueryBuilder.table(table).where(where);
    for (const [field, term] of Object.entries(searchConditions)) {
      dataQuery = dataQuery.whereLike({ [field]: term });
    }
    dataQuery = dataQuery.limit(limit).offset(offset);
    const data = await dataQuery.execute(db);

    return { data, total };
  }

  // Data validation
  static validate(data: any, schema: ValidationSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      // Required validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          value
        });
        continue;
      }

      // Skip other validations if field is empty and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      if (rules.type) {
        switch (rules.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({
                field,
                message: `${field} must be a string`,
                value
              });
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push({
                field,
                message: `${field} must be a number`,
                value
              });
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push({
                field,
                message: `${field} must be a boolean`,
                value
              });
            }
            break;
          case 'email':
            if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push({
                field,
                message: `${field} must be a valid email address`,
                value
              });
            }
            break;
          case 'url':
            if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
              errors.push({
                field,
                message: `${field} must be a valid URL`,
                value
              });
            }
            break;
          case 'json':
            try {
              JSON.parse(value);
            } catch {
              errors.push({
                field,
                message: `${field} must be valid JSON`,
                value
              });
            }
            break;
        }
      }

      // Length validation
      if (rules.min !== undefined && (typeof value === 'string' || Array.isArray(value))) {
        if (value.length < rules.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.min} characters long`,
            value
          });
        }
      }

      if (rules.max !== undefined && (typeof value === 'string' || Array.isArray(value))) {
        if (value.length > rules.max) {
          errors.push({
            field,
            message: `${field} must be no more than ${rules.max} characters long`,
            value
          });
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.test(value)) {
          errors.push({
            field,
            message: `${field} format is invalid`,
            value
          });
        }
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
          errors.push({
            field,
            message: typeof result === 'string' ? result : `${field} is invalid`,
            value
          });
        }
      }
    }

    return errors;
  }

  // Data sanitization
  static sanitize(data: any, schema: ValidationSchema): any {
    const sanitized: any = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (value === undefined || value === null) {
        continue;
      }

      // Type casting
      switch (rules.type) {
        case 'string':
          sanitized[field] = String(value);
          break;
        case 'number':
          sanitized[field] = Number(value);
          break;
        case 'boolean':
          sanitized[field] = Boolean(value);
          break;
        case 'json':
          if (typeof value === 'string') {
            try {
              sanitized[field] = JSON.parse(value);
            } catch {
              sanitized[field] = value;
            }
          } else {
            sanitized[field] = value;
          }
          break;
        default:
          sanitized[field] = value;
      }

      // Trimming for strings
      if (rules.type === 'string' && typeof sanitized[field] === 'string') {
        sanitized[field] = sanitized[field].trim();
      }
    }

    return sanitized;
  }

  // Utility functions
  static generateId(): string {
    return require('uuid').v4();
  }

  static formatDate(date: Date = new Date()): string {
    return date.toISOString();
  }

  static parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  static escapeLikePattern(pattern: string): string {
    return pattern.replace(/[%_\\]/g, '\\$&');
  }

  static buildLikeQuery(column: string, pattern: string): { query: string; params: any[] } {
    const escapedPattern = this.escapeLikePattern(pattern);
    return {
      query: `${column} LIKE ? ESCAPE '\\'`,
      params: [`%${escapedPattern}%`]
    };
  }
}