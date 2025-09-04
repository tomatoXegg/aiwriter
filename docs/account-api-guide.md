# 账号管理API使用指南

## 快速开始

### 1. 环境准备

确保你已经安装了Node.js和npm：

```bash
node --version
npm --version
```

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database.sqlite
```

### 4. 初始化数据库

```bash
npm run db:init
npm run db:up
```

### 5. 运行测试数据种子

```bash
node seed-accounts.js
```

### 6. 启动服务器

```bash
# 开发模式
npm run dev

# 或者使用演示服务器
node demo-server.js
```

服务器将在 `http://localhost:3000` 启动。

## API使用示例

### 基础CRUD操作

#### 1. 创建账号

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的公众号",
    "description": "这是一个技术分享公众号",
    "platform": "wechat"
  }'
```

#### 2. 获取账号列表

```bash
curl "http://localhost:3000/api/accounts?page=1&limit=10&status=active"
```

#### 3. 获取账号详情

```bash
curl "http://localhost:3000/api/accounts/{account-id}"
```

#### 4. 更新账号

```bash
curl -X PUT http://localhost:3000/api/accounts/{account-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的名称",
    "description": "更新后的描述",
    "status": "inactive"
  }'
```

#### 5. 删除账号

```bash
curl -X DELETE http://localhost:3000/api/accounts/{account-id}
```

### 状态管理

#### 1. 激活账号

```bash
curl -X POST http://localhost:3000/api/accounts/{account-id}/activate
```

#### 2. 停用账号

```bash
curl -X POST http://localhost:3000/api/accounts/{account-id}/deactivate
```

#### 3. 获取账号状态

```bash
curl "http://localhost:3000/api/accounts/{account-id}/status"
```

#### 4. 批量状态更新

```bash
curl -X PUT http://localhost:3000/api/accounts/status/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "accountIds": ["id1", "id2", "id3"],
    "status": "inactive"
  }'
