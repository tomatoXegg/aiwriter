# 内容生成API文档

## 概述

内容生成API提供了基于AI的智能内容生成功能，支持从选题生成内容、自定义内容生成、批量生成、内容优化和版本管理等功能。

## 认证

所有API请求都需要在请求头中包含有效的认证令牌：
```
Authorization: Bearer <your-token>
```

## 基础URL

```
http://localhost:8000/api/content
```

## API端点

### 1. 内容生成

#### 1.1 基于选题生成内容

**POST** `/generate`

根据现有选题生成内容。

**请求体：**
```json
{
  "topicId": "string",
  "prompt": "string (可选)",
  "style": {
    "tone": "formal|casual|professional|creative",
    "length": "short|medium|long",
    "format": "article|blog|report|story"
  },
  "accountId": "string (可选)"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "generationId": "string",
    "status": "processing",
    "estimatedTime": 60
  },
  "message": "内容生成任务已启动"
}
```

#### 1.2 自定义内容生成

**POST** `/generate/custom`

根据自定义标题和提示生成内容。

**请求体：**
```json
{
  "title": "string",
  "prompt": "string",
  "style": {
    "tone": "formal|casual|professional|creative",
    "length": "short|medium|long",
    "format": "article|blog|report|story"
  },
  "accountId": "string (可选)"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "generationId": "string",
    "status": "processing",
    "estimatedTime": 60
  },
  "message": "自定义内容生成任务已启动"
}
```

#### 1.3 获取生成结果

**GET** `/generations/:id`

获取内容生成任务的结果。

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "pending|processing|completed|failed",
    "result": {
      "id": "string",
      "title": "string",
      "body": "string",
      "status": "generated",
      "word_count": 1500,
      "style": {
        "tone": "professional",
        "length": "medium",
        "format": "article"
      },
      "metadata": {
        "wordCount": 1500,
        "readTime": 8,
        "language": "zh-CN",
        "tags": ["AI", "内容生成"],
        "category": "技术"
      }
    },
    "error": "string (可选)",
    "progress": 100,
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:01:00Z"
  },
  "message": "获取生成结果成功"
}
```

### 2. 批量生成

#### 2.1 创建批量生成任务

**POST** `/generate/batch`

创建批量内容生成任务。

**请求体：**
```json
{
  "name": "string",
  "topicIds": ["string"],
  "prompt": "string (可选)",
  "style": {
    "tone": "formal|casual|professional|creative",
    "length": "short|medium|long",
    "format": "article|blog|report|story"
  },
  "accountId": "string (可选)"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "batchId": "string",
    "status": "pending",
    "taskCount": 5,
    "estimatedTime": 300
  },
  "message": "批量内容生成任务已启动"
}
```

#### 2.2 获取批量生成结果

**GET** `/batch/:id`

获取批量生成任务的结果。

**响应：**
```json
{
  "success": true,
  "data": {
    "batchId": "string",
    "status": "pending|processing|completed|failed",
    "taskCount": 5,
    "completedTasks": 3,
    "results": [
      {
        "id": "string",
        "status": "completed",
        "result": {...},
        "progress": 100,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:05:00Z"
  },
  "message": "获取批量生成结果成功"
}
```

#### 2.3 获取批量生成进度

**GET** `/batch/:id/progress`

获取批量生成任务的进度。

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "completed": 3,
    "failed": 1,
    "processing": 1,
    "pending": 0,
    "progress": 80
  },
  "message": "获取批量生成进度成功"
}
```

#### 2.4 取消批量生成任务

**POST** `/batch/:id/cancel`

取消批量生成任务。

**响应：**
```json
{
  "success": true,
  "message": "批量生成任务已取消"
}
```

### 3. 内容管理

#### 3.1 获取内容列表

**GET** `/`

获取内容列表，支持分页和筛选。

**查询参数：**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `status`: 状态筛选
- `accountId`: 账号筛选
- `topicId`: 选题筛选
- `search`: 搜索关键词
- `sortBy`: 排序字段
- `sortOrder`: 排序方向 (ASC|DESC)

**响应：**
```json
{
  "success": true,
  "data": {
    "contents": [
      {
        "id": "string",
        "title": "string",
        "body": "string",
        "status": "draft|generated|published",
        "word_count": 1500,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "filters": {
      "status": "generated"
    }
  },
  "message": "获取内容列表成功"
}
```

#### 3.2 获取内容详情

**GET** `/:id`

获取指定内容的详细信息。

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "body": "string",
    "topic_id": "string",
    "account_id": "string",
    "status": "draft|generated|published",
    "prompt": "string",
    "word_count": 1500,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:01:00Z"
  },
  "message": "获取内容详情成功"
}
```

#### 3.3 更新内容

**PUT** `/:id`

更新内容信息。

**请求体：**
```json
{
  "title": "string",
  "body": "string",
  "topicId": "string",
  "accountId": "string",
  "status": "draft|generated|published",
  "prompt": "string"
}
```

#### 3.4 删除内容

**DELETE** `/:id`

删除指定内容。

### 4. 内容优化

#### 4.1 优化内容

**POST** `/:id/optimize`

对内容进行优化分析。

**请求体：**
```json
{
  "type": "readability|grammar|style|structure",
  "content": "string"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "contentId": "string",
    "suggestions": {
      "readability": {
        "score": 8,
        "issues": ["段落过长"],
        "improvements": ["建议添加小标题"]
      },
      "grammar": {
        "score": 9,
        "issues": [],
        "corrections": []
      },
      "style": {
        "score": 7,
        "suggestions": ["语言表达可以更加生动"]
      },
      "structure": {
        "score": 8,
        "recommendations": ["结构清晰，逻辑连贯"]
      }
    }
  },
  "message": "内容优化完成"
}
```

#### 4.2 生成内容摘要

**POST** `/:id/summary`

生成内容摘要。

**响应：**
```json
{
  "success": true,
  "data": {
    "summary": "这是一篇关于AI内容生成的文章...",
    "keyPoints": ["AI提高内容生成效率", "降低创作成本"],
    "wordCount": 1500,
    "readTime": 8
  },
  "message": "生成内容摘要成功"
}
```

#### 4.3 提取内容标签

**POST** `/:id/tags`

提取内容关键词标签。

**响应：**
```json
{
  "success": true,
  "data": {
    "tags": ["AI", "内容生成", "自动化", "效率"]
  },
  "message": "提取内容标签成功"
}
```

### 5. 版本管理

#### 5.1 创建版本

**POST** `/:id/versions`

为内容创建新版本。

**请求体：**
```json
{
  "title": "string",
  "body": "string",
  "changeLog": "string"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "version": {
      "id": "string",
      "contentId": "string",
      "version": 2,
      "title": "string",
      "body": "string",
      "changeLog": "string",
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": "string"
    },
    "currentVersion": 2
  },
  "message": "创建内容版本成功"
}
```

#### 5.2 获取版本列表

**GET** `/:id/versions`

获取内容的所有版本。

#### 5.3 获取指定版本

**GET** `/:id/versions/:version`

获取指定版本的内容。

#### 5.4 版本比较

**GET** `/:id/versions/compare?version1=1&version2=2`

比较两个版本的差异。

#### 5.5 版本回滚

**POST** `/:id/versions/:version/rollback`

回滚到指定版本。

**请求体：**
```json
{
  "reason": "string"
}
```

### 6. 统计信息

#### 6.1 内容统计

**GET** `/stats/content`

获取内容统计信息。

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": {
      "draft": 20,
      "generated": 50,
      "published": 30
    },
    "byAccount": {
      "account1": 25,
      "account2": 15
    },
    "totalWords": 150000,
    "averageWords": 1500
  },
  "message": "获取内容统计成功"
}
```

