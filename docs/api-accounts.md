# 账号管理 API 文档

## 概述

账号管理 API 提供了完整的账号 CRUD 操作、状态管理和统计查询功能。所有 API 都遵循 RESTful 设计原则，使用 JSON 格式进行数据交换。

## 基础信息

- **基础URL**: `/api/accounts`
- **认证**: Bearer Token (待实现)
- **响应格式**: JSON
- **错误处理**: 统一错误响应格式

## 数据模型

### Account

```typescript
interface Account {
  id: string;           // 账号唯一标识
  name: string;         // 账号名称
  description?: string;  // 账号描述
  platform: string;     // 平台类型 (wechat | weibo | zhihu | other)
  status: string;       // 账号状态 (active | inactive | suspended)
  content_count: number; // 内容数量
  created_at: string;   // 创建时间
}
```

### 分页响应

```typescript
interface PaginatedResponse<T> {
  accounts: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 统一响应格式

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## API 端点

### 1. 创建账号

**POST** `/api/accounts`

创建新的账号。

**请求体**:
```json
{
  "name": "我的公众号",
  "description": "这是一个技术分享公众号",
  "platform": "wechat"
}
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "我的公众号",
    "description": "这是一个技术分享公众号",
    "platform": "wechat",
    "status": "active",
    "content_count": 0,
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "Account created successfully"
}
```

**错误响应** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed: name is required"
}
```

### 2. 获取账号列表

**GET** `/api/accounts`

获取账号列表，支持分页、过滤和搜索。

**查询参数**:
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10
- `status` (可选): 状态过滤 (active | inactive | suspended)
- `platform` (可选): 平台过滤 (wechat | weibo | zhihu | other)
- `search` (可选): 搜索关键词

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid-string",
        "name": "我的公众号",
        "description": "这是一个技术分享公众号",
        "platform": "wechat",
        "status": "active",
        "content_count": 5,
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "message": "Accounts retrieved successfully"
}
```

### 3. 获取账号详情

**GET** `/api/accounts/:id`

获取指定账号的详细信息。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "我的公众号",
    "description": "这是一个技术分享公众号",
    "platform": "wechat",
    "status": "active",
    "content_count": 5,
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "Account retrieved successfully"
}
```

**错误响应** (404 Not Found):
```json
{
  "success": false,
  "error": "Account not found"
}
```

### 4. 更新账号

**PUT** `/api/accounts/:id`

更新账号信息。

**请求体**:
```json
{
  "name": "更新后的公众号名称",
  "description": "更新后的描述",
  "status": "inactive"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "更新后的公众号名称",
    "description": "更新后的描述",
    "platform": "wechat",
    "status": "inactive",
    "content_count": 5,
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "Account updated successfully"
}
```

### 5. 删除账号

**DELETE** `/api/accounts/:id`

删除指定账号。

**响应** (204 No Content):
```json
(无响应体)
```

### 6. 激活账号

**POST** `/api/accounts/:id/activate`

激活指定账号。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "我的公众号",
    "status": "active",
    // ... 其他字段
  },
  "message": "Account activated successfully"
}
```

### 7. 停用账号

**POST** `/api/accounts/:id/deactivate`

停用指定账号。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "我的公众号",
    "status": "inactive",
    // ... 其他字段
  },
  "message": "Account deactivated successfully"
}
```

### 8. 获取账号状态

**GET** `/api/accounts/:id/status`

获取指定账号的状态信息。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "我的公众号",
    "status": "active",
    "platform": "wechat",
    "contentCount": 5,
    "lastUpdated": "2023-01-01T00:00:00Z"
  },
  "message": "Account status retrieved successfully"
}
```

### 9. 批量更新状态

**PUT** `/api/accounts/status/bulk`

批量更新多个账号的状态。

**请求体**:
```json
{
  "accountIds": ["uuid-1", "uuid-2", "uuid-3"],
  "status": "inactive"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "successCount": 3,
    "failureCount": 0,
    "total": 3,
    "status": "inactive"
  },
  "message": "Bulk status update completed: 3 succeeded, 0 failed"
}
```

### 10. 获取账号统计

**GET** `/api/accounts/:id/stats`

获取指定账号的统计信息。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "accountId": "uuid-string",
    "accountName": "我的公众号",
    "totalContent": 5,
    "platform": "wechat",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00Z"
  },
  "message": "Account statistics retrieved successfully"
}
```

