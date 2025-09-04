export { default as Database } from './init';
export * from './models';
export * from './migrations';
export * from './seeds';
export * from './services';
export * from './utils';

// Database initialization and setup
export async function initializeDatabase(): Promise<Database> {
  const Database = require('./init').default;
  const database = new Database();
  
  await database.connect();
  await database.initTables();
  
  return database;
}

// Quick start function
export async function quickStart(): Promise<{
  database: Database;
  services: import('./services').Services;
}> {
  const database = await initializeDatabase();
  const { createServices } = require('./services');
  const services = createServices(database);
  
  return { database, services };
}

// Database health check
export async function checkDatabaseHealth(db: Database): Promise<{
  healthy: boolean;
  details: {
    connected: boolean;
    tables: string[];
    tableCount: number;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const details = {
    connected: false,
    tables: [] as string[],
    tableCount: 0
  };

  try {
    const status = await db.getStatus();
    details.connected = status.connected;
    details.tables = status.tables || [];
    details.tableCount = details.tables.length;

    if (!details.connected) {
      errors.push('Database not connected');
    }

    // Check if essential tables exist
    const essentialTables = ['accounts', 'materials', 'topics', 'contents', 'reviews', 'configurations'];
    const missingTables = essentialTables.filter(table => !details.tables.includes(table));
    
    if (missingTables.length > 0) {
      errors.push(`Missing essential tables: ${missingTables.join(', ')}`);
    }

  } catch (error) {
    errors.push(`Health check failed: ${error}`);
  }

  return {
    healthy: errors.length === 0,
    details,
    errors
  };
}

// Database information
export interface DatabaseInfo {
  version: string;
  tables: string[];
  size: number;
  lastBackup?: string;
  stats: {
    accounts: number;
    materials: number;
    topics: number;
    contents: number;
    reviews: number;
  };
}

export async function getDatabaseInfo(db: Database): Promise<DatabaseInfo> {
  const [status, stats] = await Promise.all([
    db.getStatus(),
    db.getRowCount('accounts'),
    db.getRowCount('materials'),
    db.getRowCount('topics'),
    db.getRowCount('contents'),
    db.getRowCount('reviews')
  ]);

  return {
    version: '1.0.0',
    tables: status.tables || [],
    size: 0, // Would need to calculate actual file size
    stats: {
      accounts: stats,
      materials: await db.getRowCount('materials'),
      topics: await db.getRowCount('topics'),
      contents: await db.getRowCount('contents'),
      reviews: await db.getRowCount('reviews')
    }
  };
}

// Database utilities
export const dbUtils = {
  // Connection utilities
  async testConnection(dbPath?: string): Promise<boolean> {
    try {
      const Database = require('./init').default;
      const db = new Database();
      await db.connect();
      await db.close();
      return true;
    } catch {
      return false;
    }
  },

  // Backup utilities
  async createBackup(db: Database, filename?: string): Promise<string> {
    const path = require('path');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = filename || `aiwriter-backup-${timestamp}.db`;
    const backupPath = path.join(process.cwd(), 'backups', backupFilename);
    
    // Ensure backup directory exists
    const fs = require('fs');
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    await db.backup(backupPath);
    return backupPath;
  },

  // Reset database (for testing/development)
  async resetDatabase(db: Database): Promise<void> {
    const tables = ['reviews', 'contents', 'topics', 'materials', 'accounts', 'configurations', 'prompt_templates'];
    
    for (const table of tables) {
      await db.run(`DELETE FROM ${table}`);
    }
  }
};

// Error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: any): DatabaseError {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new DatabaseError('Duplicate entry found', 'UNIQUE_CONSTRAINT', error);
  } else if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new DatabaseError('Foreign key constraint failed', 'FOREIGN_KEY', error);
  } else if (error.code === 'SQLITE_BUSY') {
    return new DatabaseError('Database is busy', 'DATABASE_BUSY', error);
  } else if (error.code === 'SQLITE_LOCKED') {
    return new DatabaseError('Database is locked', 'DATABASE_LOCKED', error);
  } else if (error.code === 'SQLITE_CORRUPT') {
    return new DatabaseError('Database file is corrupted', 'DATABASE_CORRUPT', error);
  } else {
    return new DatabaseError(`Database error: ${error.message}`, 'UNKNOWN', error);
  }
}

// Logging utilities
export const dbLogger = {
  info: (message: string, data?: any) => {
    console.log(`[Database] ${message}`, data || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[Database] ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[Database] ${message}`, error || '');
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Database] ${message}`, data || '');
    }
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

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
    this.metrics.get(operation)!.push(duration);
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

  private calculateStats(data: number[]) {
    if (data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    return {
      count: data.length,
      avg: data.reduce((a, b) => a + b, 0) / data.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Export all types for external use
export type * from './models/types';