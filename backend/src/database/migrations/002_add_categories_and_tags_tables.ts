import { Migration } from '../migrations/MigrationManager';

export const addCategoriesAndTagsTables: Migration = {
  version: '002',
  name: 'add_categories_and_tags_tables',
  description: 'Add categories and tags tables for material management',
  up: async (db) => {
    // Create categories table
    await db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#3B82F6',
        created_at TEXT NOT NULL
      )
    `);

    // Create tags table
    await db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#10B981',
        usage_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);

    // Update materials table to support new features
    await db.run(`
      ALTER TABLE materials ADD COLUMN category_id TEXT REFERENCES categories(id)
    `);

    await db.run(`
      ALTER TABLE materials ADD COLUMN file_size INTEGER
    `);

    await db.run(`
      ALTER TABLE materials ADD COLUMN word_count INTEGER DEFAULT 0
    `);

    await db.run(`
      ALTER TABLE materials ADD COLUMN updated_at TEXT
    `);

    // Create indexes for better performance
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)
    `);

    // Update existing materials to have word_count
    await db.run(`
      UPDATE materials SET word_count = LENGTH(TRIM(content)) - LENGTH(REPLACE(TRIM(content), ' ', '')) + 1
      WHERE word_count IS NULL OR word_count = 0
    `);

    // Update existing materials to have updated_at
    await db.run(`
      UPDATE materials SET updated_at = created_at WHERE updated_at IS NULL
    `);

    console.log('✅ Migration 002 completed: Categories and tags tables added');
  },
  down: async (db) => {
    // Drop indexes
    await db.run(`DROP INDEX IF EXISTS idx_materials_category_id`);
    await db.run(`DROP INDEX IF EXISTS idx_tags_usage_count`);
    await db.run(`DROP INDEX IF EXISTS idx_categories_name`);

    // Drop columns from materials table
    await db.run(`ALTER TABLE materials DROP COLUMN category_id`);
    await db.run(`ALTER TABLE materials DROP COLUMN file_size`);
    await db.run(`ALTER TABLE materials DROP COLUMN word_count`);
    await db.run(`ALTER TABLE materials DROP COLUMN updated_at`);

    // Drop tables
    await db.run(`DROP TABLE IF EXISTS categories`);
    await db.run(`DROP TABLE IF EXISTS tags`);

    console.log('✅ Migration 002 rolled back: Categories and tags tables removed');
  }
};

export default addCategoriesAndTagsTables;