### 11. 获取所有账号统计

**GET** `/api/accounts/stats/overview`

获取所有账号的统计概览。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 10,
    "active": 7,
    "inactive": 3,
    "byPlatform": {
      "wechat": 6,
      "weibo": 3,
      "zhihu": 1
    }
  },
  "message": "Accounts statistics retrieved successfully"
}
```

### 12. 获取账号活跃度

**GET** `/api/accounts/activity`

获取账号活跃度统计。

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "activeAccounts": 7,
    "inactiveAccounts": 3,
    "recentActivity": [
      {
        "id": "uuid-string",
        "name": "活跃账号",
        "platform": "wechat",
        "status": "active",
        "content_count": 5,
        "last_activity": "2023-01-01T00:00:00Z"
      }
    ],
    "inactiveList": [
      {
        "id": "uuid-string",
        "name": "非活跃账号",
        "platform": "wechat",
        "status": "inactive",
        "content_count": 0,
        "created_at": "2023-01-01T00:00:00Z"
      }
    ]
  },
  "message": "Accounts activity retrieved successfully"
}
```

### 13. 获取账号创建趋势

**GET** `/api/accounts/trends`

获取账号创建趋势统计。

**查询参数**:
- `days` (可选): 统计天数，默认 30 天

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2023-01-01",
        "count": 2,
        "active_count": 2,
        "wechat_count": 1,
        "weibo_count": 1,
        "zhihu_count": 0
      }
    ],
    "period": {
      "start": "2023-01-01T00:00:00Z",
      "end": "2023-01-31T23:59:59Z",
      "days": 30
    }
  },
  "message": "Accounts trends retrieved successfully"
}
```

## 错误处理

所有 API 都使用统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误描述",
  "message": "可选的详细消息"
}
```

### 常见错误码

- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 验证规则

### 创建账号验证

- `name`: 必填，1-100 字符
- `description`: 可选，最多 500 字符
- `platform`: 可选，必须是有效的平台类型

### 更新账号验证

- `name`: 可选，1-100 字符
- `description`: 可选，最多 500 字符
- `platform`: 可选，必须是有效的平台类型
- `status`: 可选，必须是有效的状态类型

### 批量更新验证

- `accountIds`: 必填，非空数组
- `status`: 必填，必须是有效的状态类型

## 使用示例

### JavaScript (Fetch)

```javascript
// 创建账号
const createAccount = async () => {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: '我的公众号',
      description: '这是一个技术分享公众号',
      platform: 'wechat'
    })
  });
  
  const result = await response.json();
  console.log(result);
};

// 获取账号列表
const getAccounts = async () => {
  const response = await fetch('/api/accounts?page=1&limit=10&status=active');
  const result = await response.json();
  console.log(result);
};

// 更新账号
const updateAccount = async (id) => {
  const response = await fetch(`/api/accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: '更新后的名称',
      status: 'inactive'
    })
  });
  
  const result = await response.json();
  console.log(result);
};
```

### cURL

```bash
# 创建账号
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的公众号",
    "description": "这是一个技术分享公众号",
    "platform": "wechat"
  }'

# 获取账号列表
curl "http://localhost:3000/api/accounts?page=1&limit=10&status=active"

# 更新账号
curl -X PUT http://localhost:3000/api/accounts/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的名称",
    "status": "inactive"
  }'

# 删除账号
curl -X DELETE http://localhost:3000/api/accounts/{id}
```

## 测试

项目包含完整的测试套件，覆盖所有 API 端点：

```bash
# 运行测试
npm test

# 运行特定测试
npm test -- accounts.test.ts
```

测试覆盖以下场景：
- 正常流程测试
- 参数验证测试
- 错误处理测试
- 边界条件测试
- 分页和过滤测试

## 性能考虑

- 使用数据库索引优化查询性能
- 实现分页避免大量数据传输
- 使用异步处理提高并发性能
- 实现缓存机制（待实现）

## 安全考虑

- 输入数据验证
- SQL 注入防护
- 错误信息脱敏
- 认证和授权（待实现）

## 扩展计划

- 添加账号权限管理
- 实现账号数据备份和恢复
- 添加更多平台支持
- 实现账号数据同步功能