# API 文档

## 概述

AI Writer 提供完整的 RESTful API，支持账号管理、素材管理、选题生成、内容创作等功能。本文档详细描述了所有 API 端点的使用方法。

## 基础信息

- **基础 URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

### 获取访问令牌
所有需要认证的 API 都需要在请求头中包含 JWT token：

```http
Authorization: Bearer <your_jwt_token>
```

### Token 刷新
访问令牌有效期为 7 天，过期后可以使用刷新令牌获取新的访问令牌。

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "message": "操作失败"
}
```

## 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## API 端点

### 认证相关

#### 登录
```http
POST /auth/login
```

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": 1,
      "username": "string",
      "email": "string"
    }
  }
}
```

#### 登出
```http
POST /auth/logout
```

**请求头**:
```
Authorization: Bearer <token>
```

#### 刷新令牌
```http
POST /auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "refresh_token"
}
```

---

### 账号管理

#### 获取所有账号
```http
GET /accounts
```

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `status`: 账号状态 (可选: active, inactive)

**响应**:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 1,
        "name": "公众号名称",
        "platform": "微信公众号",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 创建账号
```http
POST /accounts
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "name": "公众号名称",
  "platform": "微信公众号",
  "description": "账号描述",
  "tags": ["科技", "教育"],
  "config": {
    "autoPublish": false,
    "publishTime": "09:00"
  }
}
```

#### 获取特定账号
```http
GET /accounts/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "公众号名称",
    "platform": "微信公众号",
    "description": "账号描述",
    "tags": ["科技", "教育"],
    "status": "active",
    "config": {
      "autoPublish": false,
      "publishTime": "09:00"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 更新账号
```http
PUT /accounts/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "name": "更新的公众号名称",
  "platform": "微信公众号",
  "description": "更新的描述",
  "tags": ["科技", "教育", "创新"],
  "status": "active",
  "config": {
    "autoPublish": true,
    "publishTime": "10:00"
  }
}
```

#### 删除账号
```http
DELETE /accounts/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

---

### 素材管理

#### 获取所有素材
```http
GET /materials
```

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `type`: 素材类型 (可选: text, file, link)
- `tags`: 标签过滤 (逗号分隔)
- `search`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": 1,
        "title": "素材标题",
        "content": "素材内容",
        "type": "text",
        "tags": ["科技", "AI"],
        "fileUrl": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 创建素材
```http
POST /materials
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体** (Form Data):
- `title`: 素材标题
- `content`: 素材内容
- `type`: 素材类型 (text, file, link)
- `tags`: 标签 (JSON 数组)
- `file`: 文件 (可选)

#### 搜索素材
```http
GET /materials/search
```

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `q`: 搜索关键词
- `type`: 素材类型 (可选)
- `tags`: 标签过滤 (可选)

#### 更新素材
```http
PUT /materials/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "更新的标题",
  "content": "更新的内容",
  "tags": ["更新的标签"]
}
```

#### 删除素材
```http
DELETE /materials/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

---

### 选题管理

#### 获取所有选题
```http
GET /topics
```

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `status`: 选题状态 (可选: draft, approved, rejected)
- `accountId`: 账号 ID 过滤

