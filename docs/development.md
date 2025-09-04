# 开发环境搭建指南

## 概述

本文档提供了 AI Writer 项目的完整开发环境搭建指南，涵盖了从零开始配置开发环境的所有步骤。

## 系统要求

### 最低要求
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **内存**: 4GB RAM
- **存储**: 2GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **操作系统**: Ubuntu 20.04 LTS, macOS 12+, Windows 11
- **内存**: 8GB RAM 或更多
- **存储**: 5GB SSD
- **CPU**: 4 核或更多
- **网络**: 50Mbps+ 带宽

## 开发工具安装

### 1. Node.js 安装

#### Windows
```bash
# 下载并安装 Node.js 20.x LTS
# 访问 https://nodejs.org/ 下载安装包
# 或者使用 Chocolatey:
choco install nodejs-lts
```

#### macOS
```bash
# 使用 Homebrew
brew install node

# 或者使用 nvm (推荐)
brew install nvm
nvm install 20
nvm use 20
```

#### Linux (Ubuntu/Debian)
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v20.x.x
npm --version   # 应该显示对应版本
```

### 2. Git 安装

#### Windows
```bash
# 下载并安装 Git
# 访问 https://git-scm.com/ 下载安装包
# 或者使用 Chocolatey:
choco install git
```

#### macOS
```bash
# 使用 Homebrew
brew install git
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# 配置 Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. 代码编辑器

#### VS Code (推荐)
```bash
# 下载并安装 VS Code
# 访问 https://code.visualstudio.com/ 下载安装包

# 安装推荐的扩展
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
```

### 4. 数据库工具

#### SQLite Browser (可选)
```bash
# Windows (Chocolatey)
choco install sqlite-browser

# macOS (Homebrew)
brew install db-browser-for-sqlite

# Linux (Ubuntu/Debian)
sudo apt install sqlitebrowser
```

## 项目设置

### 1. 克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/your-repo/aiwriter.git

# 进入项目目录
cd aiwriter

# 查看项目结构
ls -la
```

### 2. 安装依赖

```bash
# 一键安装所有依赖
npm run install:all

# 或者分别安装
npm install                    # 根目录依赖
cd frontend && npm install      # 前端依赖
cd ../backend && npm install   # 后端依赖
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**开发环境配置示例**:
```env
# 服务器配置
NODE_ENV=development
PORT=8000
HOST=localhost

# 数据库配置
DB_PATH=./database/aiwriter.db

# Google Gemini API 配置
GEMINI_API_KEY=your_gemini_api_key_here

# JWT 配置
JWT_SECRET=dev_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# 日志配置
LOG_LEVEL=debug
LOG_DIR=./logs

# 安全配置
BCRYPT_ROUNDS=10
SESSION_SECRET=dev_session_secret_here
```

### 4. 数据库初始化

```bash
# 创建数据库目录
mkdir -p database

# 初始化数据库
npm run db:init

# 运行数据库迁移
npm run db:migrate
```

### 5. 验证安装

```bash
# 检查项目结构
tree -I 'node_modules'

# 检查依赖安装
npm list --depth=0

# 运行代码检查
npm run lint

# 运行格式化检查
npm run format:check
```

## 开发环境启动

### 1. 并发启动（推荐）

```bash
# 同时启动前端和后端
npm run dev

# 或者使用自定义端口
PORT=8001 npm run dev
```

### 2. 分别启动

```bash
# 启动后端服务
npm run dev:backend

# 在另一个终端启动前端
npm run dev:frontend
```

### 3. 验证服务状态

```bash
# 检查后端 API
curl http://localhost:8000/health

# 检查前端应用
# 浏览器访问: http://localhost:3000
```

## 开发工具配置

### 1. VS Code 工作区配置

项目已包含完整的 VS Code 配置：

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 2. 调试配置

使用 VS Code 调试功能：

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.js",
      "cwd": "${workspaceFolder}/backend"
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### 3. Git Hooks 配置

项目已配置 Git Hooks：

```bash
# 安装 Git Hooks
npm run prepare

# 提交时会自动运行
# - 代码检查
# - 代码格式化
# - 提交信息规范检查
```

## 开发脚本

### 常用开发命令

