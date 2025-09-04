import Database from '../init';
import { SeedManager } from './SeedManager';

export class SeedCLI {
  private db: Database;
  private seedManager: SeedManager;

  constructor() {
    this.db = new Database();
    this.seedManager = new SeedManager(this.db);
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      await this.db.connect();

      switch (command) {
        case 'run':
          await this.runSeed(args[1], args);
          break;
        case 'list':
          await this.listSeeds();
          break;
        case 'create':
          await this.createSeed(args[1]);
          break;
        case 'clear':
          await this.clearData();
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

  private async runSeed(seedName?: string, args: string[] = []) {
    const clearExisting = args.includes('--clear');
    const verbose = args.includes('--verbose');

    if (!seedName) {
      console.log('❌ Please specify a seed file name');
      return;
    }

    try {
      const seedFile = await this.findSeedFile(seedName);
      console.log(`🌱 Loading seed from: ${seedFile}`);
      
      const seedData = await this.seedManager.loadSeedFile(seedFile);
      const result = await this.seedManager.runSeed(seedData, {
        clearExisting,
        verbose
      });

      if (result.success) {
        console.log('✅ Seed completed successfully!');
        if (result.stats) {
          console.log('📊 Statistics:');
          console.log(`   Accounts: ${result.stats.accounts}`);
          console.log(`   Materials: ${result.stats.materials}`);
          console.log(`   Topics: ${result.stats.topics}`);
          console.log(`   Contents: ${result.stats.contents}`);
          console.log(`   Reviews: ${result.stats.reviews}`);
          console.log(`   Configurations: ${result.stats.configurations}`);
          console.log(`   Prompt Templates: ${result.stats.promptTemplates}`);
        }
      } else {
        console.log('❌ Seed failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error running seed:', error);
    }
  }

  private async listSeeds() {
    try {
      const seeds = await this.seedManager.listSeedFiles();
      
      console.log('\n🌱 Available Seed Files');
      console.log('======================');
      
      if (seeds.length === 0) {
        console.log('📭 No seed files found');
      } else {
        for (const seed of seeds) {
          console.log(`📄 ${seed}`);
        }
      }
    } catch (error) {
      console.error('❌ Error listing seeds:', error);
    }
  }

  private async createSeed(name?: string) {
    if (!name) {
      console.log('❌ Please provide a seed name');
      return;
    }

    try {
      const sampleData = {
        configurations: [
          {
            key: "example_config",
            value: "example_value",
            type: "string",
            description: "Example configuration"
          }
        ],
        accounts: [
          {
            name: "Example Account",
            description: "Example account description",
            platform: "wechat"
          }
        ],
        materials: [
          {
            title: "Example Material",
            content: "Example material content",
            tags: ["example"],
            type: "text"
          }
        ]
      };

      const filePath = await this.seedManager.createSeedFile(
        name,
        `Seed file generated for ${name}`,
        sampleData
      );

      console.log(`✅ Seed file created: ${filePath}`);
      console.log('💡 You can now edit this file to add your seed data');
    } catch (error) {
      console.error('❌ Error creating seed file:', error);
    }
  }

  private async clearData() {
    try {
      console.log('⚠️  This will delete all data from the database');
      console.log('Are you sure? Type "DELETE" to confirm:');
      
      // This is a simple confirmation - in production, you might want a more robust method
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      const confirmation = await new Promise<string>((resolve) => {
        stdin.on('data', (key) => {
          if (key === '\u0003') {
            // Ctrl+C
            process.exit(1);
          }
          if (key === '\r') {
            stdin.setRawMode(false);
            stdin.pause();
            resolve('');
          }
          process.stdout.write(key);
        });
      });

      if (confirmation === 'DELETE') {
        console.log('\n🗑️  Clearing all data...');
        await this.seedManager.runSeed({
          name: 'Clear Data',
          description: 'Clear all existing data',
          version: 'clear',
          data: {}
        }, { clearExisting: true, verbose: true });
        console.log('✅ All data cleared');
      } else {
        console.log('\n❌ Operation cancelled');
      }
    } catch (error) {
      console.error('❌ Error clearing data:', error);
    }
  }

  private async findSeedFile(seedName: string): Promise<string> {
    const path = require('path');
    const fs = require('fs');
    
    // Try to find the seed file
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'database', 'seeds', `${seedName}.json`),
      path.join(process.cwd(), 'src', 'database', 'seeds', seedName),
      seedName
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    throw new Error(`Seed file not found: ${seedName}`);
  }

  private showHelp() {
    console.log('\n🌱 Seed CLI Help');
    console.log('================');
    console.log('Usage: npm run seed <command> [options]');
    console.log('\nCommands:');
    console.log('  run <name>          Run a specific seed file');
    console.log('  list               List available seed files');
    console.log('  create <name>      Create a new seed file');
    console.log('  clear              Clear all data from database');
    console.log('\nOptions:');
    console.log('  --clear            Clear existing data before seeding');
    console.log('  --verbose          Show detailed output');
    console.log('\nExamples:');
    console.log('  npm run seed run development-data');
    console.log('  npm run seed run development-data --clear --verbose');
    console.log('  npm run seed list');
    console.log('  npm run seed create my-seed-data');
    console.log('  npm run seed clear');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new SeedCLI();
  cli.run();
}