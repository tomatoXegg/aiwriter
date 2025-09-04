export * from './QueryBuilder';
export * from './DatabaseUtils';
export * from './ConnectionPool';

// Common validation schemas
export const validationSchemas = {
  account: {
    name: { required: true, type: 'string', min: 1, max: 100 },
    description: { type: 'string', max: 500 },
    platform: { type: 'string', pattern: /^(wechat|weibo|zhihu|other)$/ },
    status: { type: 'string', pattern: /^(active|inactive|suspended)$/ }
  },
  
  material: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    content: { required: true, type: 'string', min: 1 },
    tags: { type: 'json' },
    type: { type: 'string', pattern: /^(text|file|link|image)$/ },
    account_id: { type: 'string' }
  },
  
  topic: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    description: { type: 'string', max: 1000 },
    material_id: { type: 'string' },
    prompt: { type: 'string', max: 2000 },
    status: { type: 'string', pattern: /^(pending|approved|rejected|in_progress)$/ },
    score: { type: 'number', min: 0, max: 10 }
  },
  
  content: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    body: { required: true, type: 'string', min: 1 },
    topic_id: { type: 'string' },
    account_id: { type: 'string' },
    status: { type: 'string', pattern: /^(draft|published|archived|deleted)$/ },
    prompt: { type: 'string', max: 2000 },
    word_count: { type: 'number', min: 0 }
  },
  
  review: {
    content_id: { required: true, type: 'string' },
    quality_score: { required: true, type: 'number', min: 0, max: 10 },
    originality_score: { required: true, type: 'number', min: 0, max: 10 },
    suggestions: { type: 'json' },
    status: { type: 'string', pattern: /^(pending|approved|rejected|needs_revision)$/ }
  },
  
  configuration: {
    key: { required: true, type: 'string', min: 1, max: 100 },
    value: { required: true },
    type: { type: 'string', pattern: /^(string|integer|float|boolean|json)$/ },
    description: { type: 'string', max: 500 }
  },
  
  promptTemplate: {
    name: { required: true, type: 'string', min: 1, max: 100 },
    type: { required: true, type: 'string', pattern: /^(topic|content|review)$/ },
    template: { required: true, type: 'string', min: 1 },
    is_default: { type: 'boolean' }
  }
};

// Common query builders
export const queryBuilders = {
  account: (table = 'accounts') => require('./QueryBuilder').QueryBuilder.table(table),
  material: (table = 'materials') => require('./QueryBuilder').QueryBuilder.table(table),
  topic: (table = 'topics') => require('./QueryBuilder').QueryBuilder.table(table),
  content: (table = 'contents') => require('./QueryBuilder').QueryBuilder.table(table),
  review: (table = 'reviews') => require('./QueryBuilder').QueryBuilder.table(table),
  configuration: (table = 'configurations') => require('./QueryBuilder').QueryBuilder.table(table),
  promptTemplate: (table = 'prompt_templates') => require('./QueryBuilder').QueryBuilder.table(table)
};

// Utility functions for common operations
export const dbUtils = {
  // Date utilities
  dates: {
    now: () => new Date().toISOString(),
    addDays: (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    addHours: (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    format: (date: Date) => date.toISOString(),
    parse: (dateString: string) => new Date(dateString)
  },

  // ID generation
  generateId: () => require('uuid').v4(),

  // Text processing
  text: {
    truncate: (text: string, length: number, suffix = '...') => {
      if (text.length <= length) return text;
      return text.substring(0, length - suffix.length) + suffix;
    },
    slugify: (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },
    extractKeywords: (text: string, maxKeywords = 10) => {
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const wordFreq: Record<string, number> = {};
      
      words.forEach(word => {
        if (word.length > 2) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });

      return Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word);
    }
  },

  // File utilities
  files: {
    ensureDir: (dirPath: string) => {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    },
    getFileSize: (filePath: string) => {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.size;
    },
    getFileExtension: (fileName: string) => {
      return fileName.split('.').pop()?.toLowerCase() || '';
    }
  },

  // Validation helpers
  validation: {
    isValidEmail: (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    isValidUrl: (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    isValidJson: (jsonString: string) => {
      try {
        JSON.parse(jsonString);
        return true;
      } catch {
        return false;
      }
    },
    sanitizeInput: (input: string) => {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  },

  // Error handling
  errors: {
    isDatabaseError: (error: any) => {
      return error && error.code && error.code.startsWith('SQLITE_');
    },
    isUniqueConstraintError: (error: any) => {
      return error && error.code === 'SQLITE_CONSTRAINT_UNIQUE';
    },
    isForeignKeyError: (error: any) => {
      return error && error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY';
    },
    handleDatabaseError: (error: any, context: string) => {
      console.error(`Database error in ${context}:`, error);
      
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return new Error('Duplicate entry found');
      } else if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return new Error('Referenced entity not found');
      } else if (error.code === 'SQLITE_BUSY') {
        return new Error('Database is busy, please try again');
      } else {
        return new Error('Database operation failed');
      }
    }
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, Array<{ duration: number; timestamp: Date }>> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordQuery(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push({
      duration,
      timestamp: new Date()
    });
  }

  getMetrics(operation?: string) {
    if (operation) {
      const data = this.metrics.get(operation) || [];
      return this.calculateStats(data);
    }

    const allMetrics: Record<string, any> = {};
    for (const [op, data] of this.metrics) {
      allMetrics[op] = this.calculateStats(data);
    }
    return allMetrics;
  }

  private calculateStats(data: Array<{ duration: number; timestamp: Date }>) {
    if (data.length === 0) return null;

    const durations = data.map(d => d.duration);
    durations.sort((a, b) => a - b);

    return {
      count: data.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}