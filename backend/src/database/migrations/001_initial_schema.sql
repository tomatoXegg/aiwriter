-- Migration: Initial database schema
-- Version: 2025-09-04T10-30-00
-- Created: 2025-09-04T10:30:00.000Z

-- UP migration
-- Create accounts table
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

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT, -- JSON array
  type TEXT DEFAULT 'text',
  file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  account_id TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE SET NULL
);

-- Create topics table
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

-- Create contents table
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

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  content_id TEXT,
  quality_score REAL DEFAULT 0,
  originality_score REAL DEFAULT 0,
  suggestions TEXT, -- JSON array
  status TEXT DEFAULT 'pending',
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents (id) ON DELETE CASCADE
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'string',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create prompt_templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT UNIQUE NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);

CREATE INDEX IF NOT EXISTS idx_materials_account_id ON materials(account_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);

CREATE INDEX IF NOT EXISTS idx_topics_material_id ON topics(material_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_score ON topics(score);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at);

CREATE INDEX IF NOT EXISTS idx_contents_topic_id ON contents(topic_id);
CREATE INDEX IF NOT EXISTS idx_contents_account_id ON contents(account_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);
CREATE INDEX IF NOT EXISTS idx_contents_updated_at ON contents(updated_at);

CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_quality_score ON reviews(quality_score);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_at ON reviews(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_default ON prompt_templates(is_default);

-- DOWN migration
-- Drop all tables in reverse order
DROP INDEX IF EXISTS idx_prompt_templates_is_default;
DROP INDEX IF EXISTS idx_prompt_templates_type;
DROP INDEX IF EXISTS idx_configurations_key;
DROP INDEX IF EXISTS idx_reviews_reviewed_at;
DROP INDEX IF EXISTS idx_reviews_quality_score;
DROP INDEX IF EXISTS idx_reviews_status;
DROP INDEX IF EXISTS idx_reviews_content_id;
DROP INDEX IF EXISTS idx_contents_updated_at;
DROP INDEX IF EXISTS idx_contents_created_at;
DROP INDEX IF EXISTS idx_contents_status;
DROP INDEX IF EXISTS idx_contents_account_id;
DROP INDEX IF EXISTS idx_contents_topic_id;
DROP INDEX IF EXISTS idx_topics_created_at;
DROP INDEX IF EXISTS idx_topics_score;
DROP INDEX IF EXISTS idx_topics_status;
DROP INDEX IF EXISTS idx_topics_material_id;
DROP INDEX IF EXISTS idx_materials_created_at;
DROP INDEX IF EXISTS idx_materials_type;
DROP INDEX IF EXISTS idx_materials_account_id;
DROP INDEX IF EXISTS idx_accounts_created_at;
DROP INDEX IF EXISTS idx_accounts_status;
DROP INDEX IF EXISTS idx_accounts_platform;

DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS prompt_templates;
DROP TABLE IF EXISTS configurations;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS contents;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS accounts;