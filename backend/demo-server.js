#!/usr/bin/env node

/**
 * 账号管理API演示脚本
 * 展示如何使用账号管理API的各种功能
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 导入路由
const accountsRouter = require('./src/routes/accounts');

// 使用路由
app.use('/api/accounts', accountsRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Account Management API Server running on port ${PORT}`);
  console.log(`📊 API Documentation available at: http://localhost:${PORT}/api/accounts`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  POST   /api/accounts           - Create account');
  console.log('  GET    /api/accounts           - Get accounts list');
  console.log('  GET    /api/accounts/:id       - Get account details');
  console.log('  PUT    /api/accounts/:id       - Update account');
  console.log('  DELETE /api/accounts/:id       - Delete account');
  console.log('  POST   /api/accounts/:id/activate   - Activate account');
  console.log('  POST   /api/accounts/:id/deactivate - Deactivate account');
  console.log('  GET    /api/accounts/:id/status     - Get account status');
  console.log('  PUT    /api/accounts/status/bulk    - Bulk status update');
  console.log('  GET    /api/accounts/:id/stats      - Get account stats');
  console.log('  GET    /api/accounts/stats/overview - Get all accounts stats');
  console.log('  GET    /api/accounts/activity      - Get accounts activity');
  console.log('  GET    /api/accounts/trends       - Get accounts trends');
});

module.exports = app;