```bash
# 开发相关
npm run dev              # 并发启动前端和后端
npm run dev:frontend     # 启动前端开发服务器
npm run dev:backend      # 启动后端开发服务器

# 构建相关
npm run build            # 构建前端和后端
npm run build:frontend   # 构建前端
npm run build:backend    # 构建后端

# 测试相关
npm test                 # 运行所有测试
npm run test:frontend    # 运行前端测试
npm run test:backend     # 运行后端测试

# 代码质量
npm run lint             # 运行代码检查
npm run format           # 格式化代码
npm run format:check     # 检查代码格式

# 数据库相关
npm run db:init          # 初始化数据库
npm run db:migrate       # 运行数据库迁移
npm run db:seed          # 填充测试数据
npm run db:reset         # 重置数据库

# 维护相关
npm run install:all      # 安装所有依赖
npm run clean            # 清理构建文件和依赖
npm run setup            # 一键设置项目
```

### 开发工具脚本

```bash
# VS Code 任务
# 按 Cmd+Shift+P (macOS) 或 Ctrl+Shift+P (Windows/Linux)
# 运行 "Tasks: Run Task" 可以看到以下任务：
# - Install All Dependencies
# - Start Development Server
# - Build Project
# - Run Tests
# - Lint Code
# - Format Code
# - Clean Project
# - Setup Project
```

## 故障排除

### 常见问题

#### 1. Node.js 版本问题
```bash
# 检查 Node.js 版本
node --version

# 如果版本不是 20.x，使用 nvm 切换版本
nvm install 20
nvm use 20

# 或者更新 npm
npm install -g npm@latest
```

#### 2. 依赖安装失败
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

#### 3. 端口冲突
```bash
# 查看端口占用
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 修改端口
# 在 .env 文件中修改 PORT 配置
PORT=8001 npm run dev
```

#### 4. 数据库连接问题
```bash
# 检查数据库文件
ls -la database/

# 检查权限
chmod 755 database/

# 重新初始化数据库
npm run db:reset
```

#### 5. 环境变量问题
```bash
# 验证环境变量
node -e "console.log(process.env.NODE_ENV)"

# 确保所有必需的环境变量都已设置
grep -v '^#' .env | grep -v '^$'
```

### 调试技巧

#### 1. 启用详细日志
```bash
# 启用调试模式
DEBUG=* npm run dev

# 或者设置日志级别
LOG_LEVEL=debug npm run dev
```

#### 2. 使用开发工具
```bash
# Chrome DevTools
# 在浏览器中打开 http://localhost:3000
# 按 F12 打开开发者工具

# VS Code 调试
# 设置断点，按 F5 开始调试
```

#### 3. 查看构建信息
```bash
# 查看详细构建信息
npm run build:frontend -- --mode development
npm run build:backend -- --mode development
```

## 开发最佳实践

### 1. 代码规范

- 遵循项目现有的 ESLint 规则
- 使用 Prettier 格式化代码
- 编写有意义的提交信息
- 保持代码简洁和可读

### 2. 分支管理

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 定期同步主分支
git pull origin main

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/your-feature-name
```

### 3. 测试驱动开发

```bash
# 运行测试
npm test

# 运行特定测试
npm test -- --grep "specific test"

# 监听模式
npm test -- --watch
```

### 4. 性能优化

```bash
# 分析构建包大小
npm run build:frontend -- --analyze

# 检查性能
npm run perf:test
```

## 开发环境优化

### 1. 提高构建速度

```bash
# 使用 npm 缓存
npm config set cache /path/to/cache

# 使用并行构建
npm run build -- --parallel
```

### 2. 优化开发体验

```bash
# 启用热重载
# 前端默认启用，后端需要配置 nodemon

# 使用代理
# 在前端配置中设置代理到后端 API
```

### 3. 内存优化

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或者使用 .env 文件
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env
```

## 部署预检查

### 1. 代码质量检查

```bash
# 运行完整的代码检查
npm run lint
npm run format:check
npm test
```

### 2. 构建验证

```bash
# 验证构建
npm run build

# 验证生产环境
npm run build:frontend -- --mode production
npm run build:backend -- --mode production
```

### 3. 安全检查

```bash
# 检查依赖安全
npm audit

# 检查代码安全
npm run security:check
```

## 总结

按照以上步骤，您应该能够成功搭建 AI Writer 项目的开发环境。如果在过程中遇到任何问题，请参考故障排除部分或联系开发团队。

### 快速开始命令

```bash
# 一键设置项目
npm run setup

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

### 下一步

- 阅读 [架构设计文档](./architecture.md)
- 了解 [API 文档](./api.md)
- 查看 [编码规范](./coding-standards.md)
- 开始开发您的第一个功能

---

祝您开发愉快！🚀