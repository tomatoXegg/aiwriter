# 编码规范

## 概述

本文档定义了 AI Writer 项目的编码规范，确保代码质量、一致性和可维护性。所有开发者都应该遵循这些规范。

## 通用规范

### 1. 文件命名

#### 基本原则
- 使用小写字母和连字符（kebab-case）
- 文件名应该清晰表达其用途
- 组件文件使用 PascalCase

#### 文件命名示例
```
# 通用文件
user-service.ts
api-client.js
config.json
.env.example

# React 组件
UserProfile.tsx
LoginForm.tsx
Button.tsx

# 测试文件
user-service.test.ts
UserProfile.test.tsx
integration.test.ts

# 样式文件
styles.css
button.module.css
theme.scss

# 配置文件
eslint.config.js
prettier.config.js
tsconfig.json
```

### 2. 代码结构

#### 文件组织
```typescript
// 1. 导入语句
// 第三方库导入
import React from 'react';
import { useState } from 'react';
import axios from 'axios';

// 项目内部导入
import { Button } from '@/components/common';
import { useAuth } from '@/hooks';
import { formatDate } from '@/utils/date';

// 2. 类型定义
interface UserProps {
  id: number;
  name: string;
  email: string;
}

// 3. 常量定义
const MAX_RETRIES = 3;
const API_BASE_URL = process.env.API_BASE_URL;

// 4. 主组件/函数
const UserProfile: React.FC<UserProps> = ({ id, name, email }) => {
  // 5. 状态管理
  const [loading, setLoading] = useState(false);
  
  // 6. 事件处理函数
  const handleClick = () => {
    // 处理逻辑
  };

  // 7. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, []);

  // 8. 计算属性
  const formattedName = useMemo(() => {
    return name.trim();
  }, [name]);

  // 9. 渲染函数
  return (
    <div className="user-profile">
      <h2>{formattedName}</h2>
      <p>{email}</p>
      <Button onClick={handleClick}>Edit</Button>
    </div>
  );
};

// 10. 导出语句
export default UserProfile;
```

### 3. 注释规范

#### JSDoc 注释
```typescript
/**
 * 用户服务类
 * @class UserService
 * @description 处理用户相关的业务逻辑
 */
export class UserService {
  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<User>} 用户信息
   * @throws {Error} 当用户不存在时抛出错误
   */
  async getUserById(userId: number): Promise<User> {
    // 实现逻辑
  }

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Partial<User>} userData - 要更新的用户数据
   * @returns {Promise<User>} 更新后的用户信息
   */
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    // 实现逻辑
  }
}
```

#### 行内注释
```typescript
// 单行注释：解释复杂的逻辑
const result = data.filter(item => item.isActive && item.createdAt > threshold);

// TODO: 待办事项
// FIXME: 需要修复的问题
// HACK: 临时解决方案
// NOTE: 重要提醒
```

## TypeScript 规范

### 1. 类型定义

#### 基本类型
```typescript
// 基本类型
let name: string = 'John Doe';
let age: number = 30;
let isActive: boolean = true;
let data: any = null; // 避免使用 any
let unknownValue: unknown = 'unknown';

// 数组类型
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ['Alice', 'Bob'];

// 对象类型
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// 函数类型
type FetchFunction = (url: string) => Promise<Response>;

// 联合类型
type Status = 'active' | 'inactive' | 'pending';

// 交叉类型
type AdminUser = User & { role: 'admin' };
```

#### 接口定义
```typescript
// 基础接口
interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// 继承接口
interface User extends BaseEntity {
  username: string;
  email: string;
  profile?: UserProfile;
}

// 可选属性
interface UserProfile {
  avatar?: string;
  bio?: string;
  website?: string;
}

// 只读属性
interface Config {
  readonly apiKey: string;
  readonly baseUrl: string;
}

// 索引签名
interface StringMap {
  [key: string]: string;
}
```

### 2. 函数类型

#### 函数声明
```typescript
// 函数声明
function add(a: number, b: number): number {
  return a + b;
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b;

// 函数重载
function processValue(value: string): string;
function processValue(value: number): number;
function processValue(value: string | number): string | number {
  return typeof value === 'string' ? value.toUpperCase() : value * 2;
}

// 可选参数
function greet(name: string, greeting?: string): string {
  return greeting ? `${greeting}, ${name}!` : `Hello, ${name}!`;
}

// 默认参数
function createUrl(path: string, baseUrl: string = 'https://api.example.com'): string {
  return `${baseUrl}${path}`;
}
```

### 3. 泛型

#### 泛型函数
```typescript
// 基础泛型
function identity<T>(arg: T): T {
  return arg;
}

// 数组处理
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

// API 响应
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  return response.json();
}
```

## React 规范

### 1. 组件规范

