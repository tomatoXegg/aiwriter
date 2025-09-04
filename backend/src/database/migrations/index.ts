export * from './MigrationManager';
export * from './cli';

// Default migrations that come with the system
export const defaultMigrations = [
  {
    version: '2025-09-04T10-30-00',
    description: 'Initial database schema',
    up: `
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        platform TEXT DEFAULT 'wechat',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        content_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        type TEXT DEFAULT 'text',
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        account_id TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        material_id TEXT,
        prompt TEXT,
        status TEXT DEFAULT 'pending',
        score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS contents (
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
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        content_id TEXT,
        quality_score REAL DEFAULT 0,
        originality_score REAL DEFAULT 0,
        suggestions TEXT,
        status TEXT DEFAULT 'pending',
        reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES contents (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT DEFAULT 'string',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS prompt_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        template TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      );
    `,
    down: `
      DROP TABLE IF EXISTS schema_migrations;
      DROP TABLE IF EXISTS prompt_templates;
      DROP TABLE IF EXISTS configurations;
      DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS contents;
      DROP TABLE IF EXISTS topics;
      DROP TABLE IF EXISTS materials;
      DROP TABLE IF EXISTS accounts;
    `
  }
];