#### 6.2 生成统计

**GET** `/stats/generation`

获取内容生成统计信息。

#### 6.3 批量生成统计

**GET** `/stats/batch`

获取批量生成统计信息。

## 错误处理

所有API在发生错误时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述",
  "message": "用户友好的错误消息"
}
```

## 状态码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用示例

### 基本内容生成

```javascript
// 生成内容
const response = await fetch('/api/content/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    topicId: 'topic-123',
    style: {
      tone: 'professional',
      length: 'medium',
      format: 'article'
    }
  })
});

const result = await response.json();
const generationId = result.data.generationId;

// 轮询获取结果
const checkResult = async () => {
  const response = await fetch(`/api/content/generations/${generationId}`, {
    headers: {
      'Authorization': 'Bearer your-token'
    }
  });
  const result = await response.json();
  
  if (result.data.status === 'completed') {
    console.log('生成完成:', result.data.result);
  } else if (result.data.status === 'failed') {
    console.error('生成失败:', result.data.error);
  } else {
    setTimeout(checkResult, 2000);
  }
};

checkResult();
```

### 批量生成

```javascript
// 创建批量生成任务
const response = await fetch('/api/content/generate/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    name: '技术文章批量生成',
    topicIds: ['topic-1', 'topic-2', 'topic-3'],
    style: {
      tone: 'professional',
      length: 'medium',
      format: 'article'
    }
  })
});

const result = await response.json();
const batchId = result.data.batchId;

// 监控进度
const monitorProgress = async () => {
  const response = await fetch(`/api/content/batch/${batchId}/progress`, {
    headers: {
      'Authorization': 'Bearer your-token'
    }
  });
  const result = await response.json();
  
  console.log(`进度: ${result.data.progress}%`);
  
  if (result.data.progress < 100) {
    setTimeout(monitorProgress, 5000);
  } else {
    console.log('批量生成完成');
  }
};

monitorProgress();
```

## 注意事项

1. **异步处理**: 内容生成是异步过程，需要通过轮询获取结果
2. **API限制**: 请注意API调用频率限制
3. **内容质量**: 生成的内容质量取决于输入的选题和提示
4. **数据安全**: 所有内容数据都会安全存储，建议定期备份
5. **版本管理**: 建议在重要修改前创建版本备份

## 技术支持

如有问题或建议，请联系技术支持团队。