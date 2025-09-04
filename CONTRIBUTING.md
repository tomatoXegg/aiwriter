# 贡献指南

感谢您对 AI Writer 项目的关注！我们欢迎所有形式的贡献，包括但不限于代码提交、bug报告、功能建议、文档改进等。

## 🤝 如何贡献

### 1. 报告问题

如果您发现了 bug 或者有功能建议，请通过 [GitHub Issues](https://github.com/your-repo/aiwriter/issues) 提交。

#### 提交高质量的 Issue
- 使用清晰、简洁的标题
- 详细描述问题或建议
- 提供复现步骤（对于 bug）
- 包含相关的错误信息或截图
- 说明您的运行环境（操作系统、浏览器版本等）

#### Issue 模板
- **Bug 报告**: 使用 `Bug Report` 模板
- **功能请求**: 使用 `Feature Request` 模板
- **文档改进**: 使用 `Documentation` 模板

### 2. 提交代码

#### 开发环境设置
1. Fork 项目到您的 GitHub 账户
2. Clone 您的 fork 到本地：
   ```bash
   git clone https://github.com/your-username/aiwriter.git
   cd aiwriter
   ```
3. 设置上游仓库：
   ```bash
   git remote add upstream https://github.com/original-repo/aiwriter.git
   ```
4. 安装依赖：
   ```bash
   npm run install:all
   ```
5. 创建开发分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### 开发流程
1. 编写代码
2. 运行测试：`npm test`
3. 代码格式化：`npm run format`
4. 代码检查：`npm run lint`
5. 确保所有测试通过
6. 提交您的更改

#### 提交规范
我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (Type)**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建工具或依赖管理
- `perf`: 性能优化
- `ci`: CI 配置
- `build`: 构建相关

**示例**
```bash
feat(auth): add user login functionality
fix(api): handle empty response in user endpoint
docs(readme): update installation instructions
style(button): improve button styling
```

#### 提交 Pull Request
1. 推送您的分支到 GitHub：
   ```bash
   git push origin feature/your-feature-name
   ```
2. 在 GitHub 上创建 Pull Request
3. 填写 PR 描述模板
4. 等待代码审查
5. 根据反馈进行修改
6. 合并后删除本地分支

### 3. 代码审查

#### 审查标准
- 代码符合项目编码规范
- 包含适当的测试
- 文档更新（如需要）
- 没有引入新的安全问题
- 性能影响在可接受范围内

#### 审查流程
1. 自动化检查通过（CI/CD）
2. 至少一名维护者审查
3. 所有审查意见得到解决
4. 通过所有测试

## 📋 开发规范

### 代码风格
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数名
- 保持函数简短和专注

### 文件结构
```
frontend/
├── src/
│   ├── components/     # 可复用组件
│   ├── pages/         # 页面组件
│   ├── services/      # API 服务
│   ├── store/         # 状态管理
│   ├── types/         # 类型定义
│   ├── hooks/         # 自定义 hooks
│   ├── utils/         # 工具函数
│   └── constants/     # 常量定义
```

### 测试要求
- 新功能必须包含测试
- Bug 修复需要添加回归测试
- 测试覆盖率不低于 80%
- 使用 Jest 和 React Testing Library

### 文档要求
- 公共 API 需要文档注释
- 复杂逻辑需要内联注释
- 更新相关的 README 或文档

## 🏗️ 架构概览

### 技术栈
- **前端**: React + TypeScript + Vite + Ant Design + Tailwind CSS
- **后端**: Node.js + Express + SQLite
- **AI 集成**: Google Gemini API
- **状态管理**: Zustand
- **样式**: Tailwind CSS + Ant Design

### 核心模块
- **用户管理**: 账号创建、认证、授权
- **素材管理**: 文本输入、文件上传、标签分类
- **选题生成**: AI 分析素材、生成选题建议
- **内容生成**: 基于选题生成文章
- **质量审查**: 内容质量检查和优化建议

## 🧪 测试指南

### 运行测试
```bash
# 运行所有测试
npm test

# 运行前端测试
npm run test:frontend

# 运行后端测试
npm run test:backend

# 运行测试覆盖率
npm run test:coverage
```

### 测试结构
```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
├── e2e/           # 端到端测试
└── fixtures/      # 测试数据
```

## 🚀 部署指南

### 本地部署
1. 克隆项目
2. 安装依赖：`npm run install:all`
3. 配置环境变量：复制 `.env.example` 到 `.env`
4. 启动开发服务器：`npm run dev`

### 生产部署
1. 构建项目：`npm run build`
2. 配置生产环境变量
3. 部署到服务器

## 📞 联系我们

- **GitHub Issues**: [提交问题](https://github.com/your-repo/aiwriter/issues)
- **Email**: [your-email@example.com](mailto:your-email@example.com)
- **讨论组**: [GitHub Discussions](https://github.com/your-repo/aiwriter/discussions)

## 📄 许可证

通过贡献代码，您同意您的贡献将在 [ISC License](./LICENSE) 下发布。

## 🙏 致谢

感谢所有贡献者的努力！您的贡献让这个项目变得更好。

---

**注意**: 本指南可能会随着项目的发展而更新。请定期查看最新版本。