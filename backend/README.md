# AI Writer Backend 部署说明

## 项目概述

AI Writer Backend 是一个基于 Express.js 和 TypeScript 的后端服务，提供 AI 驱动的内容生成平台功能。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express 4.18+
- **数据库**: SQLite 3+
- **AI服务**: Google Gemini API
- **语言**: TypeScript
- **认证**: API Key 认证

## 安装和运行

### 1. 环境准备

确保已安装 Node.js 18+ 和 npm：

```bash
node --version
npm --version
```

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置：

```env
# 服务器配置
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# 安全配置
API_KEY=your-secret-api-key

# AI 服务配置
GEMINI_API_KEY=your-gemini-api-key
```

### 4. 构建和运行

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API 端点

### 健康检查
- `GET /health` - 服务健康状态
- `GET /api` - API 文档

### 认证要求
大部分 API 端点需要通过 `x-api-key` 请求头进行认证：

```http
x-api-key: your-secret-api-key
```

### 核心功能

#### 账号管理
- `GET /api/accounts` - 获取所有账号
- `POST /api/accounts` - 创建新账号
- `GET /api/accounts/:id` - 获取特定账号
- `PUT /api/accounts/:id` - 更新账号
- `DELETE /api/accounts/:id` - 删除账号

#### AI 服务
- `POST /api/ai/topics` - 从素材生成选题
- `POST /api/ai/content` - 从选题生成内容
- `POST /api/ai/review` - 内容质量审查
- `GET /api/ai/status` - AI 服务状态

#### 内容审查
- `GET /api/reviews` - 获取所有审查
- `POST /api/reviews` - 创建新审查
- `GET /api/reviews/:id` - 获取特定审查
- `PUT /api/reviews/:id` - 更新审查
- `DELETE /api/reviews/:id` - 删除审查

## 数据库结构

系统使用 SQLite 数据库，包含以下表：

- `accounts` - 账号信息
- `materials` - 素材管理
- `topics` - 选题管理
- `contents` - 内容管理
- `reviews` - 审查记录
- `prompt_templates` - 提示词模板

## 错误处理

API 使用统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误信息",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 限流配置

API 使用限流保护：
- 窗口期：15 分钟
- 最大请求数：100 次/IP

## 安全特性

- **CORS 配置**: 跨域资源共享
- **Helmet**: 安全头部设置
- **Rate Limiting**: 请求限流
- **API Key 认证**: 请求认证
- **输入验证**: 请求数据验证

## 监控和日志

- 请求日志记录
- 错误日志记录
- 性能监控
- 健康检查

## 测试

运行测试脚本：
```bash
./test.sh
```

## 部署建议

### 生产环境配置

1. **环境变量**:
   - 设置 `NODE_ENV=production`
   - 配置强密码的 `API_KEY`
   - 配置 `GEMINI_API_KEY`

2. **数据库**:
   - 定期备份数据库文件
   - 考虑数据库迁移策略

3. **安全**:
   - 使用 HTTPS
   - 配置防火墙规则
   - 定期更新依赖包

4. **监控**:
   - 设置应用监控
   - 配置错误报警
   - 监控资源使用情况

### Docker 部署（可选）

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8000
CMD ["npm", "start"]
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库文件权限
   - 确保数据库目录存在

2. **AI 服务不可用**
   - 检查 `GEMINI_API_KEY` 配置
   - 确认网络连接正常

3. **认证失败**
   - 检查 `x-api-key` 请求头
   - 确认 API 密钥正确

4. **TypeScript 编译错误**
   - 运行 `npm run build` 检查错误
   - 安装缺失的类型定义

## 开发指南

### 项目结构

```
backend/
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── database/       # 数据库相关
│   ├── middleware/     # 中间件
│   ├── routes/         # 路由定义
│   ├── services/       # 服务层
│   ├── types/          # 类型定义
│   ├── utils/          # 工具函数
│   └── index.ts        # 入口文件
├── tests/              # 测试文件
├── database/           # 数据库文件
├── .env.example        # 环境变量模板
├── package.json        # 项目配置
└── tsconfig.json       # TypeScript 配置
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写单元测试

### 提交规范

使用语义化提交信息：
- `feat`: 新功能
- `fix`: 修复错误
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建或辅助工具变动

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮件支持

---

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基础 API 框架搭建
- 集成 Google Gemini AI
- 实现账号管理功能
- 添加内容审查功能