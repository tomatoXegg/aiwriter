# 架构设计文档

## 概述

AI Writer 是一个基于 Web 的多账号 AI 内容创作平台，采用现代化的前后端分离架构。本文档详细描述了系统的整体架构设计、技术选型、模块划分和交互流程。

## 系统架构

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   后端服务       │    │   数据库         │
│  (React SPA)    │◄──►│  (Express API)  │◄──►│  (SQLite)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐               │
         │              │   AI 服务        │               │
         │              │ (Google Gemini)  │               │
         │              └─────────────────┘               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   静态资源       │                            │   文件存储       │
│  (CDN/Static)   │                            │  (Uploads)      │
└─────────────────┘                            └─────────────────┘
```

### 架构特点

1. **前后端分离**: 前端使用 React 单页应用，后端提供 RESTful API
2. **模块化设计**: 系统采用模块化设计，便于维护和扩展
3. **AI 集成**: 集成 Google Gemini API 提供智能化功能
4. **轻量级数据库**: 使用 SQLite 作为本地数据库
5. **现代化工具链**: 使用最新的开发工具和最佳实践

## 技术栈选择

### 前端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| React | 18.x | UI 框架 | 生态成熟，性能优秀 |
| TypeScript | 5.x | 类型系统 | 提供类型安全，减少运行时错误 |
| Vite | 4.x | 构建工具 | 快速构建，热重载 |
| Ant Design | 5.x | UI 组件库 | 企业级组件库，设计规范 |
| Tailwind CSS | 3.x | 样式框架 | 实用优先，快速开发 |
| Zustand | 4.x | 状态管理 | 轻量级，易于使用 |
| React Router | 6.x | 路由管理 | 官方路由，功能完善 |

### 后端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| Node.js | 18.x | 运行时 | 异步非阻塞，性能优秀 |
| Express | 4.x | Web 框架 | 轻量级，灵活易用 |
| SQLite | 3.x | 数据库 | 轻量级，无需配置 |
| TypeScript | 5.x | 类型系统 | 统一技术栈，类型安全 |
| JWT | - | 认证 | 无状态认证，易于扩展 |
| Multer | - | 文件上传 | 处理 multipart 数据 |
| CORS | - | 跨域 | 解决跨域问题 |

### 开发工具

| 工具 | 用途 | 配置 |
|------|------|------|
| ESLint | 代码检查 | 自定义规则，支持 React/TS |
| Prettier | 代码格式化 | 统一代码风格 |
| Husky | Git Hooks | 提交前检查 |
| lint-staged | 增量检查 | 提高检查效率 |
| Jest | 测试框架 | 单元测试和集成测试 |

## 系统模块设计

### 前端模块

#### 1. 用户界面模块 (UI Module)
```
src/
├── components/
│   ├── common/           # 通用组件
│   │   ├── Button/
│   │   ├── Modal/
│   │   └── Layout/
│   ├── forms/           # 表单组件
│   │   ├── AccountForm/
│   │   ├── MaterialForm/
│   │   └── TopicForm/
│   └── pages/           # 页面组件
│       ├── Dashboard/
│       ├── Accounts/
│       ├── Materials/
│       ├── Topics/
│       └── Contents/
```

#### 2. 状态管理模块 (State Management)
```
src/store/
├── index.ts            # Store 配置
├── authStore.ts        # 认证状态
├── accountStore.ts     # 账号管理
├── materialStore.ts    # 素材管理
├── topicStore.ts       # 选题管理
├── contentStore.ts     # 内容管理
└── uiStore.ts          # UI 状态
```

#### 3. 服务模块 (Services)
```
src/services/
├── api.ts              # API 客户端配置
├── authService.ts      # 认证服务
├── accountService.ts   # 账号服务
├── materialService.ts  # 素材服务
├── topicService.ts     # 选题服务
├── contentService.ts   # 内容服务
└── aiService.ts        # AI 服务
```

#### 4. 路由模块 (Routing)
```
src/
├── App.tsx             # 根组件
├── router/
│   ├── index.ts        # 路由配置
│   ├── PrivateRoute.tsx # 私有路由
│   └── PublicRoute.tsx # 公共路由
└── pages/
    ├── Login.tsx       # 登录页
    ├── Dashboard.tsx   # 仪表板
    └── ...
