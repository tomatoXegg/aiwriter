const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
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

  async initTables() {
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        account_id TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
      )`,

      // Topics table
      `CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        material_id TEXT,
        prompt TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials (id)
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics (id),
        FOREIGN KEY (account_id) REFERENCES accounts (id)
      )`,

      // Reviews table
      `CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        content_id TEXT,
        quality INTEGER,
        originality INTEGER,
        suggestions TEXT, -- JSON array
        status TEXT DEFAULT 'pending',
        reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES contents (id)
      )`,

      // Prompt templates table
      `CREATE TABLE IF NOT EXISTS prompt_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        template TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    // Insert default prompt templates
    await this.insertDefaultTemplates();
  }

  async insertDefaultTemplates() {
    const templates = [
      {
        id: 'topic-default',
        name: '默认选题生成',
        type: 'topic',
        template: '基于以下素材，为我生成5个适合公众号文章的选题建议。每个选题应该包含标题和简要描述。\n\n素材：{material}',
        is_default: true
      },
      {
        id: 'content-default',
        name: '默认内容生成',
        type: 'content',
        template: '请根据以下选题写一篇完整的公众号文章。文章要求结构清晰，内容丰富，语言流畅。\n\n选题：{topic}\n\n要求：\n1. 字数约{wordCount}字\n2. 风格：{style}\n3. 包含吸引人的标题和完整的正文',
        is_default: true
      },
      {
        id: 'review-default',
        name: '默认内容审查',
        type: 'review',
        template: '请对以下文章进行质量审查，重点关注：\n1. 语法和拼写错误\n2. 逻辑结构是否清晰\n3. 内容是否原创\n4. 是否符合公众号文章标准\n\n文章内容：{content}',
        is_default: true
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

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
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
}

module.exports = Database;