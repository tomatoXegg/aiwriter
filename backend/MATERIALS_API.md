# 素材管理API文档

## 概述

素材管理API提供了完整的素材管理功能，包括文本素材的创建、文件上传、分类标签管理、搜索筛选等功能。

## 认证

所有API请求都需要在Header中包含认证token：
```
Authorization: Bearer <your-token>
```

## 素材管理

### 创建文本素材

**POST** `/api/materials/text`

**请求体：**
```json
{
  "title": "人工智能发展趋势",
  "content": "人工智能技术正在快速发展...",
  "tags": ["AI", "技术", "趋势"],
  "category_id": "category-id-here"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "material-id-here",
    "title": "人工智能发展趋势",
    "content": "人工智能技术正在快速发展...",
    "tags": ["AI", "技术", "趋势"],
    "type": "text",
    "category_id": "category-id-here",
    "word_count": 15,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "文本素材创建成功"
}
```

### 获取素材列表

**GET** `/api/materials?page=1&limit=10&type=text&category_id=category-id&search=关键词&tags=AI,技术`

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `type`: 素材类型（text, file, link, image）
- `category_id`: 分类ID
- `search`: 搜索关键词
- `tags`: 标签（多个标签用逗号分隔）
- `sortBy`: 排序字段（created_at, updated_at, title, word_count）
- `sortOrder`: 排序方向（ASC, DESC）

**响应：**
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "material-id-1",
        "title": "素材标题",
        "content": "素材内容",
        "tags": ["标签1", "标签2"],
        "type": "text",
        "category_id": "category-id",
        "word_count": 100,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  },
  "message": "获取素材列表成功"
}
```

### 获取素材详情

**GET** `/api/materials/:id`

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "material-id",
    "title": "素材标题",
    "content": "素材内容",
    "tags": ["标签1", "标签2"],
    "type": "text",
    "category_id": "category-id",
    "word_count": 100,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "获取素材详情成功"
}
```

### 更新素材

**PUT** `/api/materials/:id`

**请求体：**
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "tags": ["新标签"],
  "category_id": "new-category-id"
}
```

### 删除素材

**DELETE** `/api/materials/:id`

**响应：** 204 No Content

## 文件上传

### 上传文件

**POST** `/api/materials/upload`

**Content-Type:** `multipart/form-data`

**表单数据：**
- `file`: 文件（必需）
- `title`: 标题（可选，默认使用文件名）
- `tags`: 标签（可选，JSON格式）
- `category_id`: 分类ID（可选）

**支持的文件类型：**
- 文本文件 (.txt)
- Markdown文件 (.md)
- JSON文件 (.json)
- PDF文件 (.pdf)
- Word文档 (.docx, .doc)

**响应：**
```json
{
  "success": true,
  "data": {
    "material": {
      "id": "material-id",
      "title": "上传的文件",
      "content": "解析后的文件内容",
      "tags": [],
      "type": "file",
      "file_path": "/path/to/uploaded/file",
      "file_size": 1024,
      "word_count": 50,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "fileInfo": {
      "originalName": "original-filename.txt",
      "filename": "uuid-filename.txt",
      "path": "/path/to/uploaded/file",
      "size": 1024,
      "mimetype": "text/plain",
      "extension": ".txt"
    },
    "parsedContent": {
      "text": "文件内容",
      "metadata": {
        "wordCount": 50,
        "characterCount": 300
      }
    }
  },
  "message": "文件上传成功"
}
```

## 搜索功能

### 搜索素材

**GET** `/api/materials/search?q=关键词&page=1&limit=10&category_id=category-id&tags=标签&type=text`

**查询参数：**
- `q`: 搜索关键词（必需）
- `page`: 页码
- `limit`: 每页数量
- `category_id`: 分类ID
- `tags`: 标签
- `type`: 素材类型

**响应：**
```json
{
  "success": true,
  "data": {
    "materials": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    },
    "searchQuery": "关键词"
  },
  "message": "搜索素材成功"
}
```

## 分类管理

### 创建分类

**POST** `/api/materials/categories`

**请求体：**
```json
{
  "name": "技术",
  "description": "技术相关素材",
  "color": "#3B82F6"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "category-id",
    "name": "技术",
    "description": "技术相关素材",
    "color": "#3B82F6",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "分类创建成功"
}
```

### 获取分类列表

**GET** `/api/materials/categories?page=1&limit=10&search=技术`

**响应：**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "category-id",
        "name": "技术",
        "description": "技术相关素材",
        "color": "#3B82F6",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  },
  "message": "获取分类列表成功"
}
```

### 更新分类

**PUT** `/api/materials/categories/:id`

**请求体：**
```json
{
  "name": "更新的分类名",
  "description": "更新的描述",
  "color": "#FF0000"
}
```

### 删除分类

**DELETE** `/api/materials/categories/:id`

**响应：** 204 No Content

## 标签管理

### 创建标签

**POST** `/api/materials/tags`

**请求体：**
```json
{
  "name": "AI",
  "color": "#10B981"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "tag-id",
    "name": "AI",
    "color": "#10B981",
    "usage_count": 0,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "标签创建成功"
}
```

### 获取标签列表

**GET** `/api/materials/tags?page=1&limit=10&search=AI&sortBy=usage_count&sortOrder=DESC`

**响应：**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "tag-id",
        "name": "AI",
        "color": "#10B981",
        "usage_count": 5,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10,
      "totalPages": 1
    }
  },
  "message": "获取标签列表成功"
}
```

### 获取热门标签

**GET** `/api/materials/tags/popular?limit=10`

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-id",
      "name": "AI",
      "color": "#10B981",
      "usage_count": 15,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取热门标签成功"
}
```

### 更新标签

**PUT** `/api/materials/tags/:id`

**请求体：**
```json
{
  "name": "更新的标签名",
  "color": "#FF0000"
}
```

### 删除标签

**DELETE** `/api/materials/tags/:id`

**响应：** 204 No Content

## 统计信息

### 获取素材统计

**GET** `/api/materials/stats/materials`

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "byType": {
      "text": 60,
      "file": 30,
      "link": 10
    },
    "byCategory": [
      {
        "category": "技术",
        "count": 40
      }
    ],
    "byAccount": {
      "account-id": 50,
      "unassigned": 50
    },
    "averageWordCount": 250,
    "totalWordCount": 25000,
    "recentActivity": [
      {
        "date": "2024-01-01",
        "count": 5
      }
    ]
  },
  "message": "获取素材统计信息成功"
}
```

### 获取分类统计

**GET** `/api/materials/stats/categories`

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "withMaterials": 8,
    "topCategories": [
      {
        "category": {
          "id": "category-id",
          "name": "技术",
          "description": "技术相关素材",
          "color": "#3B82F6",
          "created_at": "2024-01-01T00:00:00.000Z"
        },
        "materialCount": 25
      }
    ]
  },
  "message": "获取分类统计信息成功"
}
```

### 获取标签统计

**GET** `/api/materials/stats/tags`

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 20,
    "totalUsage": 150,
    "averageUsage": 7.5,
    "mostPopular": {
      "id": "tag-id",
      "name": "AI",
      "color": "#10B981",
      "usage_count": 15,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "获取标签统计信息成功"
}
```

## 错误处理

所有API返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见错误码：
- 400: 请求参数错误
- 401: 认证失败
- 404: 资源不存在
- 500: 服务器内部错误

## 文件大小限制

- 默认最大文件大小：50MB
- 支持的文件类型：txt, md, json, pdf, docx, doc
- 文件上传后会被解析并提取文本内容