```

### 后端模块

#### 1. 控制器层 (Controllers)
```
backend/src/controllers/
├── authController.ts       # 认证控制器
├── accountController.ts    # 账号控制器
├── materialController.ts   # 素材控制器
├── topicController.ts      # 选题控制器
├── contentController.ts    # 内容控制器
└── healthController.ts     # 健康检查控制器
```

#### 2. 路由层 (Routes)
```
backend/src/routes/
├── index.ts            # 路由聚合
├── authRoutes.ts       # 认证路由
├── accountRoutes.ts    # 账号路由
├── materialRoutes.ts   # 素材路由
├── topicRoutes.ts      # 选题路由
├── contentRoutes.ts    # 内容路由
└── apiRoutes.ts        # API 路由
```

#### 3. 模型层 (Models)
```
backend/src/models/
├── database.ts         # 数据库连接
├── Account.ts          # 账号模型
├── Material.ts         # 素材模型
├── Topic.ts            # 选题模型
├── Content.ts          # 内容模型
├── Review.ts           # 审查模型
└── PromptTemplate.ts   # 模板模型
```

#### 4. 中间件层 (Middleware)
```
backend/src/middleware/
├── auth.ts             # 认证中间件
├── cors.ts             # 跨域中间件
├── errorHandler.ts     # 错误处理
├── rateLimiter.ts      # 限流中间件
├── validation.ts       # 数据验证
└── logger.ts           # 日志中间件
```

#### 5. 服务层 (Services)
```
backend/src/services/
├── aiService.ts        # AI 服务
├── databaseService.ts  # 数据库服务
├── cacheService.ts     # 缓存服务
├── fileService.ts       # 文件服务
└── emailService.ts     # 邮件服务
```

#### 6. 工具层 (Utils)
```
backend/src/utils/
├── validators.ts       # 验证工具
├── formatters.ts       # 格式化工具
├── crypto.ts           # 加密工具
├── date.ts             # 日期工具
└── constants.ts        # 常量定义
```

## 数据库设计

### 数据库结构
```
aiwriter.db
├── accounts           # 账号表
├── materials          # 素材表
├── topics            # 选题表
├── contents          # 内容表
├── reviews           # 审查表
├── prompt_templates  # 模板表
├── users             # 用户表
└── audit_logs        # 审计日志表
```

### 表关系图
```
users ──┐
        ├─ accounts ──┐
        │             ├─ materials ── topics ── contents
        │             └─ prompt_templates
        └─ reviews ─── contents
```

## API 设计

### RESTful API 设计原则
1. **资源导向**: URL 表示资源，HTTP 方法表示操作
2. **无状态**: 每个请求包含完整的信息
3. **统一接口**: 使用标准的 HTTP 方法
4. **版本控制**: 通过 URL 路径进行版本控制

### API 路径结构
```
/api/v1/
├── auth/              # 认证相关
│   ├── login
│   ├── logout
│   └── refresh
├── accounts/          # 账号管理
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── materials/         # 素材管理
│   ├── GET /
│   ├── POST /
│   ├── GET /search
│   └── POST /upload
├── topics/            # 选题管理
│   ├── GET /
│   ├── POST /
│   └── POST /generate
├── contents/          # 内容管理
│   ├── GET /
│   ├── POST /
│   ├── POST /generate
│   └── POST /review
└── health/            # 健康检查
    └── GET /
```

## 安全设计

### 认证和授权
1. **JWT 认证**: 使用 JSON Web Token 进行无状态认证
2. **角色权限**: 基于角色的访问控制 (RBAC)
3. **密码安全**: 使用 bcrypt 加密存储密码
4. **会话管理**: 支持 token 刷新和过期控制

### 数据安全
1. **输入验证**: 所有输入数据进行严格验证
2. **SQL 注入防护**: 使用参数化查询
3. **XSS 防护**: 对输出内容进行转义
4. **CSRF 防护**: 使用 CSRF token

### 网络安全
1. **HTTPS**: 强制使用 HTTPS 加密传输
2. **CORS**: 配置跨域资源共享
3. **限流**: 实现 API 限流保护
4. **头部安全**: 设置安全相关的 HTTP 头部

## 性能优化

### 前端优化
1. **代码分割**: 使用动态导入实现懒加载
2. **缓存策略**: 合理使用浏览器缓存
3. **图片优化**: 图片压缩和懒加载
4. **虚拟滚动**: 大列表虚拟滚动

### 后端优化
1. **数据库索引**: 为查询字段创建索引
2. **连接池**: 数据库连接池管理
3. **缓存策略**: 实现内存缓存
4. **异步处理**: 使用异步非阻塞 I/O

### AI 服务优化
1. **请求合并**: 批量处理 AI 请求
2. **结果缓存**: 缓存 AI 生成结果
3. **错误重试**: 实现智能重试机制
4. **限流控制**: 控制 AI API 调用频率

## 部署架构

### 开发环境
```
本地开发
├── 前端: localhost:3000
├── 后端: localhost:8000
├── 数据库: ./database/aiwriter.db
└── AI 服务: Google Gemini API
```

### 生产环境
```
生产部署
├── 前端: Nginx + CDN
├── 后端: PM2 + Node.js
├── 数据库: SQLite + 定期备份
├── 文件存储: 对象存储服务
└── 监控: 日志 + 性能监控
```

## 监控和日志

### 日志系统
1. **结构化日志**: 使用 JSON 格式记录日志
2. **日志级别**: 支持 debug, info, warn, error 级别
3. **文件轮转**: 日志文件自动轮转和压缩
4. **错误追踪**: 集成错误追踪服务

### 监控指标
1. **性能监控**: 响应时间、吞吐量、错误率
2. **资源监控**: CPU、内存、磁盘使用情况
3. **业务监控**: 用户活跃度、功能使用情况
4. **健康检查**: 服务健康状态检查

## 扩展性设计

### 水平扩展
1. **无状态设计**: 后端服务无状态，易于扩展
2. **数据库分片**: 支持数据库水平分片
3. **缓存集群**: 支持分布式缓存
4. **负载均衡**: 支持负载均衡器

### 功能扩展
1. **插件系统**: 支持功能插件化
2. **API 版本**: 支持多版本 API 并存
3. **多租户**: 支持多租户架构
4. **国际化**: 支持多语言和地区

---

## 总结

AI Writer 项目采用现代化的架构设计，具有良好的可维护性、扩展性和性能。通过模块化设计、清晰的技术选型和完善的开发工具，为项目的发展和团队的协作提供了坚实的基础。