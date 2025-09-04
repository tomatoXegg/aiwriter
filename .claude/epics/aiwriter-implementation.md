---
name: aiwriter-implementation
description: aiwriter多账号AI内容创作平台实施计划
status: planning
created: 2025-09-04T01:07:36Z
epic_of: aiwriter
---

# Epic: aiwriter Implementation

## 概述

本epic基于aiwriter PRD制定详细的实施计划，将PRD中的需求转化为可执行的开发任务。

## 架构设计

### 技术栈选择
- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express
- **数据库**: SQLite (本地存储)
- **AI集成**: Google Gemini API
- **状态管理**: Zustand
- **UI组件**: Ant Design
- **样式**: Tailwind CSS

### 项目结构
```
aiwriter/
├── src/
│   ├── components/          # React组件
│   ├── pages/              # 页面组件
│   ├── services/           # API服务
│   ├── store/              # 状态管理
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript类型定义
│   └── hooks/              # 自定义hooks
├── database/               # SQLite数据库
├── config/                 # 配置文件
└── public/                 # 静态资源
```

## 实施阶段

### 阶段1: 项目基础架构 (Week 1-2)

#### 1.1 项目初始化
- [ ] 创建React项目结构
- [ ] 配置TypeScript和开发环境
- [ ] 设置路由系统 (React Router)
- [ ] 配置状态管理 (Zustand)
- [ ] 搭建UI框架 (Ant Design + Tailwind)

#### 1.2 数据库设计
- [ ] 设计SQLite数据库结构
- [ ] 创建账号管理表
- [ ] 创建内容管理表
- [ ] 创建素材库表
- [ ] 创建配置表

#### 1.3 API集成基础
- [ ] 搭建Express后端服务
- [ ] 配置Google Gemini API客户端
- [ ] 实现基础API路由结构
- [ ] 设置错误处理中间件

### 阶段2: 核心功能模块 (Week 3-5)

#### 2.1 账号管理模块
- [ ] 实现账号创建功能
- [ ] 账号信息编辑界面
- [ ] 账号列表和切换功能
- [ ] 账号状态统计显示

#### 2.2 素材输入模块
- [ ] 文本输入组件开发
- [ ] 文件上传功能
- [ ] 素材分类和标签系统
- [ ] 素材库管理界面

#### 2.3 基础内容生成
- [ ] Gemini API集成
- [ ] 基础内容生成接口
- [ ] 内容预览功能
- [ ] 内容保存到数据库

### 阶段3: 高级功能模块 (Week 6-8)

#### 3.1 选题整合模块
- [ ] 素材AI分析功能
- [ ] 选题生成算法
- [ ] 选题筛选和编辑界面
- [ ] 自定义prompt模板系统

#### 3.2 内容审查模块
- [ ] 内容质量检查功能
- [ ] 原创性检测算法
- [ ] 优化建议生成
- [ ] 审查结果可视化

#### 3.3 工作流整合
- [ ] 三步工作流界面设计
- [ ] 工作流状态管理
- [ ] 步骤间数据传递
- [ ] 工作流历史记录

### 阶段4: 用户界面优化 (Week 9-10)

#### 4.1 主界面设计
- [ ] 仪表板界面开发
- [ ] 工作区布局优化
- [ ] 响应式设计实现
- [ ] 深色模式支持

#### 4.2 用户体验优化
- [ ] 加载状态和进度条
- [ ] 错误提示和帮助信息
- [ ] 键盘快捷键支持
- [ ] 操作历史记录

### 阶段5: 测试和部署 (Week 11-12)

#### 5.1 测试
- [ ] 单元测试编写
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 用户验收测试

#### 5.2 部署准备
- [ ] 性能优化
- [ ] 安全检查
- [ ] 文档完善
- [ ] 打包和分发

## 详细任务分解

### 账号管理模块

#### 数据模型
```typescript
interface Account {
  id: string;
  name: string;
  description: string;
  platform: 'wechat';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  contentCount: number;
}
```

#### 核心功能
1. **账号CRUD操作**
   - 创建账号：POST /api/accounts
   - 获取账号列表：GET /api/accounts
   - 更新账号：PUT /api/accounts/:id
   - 删除账号：DELETE /api/accounts/:id

2. **账号状态管理**
   - 激活/停用账号
   - 账号内容统计
   - 账号切换功能

### 素材输入模块

#### 数据模型
```typescript
interface Material {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: 'text' | 'file';
  createdAt: Date;
  accountId: string;
}
```

#### 核心功能
1. **素材管理**
   - 文本素材输入和保存
   - 文件上传和解析
   - 素材分类和标签
   - 素材搜索和筛选

2. **素材处理**
   - 文本格式化
   - 内容预处理
   - 素材版本管理

### 选题整合模块

#### 数据模型
```typescript
interface Topic {
  id: string;
  title: string;
  description: string;
  materialId: string;
  prompt: string;
  status: 'pending' | 'selected' | 'discarded';
  createdAt: Date;
}
```

#### 核心功能
1. **AI选题生成**
   - 调用Gemini API分析素材
   - 生成多个选题建议
   - 选题质量评分

2. **选题管理**
   - 选题筛选和编辑
   - 自定义prompt模板
   - 选题历史记录

### 内容生成模块