```

### 统计查询

#### 1. 获取账号统计

```bash
curl "http://localhost:3000/api/accounts/{account-id}/stats"
```

#### 2. 获取所有账号统计

```bash
curl "http://localhost:3000/api/accounts/stats/overview"
```

#### 3. 获取账号活跃度

```bash
curl "http://localhost:3000/api/accounts/activity"
```

#### 4. 获取账号趋势

```bash
curl "http://localhost:3000/api/accounts/trends?days=30"
```

## JavaScript/TypeScript 使用示例

### 1. 基础设置

```typescript
interface Account {
  id: string;
  name: string;
  description?: string;
  platform: 'wechat' | 'weibo' | 'zhihu' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  content_count: number;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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

### 2. API 客户端类

```typescript
class AccountAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 创建账号
  async createAccount(data: {
    name: string;
    description?: string;
    platform?: string;
  }): Promise<ApiResponse<Account>> {
    return this.request<ApiResponse<Account>>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 获取账号列表
  async getAccounts(params: {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
    search?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Account>>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<ApiResponse<PaginatedResponse<Account>>>(
      `/accounts?${queryParams.toString()}`
    );
  }

  // 获取账号详情
  async getAccount(id: string): Promise<ApiResponse<Account>> {
    return this.request<ApiResponse<Account>>(`/accounts/${id}`);
  }

  // 更新账号
  async updateAccount(id: string, data: Partial<Account>): Promise<ApiResponse<Account>> {
    return this.request<ApiResponse<Account>>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 删除账号
  async deleteAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // 激活账号
  async activateAccount(id: string): Promise<ApiResponse<Account>> {
    return this.request<ApiResponse<Account>>(`/accounts/${id}/activate`, {
      method: 'POST',
    });
  }

  // 停用账号
  async deactivateAccount(id: string): Promise<ApiResponse<Account>> {
    return this.request<ApiResponse<Account>>(`/accounts/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // 获取账号统计
  async getAccountStats(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/accounts/${id}/stats`);
  }

  // 获取所有账号统计
  async getAllAccountsStats(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/accounts/stats/overview');
  }
}
```

### 3. 使用示例

```typescript
async function exampleUsage() {
  const api = new AccountAPI();

  try {
    // 创建账号
    const newAccount = await api.createAccount({
      name: '技术分享号',
      description: '分享最新技术趋势',
      platform: 'wechat',
    });
    console.log('创建账号:', newAccount);

    // 获取账号列表
    const accounts = await api.getAccounts({
      page: 1,
      limit: 10,
      status: 'active',
    });
    console.log('账号列表:', accounts);

    // 更新账号
    const updated = await api.updateAccount(newAccount.data!.id, {
      name: '更新后的名称',
      status: 'inactive',
    });
    console.log('更新账号:', updated);

    // 获取统计信息
    const stats = await api.getAccountStats(newAccount.data!.id);
    console.log('账号统计:', stats);

    // 删除账号
    await api.deleteAccount(newAccount.data!.id);
    console.log('账号已删除');
  } catch (error) {
    console.error('API调用失败:', error);
  }
}

// 运行示例
exampleUsage();
```

## React Hook 示例

```typescript
import { useState, useEffect } from 'react';

interface UseAccountAPIReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  createAccount: (data: any) => Promise<void>;
  updateAccount: (id: string, data: any) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAccountAPI(): UseAccountAPIReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = new AccountAPI();

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAccounts();
      setAccounts(response.data?.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.createAccount(data);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.updateAccount(id, data);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteAccount(id);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refresh: fetchAccounts,
  };
}
```

## 错误处理

### 1. 网络错误

```typescript
try {
  const result = await api.createAccount(data);
} catch (error) {
  if (error instanceof TypeError) {
    // 网络错误
    console.error('Network error:', error);
  } else {
    // 其他错误
    console.error('API error:', error);
  }
}
```

### 2. API错误响应

```typescript
const result = await api.createAccount(data);
if (!result.success) {
  // API返回错误
  console.error('API Error:', result.error);
  // 显示用户友好的错误消息
  showErrorToUser(result.error || '操作失败');
}
```

### 3. 验证错误

```typescript
try {
  const result = await api.createAccount({
    name: '', // 空名称会触发验证错误
    platform: 'invalid_platform', // 无效平台
  });
} catch (error) {
  if (error.message.includes('400')) {
    // 验证错误
    console.error('Validation error:', error);
  }
}
```

## 性能优化

### 1. 分页加载

```typescript
async function loadAccountsPage(page: number, limit: number = 10) {
  return await api.getAccounts({ page, limit });
}
```

### 2. 缓存机制

```typescript
const cache = new Map();

async function getCachedAccounts(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await api.getAccounts();
  cache.set(key, result);
  
  // 5分钟后清除缓存
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return result;
}
```

### 3. 批量操作

```typescript
async function bulkUpdateStatus(accountIds: string[], status: string) {
  return await fetch('/api/accounts/status/bulk', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountIds, status }),
  });
}
```

## 测试

### 1. 运行测试

```bash
# 运行完整测试套件
npm test

# 运行API测试
node test-api.js
```

### 2. 测试覆盖率

```bash
npm run test:coverage
```

## 部署

### 1. 生产环境配置

```env
NODE_ENV=production
PORT=3000
DB_PATH=/var/lib/aiwriter/database.sqlite
```

### 2. 构建和启动

```bash
npm run build
npm start
```

### 3. 使用PM2管理进程

```bash
npm install -g pm2
pm2 start dist/index.js --name "aiwriter-backend"
pm2 monit
```

## 常见问题

### 1. 数据库连接失败

确保数据库文件路径正确，且有写入权限：

```bash
# 检查数据库路径
ls -la /path/to/database.sqlite

# 重新初始化数据库
npm run db:init
```

### 2. 端口占用

```bash
# 检查端口占用
lsof -i :3000

# 更改端口
PORT=3001 npm run dev
```

### 3. 权限问题

```bash
# 确保有文件写入权限
chmod 755 /path/to/database/directory
```

## 更多资源

- [完整API文档](./api-accounts.md)
- [项目README](../README.md)
- [贡献指南](../CONTRIBUTING.md)

如需更多帮助，请查看相关文档或提交Issue。