import sqlite3 from 'sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DatabaseRow {
  [key: string]: any;
}

export interface QueryResult {
  id: number;
  changes: number;
}

export default class Database {
  private db: sqlite3.Database | null = null;

  constructor() {
    this.db = null;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../../database/aiwriter.db');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async initTables(): Promise<void> {
    const queries = [
      // Accounts table
      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        platform TEXT DEFAULT 'wechat',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        content_count INTEGER DEFAULT 0
      )`,

      // Materials table
      `CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT, -- JSON array
        type TEXT DEFAULT 'text',
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        account_id TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE SET NULL
      )`,

      // Topics table
      `CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        material_id TEXT,
        prompt TEXT,
        status TEXT DEFAULT 'pending',
        score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE SET NULL
      )`,

      // Content table
      `CREATE TABLE IF NOT EXISTS contents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        topic_id TEXT,
        account_id TEXT,
        status TEXT DEFAULT 'draft',
        prompt TEXT,
        word_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE SET NULL,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      )`,

      // Reviews table
      `CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        content_id TEXT,
        quality_score REAL DEFAULT 0,
        originality_score REAL DEFAULT 0,
        suggestions TEXT, -- JSON array
        status TEXT DEFAULT 'pending',
        reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES contents (id) ON DELETE CASCADE
      )`,

      // Configurations table
      `CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT DEFAULT 'string',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Prompt templates table
      `CREATE TABLE IF NOT EXISTS prompt_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        template TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Migration tracking table
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    // Create indexes for performance
    await this.createIndexes();

    // Insert default data
    await this.insertDefaultTemplates();
    await this.insertDefaultConfigurations();
  }

  async createIndexes(): Promise<void> {
    const indexes = [
      // Account indexes
      'CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform)',
      'CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)',
      'CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at)',
      
      // Material indexes
      'CREATE INDEX IF NOT EXISTS idx_materials_account_id ON materials(account_id)',
      'CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type)',
      'CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at)',
      
      // Topic indexes
      'CREATE INDEX IF NOT EXISTS idx_topics_material_id ON topics(material_id)',
      'CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status)',
      'CREATE INDEX IF NOT EXISTS idx_topics_score ON topics(score)',
      'CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at)',
      
      // Content indexes
      'CREATE INDEX IF NOT EXISTS idx_contents_topic_id ON contents(topic_id)',
      'CREATE INDEX IF NOT EXISTS idx_contents_account_id ON contents(account_id)',
      'CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status)',
      'CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_contents_updated_at ON contents(updated_at)',
      
      // Review indexes
      'CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON reviews(content_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_quality_score ON reviews(quality_score)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_at ON reviews(reviewed_at)',
      
      // Configuration indexes
      'CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key)',
      
      // Prompt template indexes
      'CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(type)',
      'CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_default ON prompt_templates(is_default)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  async insertDefaultTemplates(): Promise<void> {
    const templates = [
      {
        id: 'topic-default',
        name: '默认选题生成',
        type: 'topic',
        template: '基于以下素材，为我生成5个适合公众号文章的选题建议。每个选题应该包含标题和简要描述。\n\n素材：{material}',
        is_default: 1
      },
      {
        id: 'content-default',
        name: '默认内容生成',
        type: 'content',
        template: '请根据以下选题写一篇完整的公众号文章。文章要求结构清晰，内容丰富，语言流畅。\n\n选题：{topic}\n\n要求：\n1. 字数约{wordCount}字\n2. 风格：{style}\n3. 包含吸引人的标题和完整的正文',
        is_default: 1
      },
      {
        id: 'review-default',
        name: '默认内容审查',
        type: 'review',
        template: '请对以下文章进行质量审查，重点关注：\n1. 语法和拼写错误\n2. 逻辑结构是否清晰\n3. 内容是否原创\n4. 是否符合公众号文章标准\n\n文章内容：{content}',
        is_default: 1
      }
    ];

    for (const template of templates) {
      const exists = await this.get(
        'SELECT id FROM prompt_templates WHERE id = ?',
        [template.id]
      );

      if (!exists) {
        await this.run(
          `INSERT INTO prompt_templates (id, name, type, template, is_default) 
           VALUES (?, ?, ?, ?, ?)`,
          [template.id, template.name, template.type, template.template, template.is_default]
        );
      }
    }
  }

  async insertDefaultConfigurations(): Promise<void> {
    const configurations = [
      {
        id: 'config-ai-model',
        key: 'ai_model',
        value: 'gemini-pro',
        type: 'string',
        description: '默认AI模型'
      },
      {
        id: 'config-max-tokens',
        key: 'max_tokens',
        value: '2048',
        type: 'integer',
        description: 'AI生成最大token数'
      },
      {
        id: 'config-temperature',
        key: 'temperature',
        value: '0.7',
        type: 'float',
        description: 'AI生成温度参数'
      },
      {
        id: 'config-default-word-count',
        key: 'default_word_count',
        value: '1500',
        type: 'integer',
        description: '默认文章字数'
      },
      {
        id: 'config-auto-save',
        key: 'auto_save',
        value: 'true',
        type: 'boolean',
        description: '自动保存功能'
      },
      {
        id: 'config-auto-review',
        key: 'auto_review',
        value: 'false',
        type: 'boolean',
        description: '自动审查功能'
      }
    ];

    for (const config of configurations) {
      const exists = await this.get(
        'SELECT id FROM configurations WHERE key = ?',
        [config.key]
      );

      if (!exists) {
        await this.run(
          `INSERT INTO configurations (id, key, value, type, description) 
           VALUES (?, ?, ?, ?, ?)`,
          [config.id, config.key, config.value, config.type, config.description]
        );
      }
    }
  }

  run(query: string, params: any[] = []): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(query: string, params: any[] = []): Promise<DatabaseRow | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  all(query: string, params: any[] = []): Promise<DatabaseRow[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  // Transaction support
  async beginTransaction(): Promise<void> {
    await this.run('BEGIN TRANSACTION');
  }

  async commitTransaction(): Promise<void> {
    await this.run('COMMIT');
  }

  async rollbackTransaction(): Promise<void> {
    await this.run('ROLLBACK');
  }

  // Execute multiple queries in a transaction
  async executeTransaction(queries: Array<{ query: string; params: any[] }>): Promise<void> {
    try {
      await this.beginTransaction();
      
      for (const { query, params } of queries) {
        await this.run(query, params);
      }
      
      await this.commitTransaction();
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  // Check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result !== null;
  }

  // Get table schema
  async getTableSchema(tableName: string): Promise<any[]> {
    return this.all(`PRAGMA table_info(${tableName})`);
  }

  // Drop table if exists
  async dropTable(tableName: string): Promise<void> {
    await this.run(`DROP TABLE IF EXISTS ${tableName}`);
  }

  // Truncate table (delete all rows)
  async truncateTable(tableName: string): Promise<void> {
    await this.run(`DELETE FROM ${tableName}`);
  }

  // Get table row count
  async getRowCount(tableName: string): Promise<number> {
    const result = await this.get(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result ? result.count : 0;
  }

  // Backup database
  async backup(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.backup(backupPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Database backed up to ${backupPath}`);
          resolve();
        }
      });
    });
  }

  // Vacuum database to optimize size
  async vacuum(): Promise<void> {
    await this.run('VACUUM');
    console.log('Database vacuumed');
  }

  // Get database status
  async getStatus(): Promise<any> {
    const tables = await this.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    const tableStats = {};
    for (const table of tables) {
      const count = await this.getRowCount(table.name);
      tableStats[table.name] = count;
    }
    
    return {
      connected: this.db !== null,
      tables: tables.map(t => t.name),
      tableStats,
      path: this.db ? this.db.filename : null
    };
  }
}