#### 函数组件
```typescript
import React, { useState, useEffect, useMemo } from 'react';

interface ComponentProps {
  title: string;
  items: string[];
  onItemClick?: (item: string) => void;
  className?: string;
}

const ComponentName: React.FC<ComponentProps> = ({
  title,
  items,
  onItemClick,
  className = '',
}) => {
  // 状态管理
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // 计算属性
  const filteredItems = useMemo(() => {
    return items.filter(item => item.length > 0);
  }, [items]);

  // 事件处理
  const handleItemClick = (item: string, index: number) => {
    setSelectedIndex(index);
    onItemClick?.(item);
  };

  // 副作用
  useEffect(() => {
    // 组件挂载时的逻辑
    return () => {
      // 清理逻辑
    };
  }, []);

  return (
    <div className={`component-name ${className}`}>
      <h2>{title}</h2>
      <ul>
        {filteredItems.map((item, index) => (
          <li key={index}>
            <button
              className={selectedIndex === index ? 'selected' : ''}
              onClick={() => handleItemClick(item, index)}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ComponentName;
```

#### 自定义 Hook
```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions {
  enabled?: boolean;
  retryCount?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = {}
) {
  const { 
    enabled = true, 
    retryCount = 3, 
    onSuccess, 
    onError 
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
      const result = await response.json();
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

### 2. 样式规范

#### CSS Modules
```css
/* ComponentName.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: var(--color-background);
}

.container:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0.5rem;
  }
}

/* 主题变量 */
:root {
  --color-background: #ffffff;
  --color-text-primary: #1f2937;
  --color-primary: #3b82f6;
}

.dark {
  --color-background: #1f2937;
  --color-text-primary: #f9fafb;
}
```

#### Tailwind CSS
```typescript
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses}`;
  
  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
```

## 后端规范

### 1. Express 路由

#### 路由组织
```typescript
// routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { CreateUserDTO, UpdateUserDTO } from '../dto/userDTO';

const router = Router();
const userController = new UserController();

/**
 * @route GET /api/users
 * @desc 获取所有用户
 * @access Private
 */
router.get('/', 
  authenticate,
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc 根据ID获取用户
 * @access Private
 */
router.get('/:id', 
  authenticate,
  userController.getUserById
);

/**
 * @route POST /api/users
 * @desc 创建新用户
 * @access Private
 */
router.post('/', 
  authenticate,
  validateRequest(CreateUserDTO),
  userController.createUser
);

/**
 * @route PUT /api/users/:id
 * @desc 更新用户信息
 * @access Private
 */
router.put('/:id', 
  authenticate,
  validateRequest(UpdateUserDTO),
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc 删除用户
 * @access Private
 */
router.delete('/:id', 
  authenticate,
  userController.deleteUser
);

export default router;
```

### 2. 控制器规范

```typescript
// controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { CreateUserDTO, UpdateUserDTO } from '../dto/userDTO';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * 获取所有用户
   * @route GET /api/users
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;
    
    const result = await this.userService.getAll({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
    });

    res.json({
      success: true,
      data: result,
      message: 'Users retrieved successfully',
    });
  });

  /**
   * 根据ID获取用户
   * @route GET /api/users/:id
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const user = await this.userService.getById(Number(id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  });

  /**
   * 创建新用户
   * @route POST /api/users
   */
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserDTO = req.body;
    
    const user = await this.userService.create(userData);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  });

  /**
   * 更新用户信息
   * @route PUT /api/users/:id
   */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateUserDTO = req.body;
    
    const user = await this.userService.update(Number(id), updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  });

  /**
   * 删除用户
   * @route DELETE /api/users/:id
   */
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const deleted = await this.userService.delete(Number(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: null,
      message: 'User deleted successfully',
    });
  });
}
```

### 3. 服务层规范

