# AI Writer - 多账号AI内容创作平台

一个专为内容创业者设计的多账号AI内容创作平台，支持素材输入、选题整合、内容生成和审查的矩阵化输出。

## 🚀 功能特性

### 核心功能
- **多账号管理** - 支持最多10个账号的创建和管理
- **素材输入** - 支持文本输入和文件上传，带标签分类
- **选题整合** - AI分析素材并生成选题建议
- **内容生成** - 基于选题生成高质量公众号文章
- **内容审查** - 自动质量检查和优化建议
- **自定义Prompt** - 每个环节都支持自定义prompt模板

### 技术栈
- **前端**: React + TypeScript + Vite + Ant Design + Tailwind CSS
- **后端**: Node.js + Express + SQLite
- **AI集成**: Google Gemini API
- **状态管理**: Zustand
- **样式**: Tailwind CSS + Ant Design

## 📁 项目结构

```
aiwriter/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── store/          # 状态管理
│   │   ├── types/          # TypeScript类型定义
│   │   └── hooks/          # 自定义hooks
│   ├── public/             # 静态资源
│   └── package.json
├── backend/                  # Node.js后端服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   ├── config/         # 配置文件
│   │   └── database/       # 数据库初始化
│   └── package.json
├── database/                # SQLite数据库文件
├── .claude/                 # Claude配置和文档
│   ├── prds/               # 产品需求文档
│   ├── epics/              # 实施计划
│   └── commands/           # 自定义命令
└── README.md
```

## 🛠️ 安装和运行

### 前置要求
- Node.js 18+
- npm 或 yarn

### 安装依赖

#### 前端
```bash
cd frontend
npm install
```

#### 后端
```bash
cd backend
npm install
```

### 配置环境变量

在 `backend/.env` 文件中配置：

```env
PORT=8000
NODE_ENV=development
DB_PATH=./database/aiwriter.db
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

### 运行项目

#### 启动后端服务
```bash
cd backend
npm start
```

#### 启动前端开发服务器
```bash
cd frontend
npm run dev
```

### 访问应用
- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/api

## 📋 API端点

### 账号管理
- `GET /api/accounts` - 获取所有账号
- `POST /api/accounts` - 创建新账号
- `GET /api/accounts/:id` - 获取特定账号
- `PUT /api/accounts/:id` - 更新账号
- `DELETE /api/accounts/:id` - 删除账号

### 素材管理
- `GET /api/materials` - 获取所有素材
- `POST /api/materials` - 创建新素材
- `GET /api/materials/:id` - 获取特定素材
- `PUT /api/materials/:id` - 更新素材
- `DELETE /api/materials/:id` - 删除素材
- `GET /api/materials/search?q=query` - 搜索素材

### 健康检查
- `GET /health` - 服务健康状态
- `GET /api` - API信息

## 🎯 使用流程

1. **创建账号** - 在账号管理页面创建要运营的公众号账号
2. **输入素材** - 在素材管理页面添加创作素材
3. **选题整合** - 选择素材，AI生成选题建议
4. **内容生成** - 基于选题生成完整文章
5. **内容审查** - 对生成内容进行质量检查
6. **发布分配** - 将内容分配到不同账号

## 🔧 开发说明

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 代码规范
- 组件和函数使用清晰的命名

### 数据库设计
使用 SQLite 作为本地数据库，包含以下主要表：
- `accounts` - 账号信息
- `materials` - 素材内容
- `topics` - 选题信息
- `contents` - 生成的内容
- `reviews` - 内容审查记录
- `prompt_templates` - Prompt模板

### AI集成
集成 Google Gemini API 提供AI能力：
- 素材分析和选题生成
- 内容创作和生成
- 内容质量审查

## 📝 开发计划

### 阶段1 (已完成) ✅
- [x] 项目基础架构搭建
- [x] React前端项目设置
- [x] Node.js后端服务配置
- [x] 数据库结构设计

### 阶段2 (进行中) 🚧
- [x] 基础API实现
- [ ] Google Gemini API集成
- [ ] 选题整合功能
- [ ] 内容生成功能
- [ ] 内容审查功能

### 阶段3 (计划中) 📋
- [ ] 用户界面完善
- [ ] 工作流整合
- [ ] 自定义Prompt系统
- [ ] 性能优化
- [ ] 测试和部署

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

ISC License

## 📞 支持

如有问题或建议，请提交 Issue 或联系开发团队。