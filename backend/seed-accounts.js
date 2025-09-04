#!/usr/bin/env node

/**
 * 账号管理测试数据种子
 * 用于演示和测试账号管理API功能
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AccountSeeder {
  constructor() {
    this.dbPath = path.join(__dirname, 'test.db');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Connected to test database');
          resolve();
        }
      });
    });
  }

  async createTables() {
    const createAccountsTable = `
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        platform TEXT NOT NULL DEFAULT 'wechat',
        status TEXT NOT NULL DEFAULT 'active',
        content_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createAccountsTable, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Accounts table created');
          resolve();
        }
      });
    });
  }

  async clearData() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM accounts', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Cleared existing data');
          resolve();
        }
      });
    });
  }

  async seedAccounts() {
    const accounts = [
      {
        id: uuidv4(),
        name: '技术前沿',
        description: '分享最新技术趋势和开发经验',
        platform: 'wechat',
        status: 'active',
        content_count: 25,
        created_at: new Date('2023-01-01').toISOString()
      },
      {
        id: uuidv4(),
        name: '产品设计思维',
        description: '用户体验设计和产品思考',
        platform: 'wechat',
        status: 'active',
        content_count: 18,
        created_at: new Date('2023-01-15').toISOString()
      },
      {
        id: uuidv4(),
        name: '创业故事汇',
        description: '分享创业经验和商业洞察',
        platform: 'weibo',
        status: 'active',
        content_count: 32,
        created_at: new Date('2023-02-01').toISOString()
      },
      {
        id: uuidv4(),
        name: '生活美学',
        description: '发现生活中的美好事物',
        platform: 'wechat',
        status: 'inactive',
        content_count: 12,
        created_at: new Date('2023-02-15').toISOString()
      },
      {
        id: uuidv4(),
        name: '职场成长记',
        description: '职场技能和职业发展分享',
        platform: 'zhihu',
        status: 'active',
        content_count: 28,
        created_at: new Date('2023-03-01').toISOString()
      },
      {
        id: uuidv4(),
        name: '健康生活指南',
        description: '健康生活方式和养生知识',
        platform: 'wechat',
        status: 'suspended',
        content_count: 8,
        created_at: new Date('2023-03-15').toISOString()
      },
      {
        id: uuidv4(),
        name: '编程学习笔记',
        description: '编程教程和学习心得',
        platform: 'other',
        status: 'active',
        content_count: 45,
        created_at: new Date('2023-04-01').toISOString()
      },
      {
        id: uuidv4(),
        name: '投资理财',
        description: '理财知识和投资策略',
        platform: 'weibo',
        status: 'inactive',
        content_count: 15,
        created_at: new Date('2023-04-15').toISOString()
      }
    ];

    const insertAccount = `
      INSERT INTO accounts (id, name, description, platform, status, content_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const account of accounts) {
      await new Promise((resolve, reject) => {
        this.db.run(insertAccount, [
          account.id,
          account.name,
          account.description,
          account.platform,
          account.status,
          account.content_count,
          account.created_at
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Seeded account: ${account.name}`);
            resolve();
          }
        });
      });
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async run() {
    try {
      await this.connect();
      await this.createTables();
      await this.clearData();
      await this.seedAccounts();
      console.log('🎉 Database seeding completed successfully!');
      console.log(`📊 Seeded 8 test accounts`);
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      process.exit(1);
    } finally {
      await this.close();
    }
  }
}

// 运行种子脚本
if (require.main === module) {
  const seeder = new AccountSeeder();
  seeder.run();
}

module.exports = AccountSeeder;