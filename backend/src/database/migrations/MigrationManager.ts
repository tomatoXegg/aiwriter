import { v4 as uuidv4 } from 'uuid';
import Database from '../init';

export interface Migration {
  version: string;
  description: string;
  up: string;
  down: string;
}

export interface MigrationInfo {
  version: string;
  description: string;
  applied_at?: string;
  status: 'pending' | 'applied' | 'failed';
}

export class MigrationManager {
  private db: Database;
  private migrations: Map<string, Migration> = new Map();

  constructor(database: Database) {
    this.db = database;
  }

  // Register a migration
  register(migration: Migration): void {
    this.migrations.set(migration.version, migration);
  }

  // Register multiple migrations
  registerMigrations(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.register(migration);
    }
  }

  // Get all registered migrations
  getRegisteredMigrations(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) => 
      a.version.localeCompare(b.version)
    );
  }

  // Get applied migrations
  async getAppliedMigrations(): Promise<MigrationInfo[]> {
    try {
      const rows = await this.db.all(
        'SELECT version, description, applied_at FROM schema_migrations ORDER BY version'
      );
      return rows.map(row => ({
        version: row.version,
        description: row.description,
        applied_at: row.applied_at,
        status: 'applied' as const
      }));
    } catch (error) {
      // If schema_migrations table doesn't exist, return empty array
      return [];
    }
  }

  // Get pending migrations
  async getPendingMigrations(): Promise<MigrationInfo[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    return this.getRegisteredMigrations()
      .filter(m => !appliedVersions.has(m.version))
      .map(m => ({
        version: m.version,
        description: m.description,
        status: 'pending' as const
      }));
  }

  // Get migration status
  async getStatus(): Promise<{
    registered: number;
    applied: number;
    pending: number;
    migrations: MigrationInfo[];
  }> {
    const registered = this.getRegisteredMigrations();
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();

    const allMigrations = registered.map(m => {
      const appliedMigration = applied.find(a => a.version === m.version);
      const pendingMigration = pending.find(p => p.version === m.version);
      
      return {
        version: m.version,
        description: m.description,
        applied_at: appliedMigration?.applied_at,
        status: appliedMigration ? 'applied' : 'pending'
      } as MigrationInfo;
    });

    return {
      registered: registered.length,
      applied: applied.length,
      pending: pending.length,
      migrations: allMigrations
    };
  }

  // Run a specific migration
  async runMigration(version: string): Promise<boolean> {
    const migration = this.migrations.get(version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    const applied = await this.getAppliedMigrations();
    if (applied.some(m => m.version === version)) {
      console.log(`Migration ${version} already applied`);
      return true;
    }

    try {
      console.log(`Running migration ${version}: ${migration.description}`);
      
      // Execute the up migration
      const statements = migration.up.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.run(statement);
        }
      }

      // Record the migration
      await this.db.run(
        'INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)',
        [version, migration.description, new Date().toISOString()]
      );

      console.log(`Migration ${version} completed successfully`);
      return true;
    } catch (error) {
      console.error(`Migration ${version} failed:`, error);
      return false;
    }
  }

  // Run all pending migrations
  async runPending(): Promise<{ success: number; failed: number; errors: string[] }> {
    const pending = await this.getPendingMigrations();
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const migrationInfo of pending) {
      const migration = this.migrations.get(migrationInfo.version);
      if (!migration) continue;

      try {
        const result = await this.runMigration(migration.version);
        if (result) {
          success++;
        } else {
          failed++;
          errors.push(`Migration ${migration.version} failed`);
        }
      } catch (error) {
        failed++;
        errors.push(`Migration ${migration.version} failed: ${error}`);
      }
    }

    return { success, failed, errors };
  }

  // Revert a specific migration
  async revertMigration(version: string): Promise<boolean> {
    const migration = this.migrations.get(version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    const applied = await this.getAppliedMigrations();
    if (!applied.some(m => m.version === version)) {
      console.log(`Migration ${version} not applied`);
      return true;
    }

    try {
      console.log(`Reverting migration ${version}: ${migration.description}`);
      
      // Execute the down migration
      const statements = migration.down.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.run(statement);
        }
      }

      // Remove the migration record
      await this.db.run('DELETE FROM schema_migrations WHERE version = ?', [version]);

      console.log(`Migration ${version} reverted successfully`);
      return true;
    } catch (error) {
      console.error(`Migration ${version} revert failed:`, error);
      return false;
    }
  }

  // Create a new migration file
  async createMigration(name: string): Promise<{ filename: string; path: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const version = `${timestamp}_${name}`;
    const filename = `${version}.sql`;
    const path = `/Users/zhaoxiaofeng/Documents/aiwriter/backend/src/database/migrations/${filename}`;

    const template = `-- Migration: ${name}
-- Version: ${version}
-- Created: ${new Date().toISOString()}

-- UP migration
-- Add your SQL statements here

-- DOWN migration
-- Add your rollback SQL statements here
`;

    const fs = require('fs');
    const pathModule = require('path');
    const fullPath = pathModule.join(process.cwd(), 'src', 'database', 'migrations', filename);
    
    fs.writeFileSync(fullPath, template);
    
    return { filename, path: fullPath };
  }

  // Load migrations from files
  async loadMigrations(): Promise<void> {
    const fs = require('fs');
    const pathModule = require('path');
    const migrationsDir = pathModule.join(process.cwd(), 'src', 'database', 'migrations');
    
    try {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
      
      for (const file of sqlFiles) {
        const content = fs.readFileSync(pathModule.join(migrationsDir, file), 'utf8');
        const migration = this.parseMigrationFile(content, file);
        if (migration) {
          this.register(migration);
        }
      }
    } catch (error) {
      console.warn('Could not load migration files:', error);
    }
  }

  private parseMigrationFile(content: string, filename: string): Migration | null {
    const lines = content.split('\n');
    let version = filename.replace('.sql', '');
    let description = '';
    let upStatements: string[] = [];
    let downStatements: string[] = [];
    let currentSection: 'up' | 'down' | 'none' = 'none';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('-- Version:')) {
        version = trimmed.split(':')[1].trim();
      } else if (trimmed.startsWith('-- Migration:')) {
        description = trimmed.split(':')[1].trim();
      } else if (trimmed === '-- UP migration') {
        currentSection = 'up';
      } else if (trimmed === '-- DOWN migration') {
        currentSection = 'down';
      } else if (trimmed.startsWith('--') || trimmed === '') {
        // Skip comments and empty lines
        continue;
      } else {
        if (currentSection === 'up') {
          upStatements.push(trimmed);
        } else if (currentSection === 'down') {
          downStatements.push(trimmed);
        }
      }
    }

    if (upStatements.length === 0) {
      return null;
    }

    return {
      version,
      description,
      up: upStatements.join('; '),
      down: downStatements.join('; ')
    };
  }
}