#### 数据模型
```typescript
interface Content {
  id: string;
  title: string;
  body: string;
  topicId: string;
  accountId: string;
  status: 'draft' | 'generated' | 'reviewed' | 'published';
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 核心功能
1. **内容生成**
   - 基于选题生成文章
   - 风格和长度控制
   - 批量内容生成

2. **内容管理**
   - 内容编辑和优化
   - 内容版本控制
   - 内容导出功能

### 内容审查模块

#### 数据模型
```typescript
interface Review {
  id: string;
  contentId: string;
  quality: number;
  originality: number;
  suggestions: string[];
  status: 'pending' | 'passed' | 'failed';
  reviewedAt: Date;
}
```

#### 核心功能
1. **质量检查**
   - 语法和逻辑检查
   - 内容质量评分
   - 重复度检测

2. **审查管理**
   - 审查结果展示
   - 优化建议生成
   - 审查历史记录

## API设计

### 核心API端点

#### 账号管理
```typescript
POST   /api/accounts              // 创建账号
GET    /api/accounts              // 获取账号列表
GET    /api/accounts/:id          // 获取账号详情
PUT    /api/accounts/:id          // 更新账号
DELETE /api/accounts/:id          // 删除账号
POST   /api/accounts/:id/switch  // 切换当前账号
```

#### 素材管理
```typescript
POST   /api/materials             // 创建素材
GET    /api/materials             // 获取素材列表
GET    /api/materials/:id         // 获取素材详情
PUT    /api/materials/:id         // 更新素材
DELETE /api/materials/:id         // 删除素材
POST   /api/materials/upload      // 上传文件素材
```

#### 选题管理
```typescript
POST   /api/topics/generate       // 生成选题
GET    /api/topics                // 获取选题列表
PUT    /api/topics/:id/select     // 选择选题
POST   /api/topics/:id/regenerate // 重新生成选题
```

#### 内容管理
```typescript
POST   /api/content/generate      // 生成内容
GET    /api/content               // 获取内容列表
GET    /api/content/:id           // 获取内容详情
PUT    /api/content/:id           // 更新内容
POST   /api/content/:id/review    // 审查内容
```

## 风险评估和缓解措施

### 技术风险
1. **API依赖风险**
   - 风险：Google Gemini API不可用
   - 缓解：实现API重试机制和降级策略

2. **数据存储风险**
   - 风险：本地数据丢失
   - 缓解：实现数据备份和恢复功能

### 业务风险
1. **内容质量风险**
   - 风险：AI生成内容质量不达标
   - 缓解：完善内容审查机制和人工审核流程

2. **用户体验风险**
   - 风险：界面复杂难用
   - 缓解：进行用户测试和迭代优化

## 成功标准

### 技术指标
- [ ] 所有核心功能正常运行
- [ ] API响应时间 < 30秒
- [ ] 系统稳定性 > 99%
- [ ] 代码测试覆盖率 > 80%

### 业务指标
- [ ] 支持创建10个账号
- [ ] 完整的三步工作流程
- [ ] 自定义prompt功能
- [ ] 内容审查通过率 > 85%

## 下一步行动

1. **立即开始**: 项目初始化和基础架构搭建
2. **并行开发**: 前端界面和后端API同时进行
3. **持续测试**: 每个模块完成后立即进行测试
4. **用户反馈**: 定期收集用户反馈并迭代优化

## 资源需求

### 开发资源
- **前端开发**: 1人
- **后端开发**: 1人
- **测试**: 1人
- **设计**: 1人

### 技术资源
- **开发环境**: Node.js, Git, VS Code
- **API密钥**: Google Gemini API
- **部署环境**: 本地部署

### 时间资源
- **总开发周期**: 12周
- **每周开发时间**: 40小时
- **测试和优化**: 2周

## Tasks Created

### 基础架构任务 (001-005)
- [ ] 001.md - 项目初始化和环境搭建 (parallel: false)
- [ ] 002.md - 前端项目架构设置 (parallel: true, depends_on: [001])
- [ ] 003.md - 后端服务架构设置 (parallel: true, depends_on: [001])
- [ ] 004.md - 数据库设计和初始化 (parallel: true, depends_on: [001])
- [ ] 005.md - 开发环境配置和文档 (parallel: false, depends_on: [002, 003, 004])

### 前端功能任务 (006-010)
- [ ] 006.md - 账号管理前端界面 (parallel: true, depends_on: [002, 011])
- [ ] 007.md - 素材管理前端组件 (parallel: true, depends_on: [002, 012])
- [ ] 008.md - 选题整合前端界面 (parallel: true, depends_on: [002, 013])
- [ ] 009.md - 内容生成前端界面 (parallel: true, depends_on: [002, 014])
- [ ] 010.md - 内容审查前端界面 (parallel: true, depends_on: [002, 015])

### 后端API任务 (011-015)
- [ ] 011.md - 账号管理API开发 (parallel: true, depends_on: [003, 004])
- [ ] 012.md - 素材管理API开发 (parallel: true, depends_on: [003, 004])
- [ ] 013.md - 选题整合API开发 (parallel: true, depends_on: [003, 004, 016])
- [ ] 014.md - 内容生成API开发 (parallel: true, depends_on: [003, 004, 016])
- [ ] 015.md - 内容审查API开发 (parallel: true, depends_on: [003, 004, 016])

### AI集成和测试任务 (016-020)
- [ ] 016.md - Google Gemini API集成 (parallel: false, depends_on: [003])
- [ ] 017.md - AI服务封装和优化 (parallel: false, depends_on: [016])
- [ ] 018.md - 单元测试和集成测试 (parallel: true, depends_on: [006, 007, 008, 009, 010, 011, 012, 013, 014, 015])
- [ ] 019.md - 端到端测试和用户验收测试 (parallel: false, depends_on: [018])
- [ ] 020.md - 性能优化和安全检查 (parallel: true, depends_on: [017, 018])

**任务统计:**
- 总任务数: 20
- 并行任务: 15
- 顺序任务: 5
- 预估总工作量: 745小时
- 预估开发周期: 12-14周