**响应**:
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": 1,
        "title": "选题标题",
        "description": "选题描述",
        "status": "draft",
        "materialIds": [1, 2, 3],
        "aiAnalysis": {
          "score": 85,
          "suggestions": ["建议1", "建议2"]
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 生成选题
```http
POST /topics/generate
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "materialIds": [1, 2, 3],
  "prompt": "自定义prompt模板",
  "options": {
    "count": 5,
    "style": "科技风格",
    "targetAudience": "技术人员"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "title": "AI 技术发展趋势分析",
        "description": "分析当前AI技术的发展趋势和未来展望",
        "score": 92,
        "suggestions": ["建议增加具体数据", "可以加入案例研究"]
      }
    ]
  }
}
```

#### 创建选题
```http
POST /topics
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "选题标题",
  "description": "选题描述",
  "materialIds": [1, 2, 3],
  "status": "draft",
  "aiAnalysis": {
    "score": 85,
    "suggestions": ["建议1", "建议2"]
  }
}
```

#### 更新选题
```http
PUT /topics/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "更新的标题",
  "description": "更新的描述",
  "status": "approved"
}
```

#### 删除选题
```http
DELETE /topics/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

---

### 内容管理

#### 获取所有内容
```http
GET /contents
```

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `status`: 内容状态 (可选: draft, published, archived)
- `topicId`: 选题 ID 过滤
- `accountId`: 账号 ID 过滤

**响应**:
```json
{
  "success": true,
  "data": {
    "contents": [
      {
        "id": 1,
        "title": "文章标题",
        "content": "文章内容",
        "status": "draft",
        "topicId": 1,
        "accountId": 1,
        "wordCount": 1500,
        "readTime": 8,
        "aiReview": {
          "score": 88,
          "issues": ["语法问题", "结构建议"],
          "suggestions": ["改进建议"]
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 生成内容
```http
POST /contents/generate
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "topicId": 1,
  "prompt": "自定义prompt模板",
  "options": {
    "wordCount": 1500,
    "style": "科技风格",
    "includeImages": true,
    "structure": "标准结构"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "content": {
      "title": "AI 技术发展趋势分析",
      "content": "完整的文章内容...",
      "wordCount": 1520,
      "readTime": 8,
      "sections": [
        {
          "title": "引言",
          "content": "引言内容..."
        },
        {
          "title": "发展趋势",
          "content": "趋势分析..."
        }
      ]
    }
  }
}
```

#### 创建内容
```http
POST /contents
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "文章标题",
  "content": "文章内容",
  "topicId": 1,
  "accountId": 1,
  "status": "draft"
}
```

#### 内容审查
```http
POST /contents/:id/review
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "prompt": "内容审查prompt模板",
  "options": {
    "checkGrammar": true,
    "checkStructure": true,
    "checkOriginality": true
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "review": {
      "score": 92,
      "issues": [],
      "suggestions": ["建议增加更多案例"],
      "originalityScore": 95,
      "readabilityScore": 88
    }
  }
}
```

#### 更新内容
```http
PUT /contents/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "更新的标题",
  "content": "更新的内容",
  "status": "published"
}
```

#### 删除内容
```http
DELETE /contents/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

---

### 健康检查

#### 服务健康状态
```http
GET /health
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "uptime": 86400,
    "database": "connected",
    "aiService": "available"
  }
}
```

#### API 信息
```http
GET /api
```

**响应**:
```json
{
  "success": true,
  "data": {
    "name": "AI Writer API",
    "version": "1.0.0",
    "description": "AI Writing Assistant API",
    "endpoints": {
      "auth": "/auth",
      "accounts": "/accounts",
      "materials": "/materials",
      "topics": "/topics",
      "contents": "/contents",
      "health": "/health"
    }
  }
}
```

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `UNAUTHORIZED` | 未授权 | 检查 token 是否有效 |
| `FORBIDDEN` | 禁止访问 | 检查用户权限 |
| `NOT_FOUND` | 资源不存在 | 检查资源 ID 是否正确 |
| `VALIDATION_ERROR` | 数据验证失败 | 检查请求数据格式 |
| `DUPLICATE_ENTRY` | 重复数据 | 检查数据是否已存在 |
| `AI_SERVICE_ERROR` | AI 服务错误 | 检查 AI API 配置 |
| `DATABASE_ERROR` | 数据库错误 | 检查数据库连接 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求数据验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

## 限流

### 限流规则
- **默认限制**: 每分钟 100 次请求
- **认证用户**: 每分钟 1000 次请求
- **AI 相关接口**: 每分钟 10 次请求

### 限流响应
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超过限制",
    "retryAfter": 60
  }
}
```

## 文件上传

### 支持的文件类型
- **文档**: .txt, .md, .doc, .docx, .pdf
- **图片**: .jpg, .jpeg, .png, .gif
- **音频**: .mp3, .wav
- **视频**: .mp4, .avi

### 文件大小限制
- **默认限制**: 10MB
- **图片**: 5MB
- **文档**: 10MB
- **音频**: 50MB
- **视频**: 100MB

## WebSocket 连接

### 实时状态更新
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理实时消息
};
```

### 消息类型
- `content_generated`: 内容生成完成
- `review_completed`: 内容审查完成
- `task_status`: 任务状态更新

---

## 总结

AI Writer API 提供了完整的 RESTful 接口，支持账号管理、素材管理、选题生成、内容创作等功能。所有接口都采用统一的认证方式和响应格式，便于客户端集成和使用。

如需更多帮助，请参考 [开发指南](./development.md) 或联系开发团队。