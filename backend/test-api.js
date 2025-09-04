#!/usr/bin/env node

/**
 * 账号管理API测试脚本
 * 演示如何使用各种API端点
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3000/api/accounts';

// 彩色日志输出
const log = {
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  header: (msg) => console.log(chalk.cyan('\n🔍 ' + msg)),
  divider: () => console.log(chalk.gray('─'.repeat(50)))
};

// 测试结果统计
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// 测试函数
async function testAPI(name, testFunction) {
  testResults.total++;
  log.info(`Running test: ${name}`);
  
  try {
    await testFunction();
    testResults.passed++;
    log.success(`✓ ${name}`);
  } catch (error) {
    testResults.failed++;
    log.error(`✗ ${name}: ${error.message}`);
    if (error.response) {
      log.error(`  Status: ${error.response.status}`);
      log.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  log.divider();
}

// 创建测试账号
async function createTestAccount() {
  const accountData = {
    name: '测试账号_' + Date.now(),
    description: '这是一个测试账号',
    platform: 'wechat'
  };

  const response = await axios.post(BASE_URL, accountData);
  log.success(`Created account: ${response.data.data.name} (ID: ${response.data.data.id})`);
  return response.data.data;
}

// API测试套件
async function runAPITests() {
  log.header('🚀 开始账号管理API测试');
  
  // 1. 创建账号
  await testAPI('创建账号', async () => {
    const account = await createTestAccount();
    if (!account.id) throw new Error('Account ID not returned');
    if (account.status !== 'active') throw new Error('Account status should be active');
  });

  // 2. 获取账号列表
  await testAPI('获取账号列表', async () => {
    const response = await axios.get(BASE_URL);
    if (!response.data.success) throw new Error('API call failed');
    if (!Array.isArray(response.data.data.accounts)) throw new Error('Accounts should be an array');
    log.info(`Found ${response.data.data.accounts.length} accounts`);
  });

  // 3. 分页测试
  await testAPI('分页测试', async () => {
    const response = await axios.get(`${BASE_URL}?page=1&limit=5`);
    if (!response.data.data.pagination) throw new Error('Pagination data missing');
    if (response.data.data.pagination.limit !== 5) throw new Error('Pagination limit incorrect');
    log.info(`Page ${response.data.data.pagination.page} of ${response.data.data.pagination.totalPages}`);
  });

  // 4. 状态过滤测试
  await testAPI('状态过滤测试', async () => {
    const response = await axios.get(`${BASE_URL}?status=active`);
    const allActive = response.data.data.accounts.every(acc => acc.status === 'active');
    if (!allActive) throw new Error('Status filter not working');
    log.info(`Found ${response.data.data.accounts.length} active accounts`);
  });

  // 5. 平台过滤测试
  await testAPI('平台过滤测试', async () => {
    const response = await axios.get(`${BASE_URL}?platform=wechat`);
    const allWechat = response.data.data.accounts.every(acc => acc.platform === 'wechat');
    if (!allWechat) throw new Error('Platform filter not working');
    log.info(`Found ${response.data.data.accounts.length} WeChat accounts`);
  });

  // 6. 搜索测试
  await testAPI('搜索测试', async () => {
    const response = await axios.get(`${BASE_URL}?search=测试`);
    if (!response.data.success) throw new Error('Search failed');
    log.info(`Found ${response.data.data.accounts.length} accounts matching search`);
  });

  // 7. 获取账号详情
  await testAPI('获取账号详情', async () => {
    // 先创建一个账号
    const account = await createTestAccount();
    
    // 获取详情
    const response = await axios.get(`${BASE_URL}/${account.id}`);
    if (!response.data.success) throw new Error('Get account failed');
    if (response.data.data.id !== account.id) throw new Error('Account ID mismatch');
    log.success(`Retrieved account: ${response.data.data.name}`);
  });

  // 8. 更新账号
  await testAPI('更新账号', async () => {
    // 先创建一个账号
    const account = await createTestAccount();
    
    // 更新账号
    const updateData = {
      name: '更新后的账号名称',
      description: '更新后的描述',
      status: 'inactive'
    };
    
    const response = await axios.put(`${BASE_URL}/${account.id}`, updateData);
    if (!response.data.success) throw new Error('Update failed');
    if (response.data.data.name !== updateData.name) throw new Error('Name not updated');
    if (response.data.data.status !== updateData.status) throw new Error('Status not updated');
    log.success(`Updated account: ${response.data.data.name}`);
  });

  // 9. 激活/停用账号
  await testAPI('激活/停用账号', async () => {
    // 先创建一个账号
    const account = await createTestAccount();
    
    // 停用账号
    const deactivateResponse = await axios.post(`${BASE_URL}/${account.id}/deactivate`);
    if (deactivateResponse.data.data.status !== 'inactive') throw new Error('Deactivation failed');
    
    // 激活账号
    const activateResponse = await axios.post(`${BASE_URL}/${account.id}/activate`);
    if (activateResponse.data.data.status !== 'active') throw new Error('Activation failed');
    
    log.success('Account activation/deactivation working');
  });

  // 10. 获取账号状态
  await testAPI('获取账号状态', async () => {
    // 先创建一个账号
    const account = await createTestAccount();
    
    const response = await axios.get(`${BASE_URL}/${account.id}/status`);
    if (!response.data.success) throw new Error('Get status failed');
    if (response.data.data.status !== account.status) throw new Error('Status mismatch');
    log.success(`Account status: ${response.data.data.status}`);
  });

  // 11. 批量状态更新
  await testAPI('批量状态更新', async () => {
    // 创建两个测试账号
    const account1 = await createTestAccount();
    const account2 = await createTestAccount();
    
    const bulkData = {
      accountIds: [account1.id, account2.id],
      status: 'inactive'
    };
    
    const response = await axios.put(`${BASE_URL}/status/bulk`, bulkData);
    if (!response.data.success) throw new Error('Bulk update failed');
    if (response.data.data.successCount !== 2) throw new Error('Bulk update count incorrect');
    log.success(`Bulk updated ${response.data.data.successCount} accounts`);
  });

  // 12. 获取账号统计
  await testAPI('获取账号统计', async () => {
    // 先创建一个账号
    const account = await createTestAccount();
    
    const response = await axios.get(`${BASE_URL}/${account.id}/stats`);
    if (!response.data.success) throw new Error('Get stats failed');
    if (response.data.data.accountId !== account.id) throw new Error('Account ID mismatch');
    log.success(`Account stats: ${response.data.data.totalContent} contents`);
  });

  // 13. 获取所有账号统计
  await testAPI('获取所有账号统计', async () => {
    const response = await axios.get(`${BASE_URL}/stats/overview`);
    if (!response.data.success) throw new Error('Get overview failed');
    if (typeof response.data.data.total !== 'number') throw new Error('Total should be a number');
    log.info(`Total accounts: ${response.data.data.total}`);
    log.info(`Active accounts: ${response.data.data.active}`);
    log.info(`Inactive accounts: ${response.data.data.inactive}`);
  });

  // 14. 获取账号活跃度
  await testAPI('获取账号活跃度', async () => {
    const response = await axios.get(`${BASE_URL}/activity`);
    if (!response.data.success) throw new Error('Get activity failed');
    if (typeof response.data.data.activeAccounts !== 'number') throw new Error('Active count should be a number');
    log.info(`Active accounts: ${response.data.data.activeAccounts}`);
    log.info(`Inactive accounts: ${response.data.data.inactiveAccounts}`);
  });

  // 15. 获取账号趋势
  await testAPI('获取账号趋势', async () => {
    const response = await axios.get(`${BASE_URL}/trends`);
    if (!response.data.success) throw new Error('Get trends failed');
    if (!Array.isArray(response.data.data.trends)) throw new Error('Trends should be an array');
    log.info(`Trends period: ${response.data.data.period.days} days`);
    log.info(`Trends data points: ${response.data.data.trends.length}`);
  });

  // 16. 删除账号
  await testAPI('删除账号', async () => {
    // 先创建一个账号
    const account = await createTestAccount();
    
    // 删除账号
    const response = await axios.delete(`${BASE_URL}/${account.id}`);
    if (response.status !== 204) throw new Error('Delete failed');
    
    // 验证账号已被删除
    try {
      await axios.get(`${BASE_URL}/${account.id}`);
      throw new Error('Account should be deleted');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        log.success('Account successfully deleted');
      } else {
        throw error;
      }
    }
  });

  // 显示测试结果
  log.header('📊 测试结果');
  log.success(`✅ 通过: ${testResults.passed}`);
  log.error(`❌ 失败: ${testResults.failed}`);
  log.info(`📝 总计: ${testResults.total}`);
  
  if (testResults.failed === 0) {
    log.success('🎉 所有测试通过！');
  } else {
    log.warning(`⚠️  ${testResults.failed} 个测试失败`);
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runAPITests().catch(error => {
    log.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAPITests, testAPI };