```typescript
// services/userService.ts
import { Database } from '../database';
import { CreateUserDTO, UpdateUserDTO } from '../dto/userDTO';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { hashPassword, comparePassword } from '../utils/crypto';

export class UserService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * 获取所有用户
   */
  async getAll(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page, limit, search } = options;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM users';
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      const params: any[] = [];

      // 搜索条件
      if (search) {
        query += ' WHERE username LIKE ? OR email LIKE ?';
        countQuery += ' WHERE username LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }

      // 分页
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // 执行查询
      const users = await this.db.all(query, params);
      const [{ total }] = await this.db.get(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in UserService.getAll:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * 根据ID获取用户
   */
  async getById(id: number): Promise<User | null> {
    try {
      const user = await this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return user || null;
    } catch (error) {
      logger.error('Error in UserService.getById:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * 创建新用户
   */
  async create(userData: CreateUserDTO): Promise<User> {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [userData.username, userData.email]
      );

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // 加密密码
      const hashedPassword = await hashPassword(userData.password);

      // 插入用户
      const result = await this.db.run(
        `INSERT INTO users (username, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userData.username, userData.email, hashedPassword]
      );

      const newUser = await this.getById(result.lastID);
      if (!newUser) {
        throw new Error('Failed to create user');
      }

      logger.info(`User created: ${userData.username}`);
      return newUser;
    } catch (error) {
      logger.error('Error in UserService.create:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updateData: UpdateUserDTO): Promise<User | null> {
    try {
      // 检查用户是否存在
      const existingUser = await this.getById(id);
      if (!existingUser) {
        return null;
      }

      const updateFields = [];
      const params = [];

      if (updateData.username !== undefined) {
        updateFields.push('username = ?');
        params.push(updateData.username);
      }
      if (updateData.email !== undefined) {
        updateFields.push('email = ?');
        params.push(updateData.email);
      }
      if (updateData.password !== undefined) {
        updateFields.push('password_hash = ?');
        params.push(await hashPassword(updateData.password));
      }

      if (updateFields.length === 0) {
        return existingUser;
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await this.db.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      const updatedUser = await this.getById(id);
      logger.info(`User updated: ${existingUser.username}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.update:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * 删除用户
   */
  async delete(id: number): Promise<boolean> {
    try {
      const user = await this.getById(id);
      if (!user) {
        return false;
      }

      await this.db.run('DELETE FROM users WHERE id = ?', [id]);
      logger.info(`User deleted: ${user.username}`);
      return true;
    } catch (error) {
      logger.error('Error in UserService.delete:', error);
      throw new Error('Failed to delete user');
    }
  }
}
```

## 测试规范

### 1. 单元测试

```typescript
// services/userService.test.ts
import { UserService } from '../services/userService';
import { Database } from '../database';
import { CreateUserDTO } from '../dto/userDTO';

// Mock Database
jest.mock('../database');

describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    // Setup mocks
    mockDb = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
    } as any;

    (Database.getInstance as jest.Mock).mockReturnValue(mockDb);
    userService = new UserService();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData: CreateUserDTO = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.get.mockResolvedValueOnce(null); // No existing user
      mockDb.run.mockResolvedValueOnce({ lastID: 1 } as any);
      mockDb.get.mockResolvedValueOnce(mockUser);

      // Act
      const result = await userService.create(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([userData.username, userData.email, expect.any(String)])
      );
    });

    it('should throw error if username already exists', async () => {
      // Arrange
      const userData: CreateUserDTO = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockDb.get.mockResolvedValueOnce({ id: 1 }); // Existing user

      // Act & Assert
      await expect(userService.create(userData)).rejects.toThrow(
        'Username or email already exists'
      );
    });
  });

  describe('getById', () => {
    it('should return user if found', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      mockDb.get.mockResolvedValueOnce(mockUser);

      // Act
      const result = await userService.getById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1]
      );
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockDb.get.mockResolvedValueOnce(null);

      // Act
      const result = await userService.getById(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

## 提交规范

### 1. 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2. 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat(auth): add user login functionality |
| fix | Bug 修复 | fix(api): handle empty response in user endpoint |
| docs | 文档更新 | docs(readme): update installation instructions |
| style | 代码格式调整 | style(button): improve button styling |
| refactor | 重构 | refactor(service): extract common logic to utility |
| test | 测试相关 | test(auth): add unit tests for login function |
| chore | 构建工具或依赖管理 | chore(deps): update lodash to latest version |

### 3. 提交示例

```bash
# 功能提交
feat(content): add AI content generation functionality
- Implement AI content generation endpoint
- Add content validation middleware
- Include comprehensive error handling

# Bug 修复提交
fix(auth): fix JWT token expiration handling
- Fix token expiration validation logic
- Add proper error messages for expired tokens
- Update token refresh mechanism

# 文档提交
docs(api): update API documentation for v2
- Add new endpoint documentation
- Update authentication requirements
- Include response examples

# 重构提交
refactor(database): optimize database query performance
- Add database indexes for frequently queried fields
- Implement query result caching
- Optimize complex join operations
```

## 代码审查清单

### 1. 代码质量
- [ ] 代码遵循项目编码规范
- [ ] 变量和函数命名清晰明确
- [ ] 代码逻辑简洁易懂
- [ ] 没有明显的性能问题
- [ ] 错误处理完善

### 2. 类型安全
- [ ] TypeScript 类型定义完整
- [ ] 没有 `any` 类型的不当使用
- [ ] 接口定义合理
- [ ] 泛型使用正确

### 3. 测试覆盖
- [ ] 新功能包含单元测试
- [ ] 边界情况已测试
- [ ] 错误情况已测试
- [ ] 测试覆盖率达标

### 4. 安全性
- [ ] 输入验证完整
- [ ] 没有 SQL 注入风险
- [ ] 敏感数据不暴露
- [ ] 权限控制正确

### 5. 性能
- [ ] 数据库查询优化
- [ ] 前端渲染性能良好
- [ ] 内存使用合理
- [ ] 网络请求优化

## 总结

遵循这些编码规范可以确保代码质量、一致性和可维护性。所有开发者都应该熟悉并遵守这些规范。

### 关键要点
- **一致性**: 保持代码风格和结构的一致性
- **可读性**: 编写易于理解的代码
- **可维护性**: 编写易于维护和扩展的代码
- **测试**: 编写完整的测试用例
- **文档**: 提供必要的文档和注释

### 工具支持
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 使用 TypeScript 提供类型安全
- 使用 Jest 进行测试

### 持续改进
- 定期审查和更新编码规范
- 收集开发者的反馈
- 跟踪最佳实践的发展

---

通过遵循这些规范，我们可以构建一个高质量、可维护的 AI Writer 项目。