import { v4 as uuidv4 } from 'uuid';
import Database from '../init';
import { Models, createModels } from '../models';

export interface SeedData {
  name: string;
  description: string;
  version: string;
  data: {
    accounts?: any[];
    materials?: any[];
    topics?: any[];
    contents?: any[];
    reviews?: any[];
    configurations?: any[];
    promptTemplates?: any[];
  };
}

export interface SeedResult {
  success: boolean;
  message: string;
  stats?: {
    accounts: number;
    materials: number;
    topics: number;
    contents: number;
    reviews: number;
    configurations: number;
    promptTemplates: number;
  };
}

export class SeedManager {
  private db: Database;
  private models: Models;

  constructor(database: Database) {
    this.db = database;
    this.models = createModels(database);
  }

  async runSeed(seedData: SeedData, options: {
    clearExisting?: boolean;
    verbose?: boolean;
  } = {}): Promise<SeedResult> {
    const { clearExisting = false, verbose = false } = options;

    try {
      if (verbose) {
        console.log(`🌱 Running seed: ${seedData.name}`);
        console.log(`📝 Description: ${seedData.description}`);
        console.log(`📋 Version: ${seedData.version}`);
      }

      if (clearExisting) {
        await this.clearAllData(verbose);
      }

      const stats = {
        accounts: 0,
        materials: 0,
        topics: 0,
        contents: 0,
        reviews: 0,
        configurations: 0,
        promptTemplates: 0
      };

      // Use transaction for data consistency
      await this.db.beginTransaction();

      try {
        // Seed configurations first (they might be referenced by other entities)
        if (seedData.data.configurations && seedData.data.configurations.length > 0) {
          stats.configurations = await this.seedConfigurations(seedData.data.configurations, verbose);
        }

        // Seed prompt templates
        if (seedData.data.promptTemplates && seedData.data.promptTemplates.length > 0) {
          stats.promptTemplates = await this.seedPromptTemplates(seedData.data.promptTemplates, verbose);
        }

        // Seed accounts
        if (seedData.data.accounts && seedData.data.accounts.length > 0) {
          stats.accounts = await this.seedAccounts(seedData.data.accounts, verbose);
        }

        // Seed materials
        if (seedData.data.materials && seedData.data.materials.length > 0) {
          stats.materials = await this.seedMaterials(seedData.data.materials, verbose);
        }

        // Seed topics
        if (seedData.data.topics && seedData.data.topics.length > 0) {
          stats.topics = await this.seedTopics(seedData.data.topics, verbose);
        }

        // Seed contents
        if (seedData.data.contents && seedData.data.contents.length > 0) {
          stats.contents = await this.seedContents(seedData.data.contents, verbose);
        }

        // Seed reviews
        if (seedData.data.reviews && seedData.data.reviews.length > 0) {
          stats.reviews = await this.seedReviews(seedData.data.reviews, verbose);
        }

        await this.db.commitTransaction();

        if (verbose) {
          console.log('✅ Seed completed successfully');
          console.log('📊 Statistics:', stats);
        }

        return {
          success: true,
          message: `Seed '${seedData.name}' completed successfully`,
          stats
        };

      } catch (error) {
        await this.db.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (verbose) {
        console.error('❌ Seed failed:', errorMessage);
      }
      return {
        success: false,
        message: `Seed '${seedData.name}' failed: ${errorMessage}`
      };
    }
  }

  private async clearAllData(verbose: boolean): Promise<void> {
    if (verbose) {
      console.log('🗑️  Clearing existing data...');
    }

    // Clear in reverse order to respect foreign key constraints
    await this.db.run('DELETE FROM reviews');
    await this.db.run('DELETE FROM contents');
    await this.db.run('DELETE FROM topics');
    await this.db.run('DELETE FROM materials');
    await this.db.run('DELETE FROM accounts');
    await this.db.run('DELETE FROM configurations');
    await this.db.run('DELETE FROM prompt_templates');

    if (verbose) {
      console.log('✅ All existing data cleared');
    }
  }

  private async seedAccounts(accounts: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${accounts.length} accounts...`);
    }

    let count = 0;
    for (const accountData of accounts) {
      try {
        await this.models.account.create({
          name: accountData.name,
          description: accountData.description,
          platform: accountData.platform || 'wechat'
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed account ${accountData.name}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} accounts seeded`);
    }
    return count;
  }

  private async seedMaterials(materials: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${materials.length} materials...`);
    }

    let count = 0;
    for (const materialData of materials) {
      try {
        await this.models.material.create({
          title: materialData.title,
          content: materialData.content,
          tags: materialData.tags || [],
          type: materialData.type || 'text',
          account_id: materialData.account_id
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed material ${materialData.title}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} materials seeded`);
    }
    return count;
  }

  private async seedTopics(topics: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${topics.length} topics...`);
    }

    let count = 0;
    for (const topicData of topics) {
      try {
        await this.models.topic.create({
          title: topicData.title,
          description: topicData.description,
          material_id: topicData.material_id,
          prompt: topicData.prompt
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed topic ${topicData.title}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} topics seeded`);
    }
    return count;
  }

  private async seedContents(contents: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${contents.length} contents...`);
    }

    let count = 0;
    for (const contentData of contents) {
      try {
        await this.models.content.create({
          title: contentData.title,
          body: contentData.body,
          topic_id: contentData.topic_id,
          account_id: contentData.account_id,
          prompt: contentData.prompt
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed content ${contentData.title}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} contents seeded`);
    }
    return count;
  }

  private async seedReviews(reviews: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${reviews.length} reviews...`);
    }

    let count = 0;
    for (const reviewData of reviews) {
      try {
        await this.models.review.create({
          content_id: reviewData.content_id,
          quality_score: reviewData.quality_score,
          originality_score: reviewData.originality_score,
          suggestions: reviewData.suggestions || []
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed review for content ${reviewData.content_id}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} reviews seeded`);
    }
    return count;
  }

  private async seedConfigurations(configurations: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${configurations.length} configurations...`);
    }

    let count = 0;
    for (const configData of configurations) {
      try {
        await this.models.configuration.create({
          key: configData.key,
          value: configData.value,
          type: configData.type || 'string',
          description: configData.description
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed configuration ${configData.key}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} configurations seeded`);
    }
    return count;
  }

  private async seedPromptTemplates(templates: any[], verbose: boolean): Promise<number> {
    if (verbose) {
      console.log(`📝 Seeding ${templates.length} prompt templates...`);
    }

    let count = 0;
    for (const templateData of templates) {
      try {
        await this.models.promptTemplate.create({
          name: templateData.name,
          type: templateData.type,
          template: templateData.template,
          is_default: templateData.is_default || false
        });
        count++;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed prompt template ${templateData.name}:`, error);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${count} prompt templates seeded`);
    }
    return count;
  }

  async loadSeedFile(filePath: string): Promise<SeedData> {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const seedData: SeedData = JSON.parse(content);
      
      // Validate seed data structure
      if (!seedData.name || !seedData.data) {
        throw new Error('Invalid seed file format');
      }
      
      return seedData;
    } catch (error) {
      throw new Error(`Failed to load seed file: ${error}`);
    }
  }

  async createSeedFile(name: string, description: string, data: any): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    
    const seedData: SeedData = {
      name,
      description,
      version: new Date().toISOString().split('T')[0],
      data
    };
    
    const filename = `${name.replace(/\s+/g, '_')}.json`;
    const filePath = path.join(process.cwd(), 'src', 'database', 'seeds', filename);
    
    fs.writeFileSync(filePath, JSON.stringify(seedData, null, 2));
    
    return filePath;
  }

  async listSeedFiles(): Promise<string[]> {
    const fs = require('fs');
    const path = require('path');
    const seedsDir = path.join(process.cwd(), 'src', 'database', 'seeds');
    
    try {
      const files = fs.readdirSync(seedsDir);
      return files.filter(f => f.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }
}