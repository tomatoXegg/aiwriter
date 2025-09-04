import Database from '../init';
import { MigrationManager } from './MigrationManager';

export class MigrationCLI {
  private db: Database;
  private migrationManager: MigrationManager;

  constructor() {
    this.db = new Database();
    this.migrationManager = new MigrationManager(this.db);
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      await this.db.connect();
      await this.migrationManager.loadMigrations();

      switch (command) {
        case 'status':
          await this.showStatus();
          break;
        case 'up':
          await this.runUp(args[1]);
          break;
        case 'down':
          await this.runDown(args[1]);
          break;
        case 'create':
          await this.createMigration(args[1]);
          break;
        case 'pending':
          await this.showPending();
          break;
        case 'applied':
          await this.showApplied();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    } finally {
      await this.db.close();
    }
  }

  private async showStatus() {
    const status = await this.migrationManager.getStatus();
    
    console.log('\n📊 Migration Status');
    console.log('==================');
    console.log(`Registered: ${status.registered}`);
    console.log(`Applied: ${status.applied}`);
    console.log(`Pending: ${status.pending}`);
    console.log('\n📋 Migrations:');
    console.log('---------------');
    
    for (const migration of status.migrations) {
      const statusIcon = migration.status === 'applied' ? '✅' : '⏳';
      const appliedDate = migration.applied_at ? ` (${new Date(migration.applied_at).toLocaleDateString()})` : '';
      console.log(`${statusIcon} ${migration.version} - ${migration.description}${appliedDate}`);
    }
  }

  private async runUp(version?: string) {
    if (version) {
      console.log(`🔄 Running migration ${version}...`);
      const success = await this.migrationManager.runMigration(version);
      if (success) {
        console.log('✅ Migration completed successfully');
      } else {
        console.log('❌ Migration failed');
      }
    } else {
      console.log('🔄 Running all pending migrations...');
      const result = await this.migrationManager.runPending();
      
      if (result.success > 0) {
        console.log(`✅ ${result.success} migrations completed successfully`);
      }
      
      if (result.failed > 0) {
        console.log(`❌ ${result.failed} migrations failed`);
        result.errors.forEach(error => console.log(`   ${error}`));
      }
      
      if (result.success === 0 && result.failed === 0) {
        console.log('✅ No pending migrations');
      }
    }
  }

  private async runDown(version?: string) {
    if (!version) {
      console.log('❌ Please specify a migration version to revert');
      return;
    }

    console.log(`🔄 Reverting migration ${version}...`);
    const success = await this.migrationManager.revertMigration(version);
    
    if (success) {
      console.log('✅ Migration reverted successfully');
    } else {
      console.log('❌ Migration revert failed');
    }
  }

  private async createMigration(name?: string) {
    if (!name) {
      console.log('❌ Please provide a migration name');
      return;
    }

    const result = await this.migrationManager.createMigration(name);
    console.log(`✅ Migration file created: ${result.filename}`);
    console.log(`📍 Location: ${result.path}`);
  }

  private async showPending() {
    const pending = await this.migrationManager.getPendingMigrations();
    
    console.log('\n⏳ Pending Migrations');
    console.log('====================');
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations');
    } else {
      for (const migration of pending) {
        console.log(`📋 ${migration.version} - ${migration.description}`);
      }
    }
  }

  private async showApplied() {
    const applied = await this.migrationManager.getAppliedMigrations();
    
    console.log('\n✅ Applied Migrations');
    console.log('====================');
    
    if (applied.length === 0) {
      console.log('📋 No migrations applied yet');
    } else {
      for (const migration of applied) {
        const appliedDate = new Date(migration.applied_at!).toLocaleDateString();
        console.log(`📋 ${migration.version} - ${migration.description} (${appliedDate})`);
      }
    }
  }

  private showHelp() {
    console.log('\n📚 Migration CLI Help');
    console.log('=====================');
    console.log('Usage: npm run migrate <command> [options]');
    console.log('\nCommands:');
    console.log('  status              Show migration status');
    console.log('  up [version]         Run pending migrations or specific version');
    console.log('  down <version>       Revert a specific migration');
    console.log('  create <name>        Create a new migration file');
    console.log('  pending             Show pending migrations');
    console.log('  applied             Show applied migrations');
    console.log('\nExamples:');
    console.log('  npm run migrate status');
    console.log('  npm run migrate up');
    console.log('  npm run migrate up 2025-09-04T10-30-00_add_users_table');
    console.log('  npm run migrate down 2025-09-04T10-30-00_add_users_table');
    console.log('  npm run migrate create add_users_table');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new MigrationCLI();
  cli.run();
}