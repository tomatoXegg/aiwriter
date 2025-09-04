import Database from '../database/init';

export interface DatabaseInstance {
  run: (query: string, params?: any[]) => Promise<{ id: number; changes: number }>;
  get: (query: string, params?: any[]) => Promise<any>;
  all: (query: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
}

class DatabaseConfig {
  private db: DatabaseInstance | null = null;

  async initialize(): Promise<DatabaseInstance> {
    try {
      const database = new Database();
      await database.connect();
      await database.initTables();
      this.db = database;
      console.log('✅ Database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  getInstance(): DatabaseInstance {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export default new DatabaseConfig();