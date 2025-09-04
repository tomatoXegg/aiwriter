# Google Gemini API 集成文档

## 概述

本服务集成了 Google Gemini AI API，提供强大的 AI 内容生成功能。支持多种内容生成任务，包括选题生成、内容创作、优化、翻译等。

## 功能特性

### 1. 基础内容生成
- **端点**: `POST /api/gemini/generate`
- **描述**: 根据提示词生成内容
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  prompt: string;        // 提示词（最多 10,000 字符）
  model?: string;       // 模型名称（默认：gemini-pro）
  temperature?: number; // 创造性（0-1，默认：0.7）
  maxTokens?: number;   // 最大令牌数
  useCache?: boolean;   // 是否使用缓存（默认：true）
}
```

### 2. 选题生成
- **端点**: `POST /api/gemini/topics`
- **描述**: 基于素材生成文章选题
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  material: string;     // 素材内容（最多 5,000 字符）
  count?: number;       // 生成数量（默认：5）
  style?: string;       // 写作风格（默认：专业科普）
  model?: string;       // 模型名称
}
```

### 3. 内容优化
- **端点**: `POST /api/gemini/optimize`
- **描述**: 优化现有内容
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;            // 要优化的内容
  focus?: 'readability' | 'style' | 'structure' | 'seo'; // 优化重点
  targetAudience?: string;    // 目标读者
  model?: string;             // 模型名称
}
```

### 4. 内容摘要
- **端点**: `POST /api/gemini/summarize`
- **描述**: 生成内容摘要
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;        // 原始内容（最多 20,000 字符）
  length?: 'short' | 'medium' | 'long'; // 摘要长度
  style?: string;         // 摘要风格
  model?: string;         // 模型名称
}
```

### 5. 关键词提取
- **端点**: `POST /api/gemini/keywords`
- **描述**: 从内容中提取关键词
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;        // 内容文本（最多 20,000 字符）
  count?: number;         // 提取数量（默认：10）
  model?: string;         // 模型名称
}
```

### 6. 多轮对话
- **端点**: `POST /api/gemini/chat`
- **描述**: 支持多轮对话交互
- **限流**: 每分钟 50 次请求

```typescript
Request: {
  messages: Array<{       // 消息历史
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: string;       // 对话上下文
  conversationId?: string; // 对话ID
  model?: string;         // 模型名称
}
```

### 7. 风格转换
- **端点**: `POST /api/gemini/style`
- **描述**: 转换内容风格
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;        // 原始内容
  targetStyle: string;    // 目标风格
  model?: string;         // 模型名称
}
```

### 8. 内容扩展
- **端点**: `POST /api/gemini/expand`
- **描述**: 扩展内容细节
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;              // 原始内容
  expansionPoints?: string[];    // 扩展要点
  model?: string;               // 模型名称
}
```

### 9. 内容改写
- **端点**: `POST /api/gemini/rewrite`
- **描述**: 改写内容
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;        // 原始内容
  rewriteType: 'simplify' | 'professional' | 'casual' | 'formal' | 'creative'; // 改写类型
  model?: string;         // 模型名称
}
```

### 10. 内容翻译
- **端点**: `POST /api/gemini/translate`
- **描述**: 翻译内容
- **限流**: 每分钟 20 次请求

```typescript
Request: {
  content: string;        // 要翻译的内容
  targetLanguage: string; // 目标语言
  sourceLanguage?: string; // 源语言（可选）
  model?: string;         // 模型名称
}
```

### 11. 获取对话历史
- **端点**: `GET /api/gemini/chat/:conversationId`
- **描述**: 获取指定对话的历史记录

### 12. API 统计
- **端点**: `GET /api/gemini/statistics`
- **描述**: 获取 API 使用统计

```typescript
Query Parameters:
  startDate?: string;     // 开始日期（YYYY-MM-DD）
  endDate?: string;       // 结束日期（YYYY-MM-DD）
```

### 13. 服务状态
- **端点**: `GET /api/gemini/status`
- **描述**: 获取 Gemini 服务状态

## 支持的模型

### Gemini Pro
- **模型ID**: `gemini-pro`
- **最大令牌**: 32,768
- **特性**: 文本生成、对话、选题、内容审查

### Gemini Pro Vision
- **模型ID**: `gemini-pro-vision`
- **最大令牌**: 16,384
- **特性**: 文本生成、图像理解

### Gemini 1.5 Pro
- **模型ID**: `gemini-1.5-pro`
- **最大令牌**: 2,097,152
- **特性**: 文本生成、对话、选题、内容审查、长上下文

### Gemini 1.5 Flash
- **模型ID**: `gemini-1.5-flash`
- **最大令牌**: 1,048,576
- **特性**: 文本生成、对话、快速生成

## 缓存策略

### 响应缓存
- **TTL**: 30 分钟
- **用途**: 缓存 AI 生成结果
- **键**: 基于提示词和选项生成

### 统计缓存
- **TTL**: 5 分钟
- **用途**: 缓存统计查询结果
- **键**: 基于查询参数生成

## 错误处理

### 错误类型
- `GEMINI_NOT_CONFIGURED`: Gemini API 未配置
- `RATE_LIMITED`: 请求频率超限
- `QUOTA_EXCEEDED`: API 配额超限
- `REQUEST_TOO_LARGE`: 请求体过大
- `PARSE_ERROR`: 响应解析失败

### 重试机制
- **最大重试次数**: 3 次
- **重试延迟**: 指数退避（1s, 2s, 4s）
- **不重试的错误**: 认证错误、无效请求

## 使用示例

### 生成内容
```javascript
const response = await fetch('/api/gemini/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    prompt: '写一篇关于人工智能发展史的文章',
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 1000
  })
});

const data = await response.json();
console.log(data.data.content);
```

### 生成选题
```javascript
const response = await fetch('/api/gemini/topics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    material: '人工智能技术正在改变各行各业...',
    count: 5,
    style: '科普'
  })
});

const data = await response.json();
console.log(data.data.topics);
```

## 环境变量配置

```bash
# Gemini API 配置
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-pro
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_TIMEOUT=30000
GEMINI_MAX_RETRIES=3

# 限流配置
GEMINI_RATE_LIMIT_REQUESTS=60
GEMINI_RATE_LIMIT_WINDOW=60000
```

## 最佳实践

1. **使用合适的模型**
   - 简单任务使用 `gemini-1.5-flash`（更快、更便宜）
   - 复杂任务使用 `gemini-1.5-pro`（更强、更贵）

2. **控制令牌数量**
   - 根据需求设置合理的 `maxTokens`
   - 避免不必要的长文本生成

3. **利用缓存**
   - 相同的请求会自动缓存
   - 对于静态内容，缓存可以显著提高性能

4. **错误处理**
   - 实现适当的错误重试逻辑
   - 处理限流和配额超限情况

5. **成本控制**
   - 监控 API 使用统计
   - 设置使用限制和提醒

## 注意事项

1. **API 配额**: Google Gemini API 有使用限制和配额
2. **内容安全**: 所有生成的内容都经过安全过滤
3. **延迟**: 首次请求可能较慢，后续请求会更快
4. **隐私**: 不要在提示词中包含敏感信息