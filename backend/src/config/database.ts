const Database = require('../database/init');
const path = require('path');

class DatabaseConfig {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      this.db = new Database();
      await this.db.connect();
      await this.db.initTables();
      console.log('✅ Database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  getInstance() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseConfig();