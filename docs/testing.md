# 测试指南

## 概述

本文档提供了 AI Writer 项目的完整测试指南，包括测试策略、测试工具、测试编写规范和最佳实践。

## 测试策略

### 1. 测试金字塔

```
         /\
        /  \
       / E2E \
      /--------\
     /   集成   \
    /------------\
   /    单元     \
  /--------------\
 /                \
------------------
```

- **单元测试 (70%)**: 测试单个函数、组件、模块
- **集成测试 (20%)**: 测试模块间的交互
- **端到端测试 (10%)**: 测试完整的用户流程

### 2. 测试覆盖目标

| 测试类型 | 覆盖率目标 | 工具 |
|----------|------------|------|
| 单元测试 | 80%+ | Jest, React Testing Library |
| 集成测试 | 70%+ | Supertest, Jest |
| 端到端测试 | 60%+ | Playwright |
| API 测试 | 90%+ | Supertest |

## 测试工具配置

### 1. Jest 配置

```json
// jest.config.json
{
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "roots": ["<rootDir>/src", "<rootDir>/tests"],
  "testMatch": [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts"
  ],
  "transform": {
    "^.+\\.ts$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

### 2. React Testing Library 配置

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import '@testing-library/user-event';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();
```

### 3. Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 单元测试

### 1. React 组件测试

#### 基础组件测试
```typescript
// tests/components/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/common/Button';

describe('Button Component', () => {
  const user = userEvent.setup();

  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should show loading state', () => {
    render(<Button loading>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should support different variants', () => {
    const { rerender } = render(<Button variant="secondary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');

    rerender(<Button variant="outline">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-gray-300');
  });

  it('should support different sizes', () => {
    const { rerender } = render(<Button size="sm">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-sm');

    rerender(<Button size="lg">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-lg');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('custom-class');
  });
});
```

#### 复杂组件测试
```typescript
// tests/components/UserForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '@/components/forms/UserForm';
import { useAppStore } from '@/store/appStore';

// Mock the store
jest.mock('@/store/appStore');

describe('UserForm Component', () => {
  const mockStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.mockReturnValue({
      createUser: jest.fn(),
      updateUser: jest.fn(),
      loading: false,
      error: null,
    });
  });

  it('should render form fields correctly', () => {
    render(<UserForm />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockCreateUser = jest.fn();
    mockStore.mockReturnValue({
      createUser: mockCreateUser,
      updateUser: jest.fn(),
      loading: false,
      error: null,
    });

    render(<UserForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockCreateUser).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show validation errors for invalid inputs', async () => {
    render(<UserForm />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    const mockCreateUser = jest.fn().mockRejectedValue(new Error('API Error'));
    mockStore.mockReturnValue({
      createUser: mockCreateUser,
      updateUser: jest.fn(),
      loading: false,
      error: null,
    });

    render(<UserForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/failed to create user/i)).toBeInTheDocument();
  });

  it('should show loading state during submission', async () => {
    const mockCreateUser = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    mockStore.mockReturnValue({
      createUser: mockCreateUser,
      updateUser: jest.fn(),
      loading: true,
      error: null,
    });

    render(<UserForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### 2. Hook 测试

```typescript
// tests/hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

// Mock the auth service
jest.mock('@/services/authService');

describe('useAuth Hook', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toEqual({
      user: null,
      loading: false,
      error: null,
      login: expect.any(Function),
      logout: expect.any(Function),
      register: expect.any(Function),
    });
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };

    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('should handle login errors', async () => {
    const mockError = new Error('Invalid credentials');
    mockAuthService.login.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('testuser', 'wrongpassword');
    });

    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useAuth());

    // Set initial user
    act(() => {
      result.current.login('testuser', 'password123');
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBe(null);
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should handle registration', async () => {
    const mockUser = {
      id: 1,
      username: 'newuser',
      email: 'newuser@example.com',
    };

    mockAuthService.register.mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('newuser', 'newuser@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockAuthService.register).toHaveBeenCalledWith(
      'newuser',
      'newuser@example.com',
      'password123'
    );
  });

  it('should manage loading state', async () => {
    mockAuthService.login.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login('testuser', 'password123');
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### 3. 工具函数测试

```typescript
// tests/utils/validators.test.ts
import { validateEmail, validatePassword, validateUsername } from '@/utils/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test.domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('SecurePass123!')).toBe(true);
      expect(validatePassword('my-secret-password')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(validatePassword('123')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should return true for valid usernames', () => {
      expect(validateUsername('testuser')).toBe(true);
      expect(validateUsername('user_name')).toBe(true);
      expect(validateUsername('user123')).toBe(true);
    });

    it('should return false for invalid usernames', () => {
      expect(validateUsername('user name')).toBe(false);
      expect(validateUsername('user@name')).toBe(false);
      expect(validateUsername('')).toBe(false);
      expect(validateUsername('a')).toBe(false);
    });
  });
});
```

## 集成测试

### 1. API 集成测试

```typescript
// tests/integration/api/auth.test.ts
import request from 'supertest';
import { app } from '../../../src/app';
import { Database } from '../../../src/database';

describe('Auth API Integration', () => {
  beforeAll(async () => {
    // Initialize test database
    await Database.getInstance().initialize();
  });

  afterAll(async () => {
    // Close database connection
    await Database.getInstance().close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await Database.getInstance().clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          username: userData.username,
          email: userData.email,
        })
      );
      expect(response.body.data.token).toBeDefined();
    });

    it('should return validation errors for invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'tu', // Too short
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(3);
    });

    it('should return error for duplicate username', async () => {
      const userData = {
        username: 'duplicate',
        email: 'test1@example.com',
        password: 'password123',
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          email: 'test2@example.com',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_USERNAME');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          username: 'testuser',
        })
      );
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
        })
      );
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});
```

### 2. 数据库集成测试

```typescript
// tests/integration/database/user.test.ts
import { UserService } from '../../../src/services/UserService';
import { Database } from '../../../src/database';

describe('UserService Database Integration', () => {
  let userService: UserService;
  let db: Database;

  beforeAll(async () => {
    // Initialize test database
    db = Database.getInstance();
    await db.initialize();
    userService = new UserService();
  });

  afterAll(async () => {
    // Close database connection
    await db.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await db.run('DELETE FROM users');
  });

  describe('create', () => {
    it('should create a user in the database', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await userService.create(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.created_at).toBeDefined();
    });

    it('should persist user data in database', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await userService.create(userData);

      // Query database directly
      const dbUser = await db.get(
        'SELECT * FROM users WHERE username = ?',
        [userData.username]
      );

      expect(dbUser).toBeDefined();
      expect(dbUser.username).toBe(userData.username);
      expect(dbUser.email).toBe(userData.email);
    });
  });

  describe('getById', () => {
    it('should retrieve user from database', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const createdUser = await userService.create(userData);
      const retrievedUser = await userService.getById(createdUser.id);

      expect(retrievedUser).toEqual(createdUser);
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.getById(999);
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user in database', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await userService.create(userData);
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const updatedUser = await userService.update(user.id, updateData);

      expect(updatedUser?.username).toBe(updateData.username);
      expect(updatedUser?.email).toBe(updateData.email);

      // Verify database update
      const dbUser = await db.get(
        'SELECT * FROM users WHERE id = ?',
        [user.id]
      );

      expect(dbUser.username).toBe(updateData.username);
      expect(dbUser.email).toBe(updateData.email);
    });
  });
});
```

## 端到端测试

### 1. 用户流程测试

```typescript
// tests/e2e/auth-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete registration and login flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Wait for successful registration
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(
      'Registration successful!'
    );

    // Navigate to login page
    await page.click('[data-testid="login-link"]');
    await expect(page).toHaveURL('/login');

    // Fill login form
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password123');

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-welcome"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-welcome"]')).toHaveText(
      'Welcome, testuser!'
    );
  });

  test('should handle registration validation errors', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('[data-testid="register-button"]');

    // Check for validation errors
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.fill('[data-testid="username"]', 'nonexistent');
    await page.fill('[data-testid="password"]', 'wrongpassword');

    // Submit login
    await page.click('[data-testid="login-button']');

    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toHaveText(
      'Invalid username or password'
    );
  });

  test('should persist login state across page refreshes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('[data-testid="user-welcome"])).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});
```

### 2. 内容创建流程测试

```typescript
// tests/e2e/content-creation.test.ts
import { test, expect } from '@playwright/test';

test.describe('Content Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create content from materials', async ({ page }) => {
    // Navigate to materials page
    await page.click('[data-testid="materials-nav"]');
    await expect(page).toHaveURL('/materials');

    // Add new material
    await page.click('[data-testid="add-material-button"]');
    await page.fill('[data-testid="material-title"]', 'AI Technology Trends');
    await page.fill('[data-testid="material-content"]', 'AI is transforming various industries...');
    await page.click('[data-testid="save-material-button"]');

    // Verify material creation
    await expect(page.locator('[data-testid="material-item"]')).toHaveText('AI Technology Trends');

    // Navigate to topics page
    await page.click('[data-testid="topics-nav"]');
    await expect(page).toHaveURL('/topics');

    // Generate topics from material
    await page.click('[data-testid="generate-topics-button"]');
    await page.check('[data-testid="material-checkbox"]');
    await page.click('[data-testid="generate-topics-confirm"]');

    // Wait for topic generation
    await expect(page.locator('[data-testid="generated-topics"]')).toBeVisible();

    // Create content from topic
    const topicItem = page.locator('[data-testid="topic-item"]').first();
    await topicItem.click('[data-testid="create-content-button"]');

    // Configure content generation
    await page.selectOption('[data-testid="content-style"]', 'professional');
    await page.fill('[data-testid="word-count"]', '1500');
    await page.click('[data-testid="generate-content-button"]');

    // Wait for content generation
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible();

    // Review and publish content
    await page.click('[data-testid="review-content-button"]');
    await expect(page.locator('[data-testid="review-results"]')).toBeVisible();
    await page.click('[data-testid="publish-content-button"]');

    // Verify successful publication
    await expect(page.locator('[data-testid="success-message"])).toHaveText(
      'Content published successfully!'
    );
  });

  test('should handle content generation errors', async ({ page }) => {
    // Navigate to topics page
    await page.click('[data-testid="topics-nav"]');
    await expect(page).toHaveURL('/topics');

    // Try to generate topics without materials
    await page.click('[data-testid="generate-topics-button"]');
    await page.click('[data-testid="generate-topics-confirm"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"])).toHaveText(
      'Please select at least one material'
    );
  });

  test('should save content as draft', async ({ page }) => {
    // Navigate to content creation
    await page.click('[data-testid="content-nav"]');
    await expect(page).toHaveURL('/content');

    // Create new content
    await page.click('[data-testid="new-content-button"]');
    await page.fill('[data-testid="content-title"]', 'Draft Content');
    await page.fill('[data-testid="content-body"]', 'This is a draft content...');
    await page.click('[data-testid="save-draft-button"]');

    // Verify draft creation
    await expect(page.locator('[data-testid="draft-saved"]')).toBeVisible();
    await expect(page.locator('[data-testid="draft-saved"]')).toHaveText(
      'Draft saved successfully!'
    );
  });
});
```

## 测试最佳实践

### 1. 测试命名规范

```typescript
// 好的测试命名
describe('UserService', () => {
  describe('create', () => {
    it('should create a new user successfully', () => {
      // 测试代码
    });

    it('should throw error for duplicate username', () => {
      // 测试代码
    });

    it('should hash password before storing', () => {
      // 测试代码
    });
  });
});

// 避免的测试命名
describe('UserService', () => {
  it('test create user', () => {
    // 不够具体
  });

  it('should work', () => {
    // 太模糊
  });
});
```

### 2. 测试结构

```typescript
// 推荐的测试结构
describe('ComponentName', () => {
  // 1. Setup
  beforeEach(() => {
    // 初始化测试环境
    jest.clearAllMocks();
  });

  // 2. 测试正常情况
  describe('when input is valid', () => {
    it('should render correctly', () => {
      // 测试代码
    });

    it('should handle user interaction', () => {
      // 测试代码
    });
  });

  // 3. 测试边界情况
  describe('when input is invalid', () => {
    it('should show validation errors', () => {
      // 测试代码
    });

    it('should prevent form submission', () => {
      // 测试代码
    });
  });

  // 4. 测试错误情况
  describe('when API fails', () => {
    it('should show error message', () => {
      // 测试代码
    });

    it('should retry on failure', () => {
      // 测试代码
    });
  });
});
```

### 3. Mock 和存根

```typescript
// 好的 Mock 实践
jest.mock('@/services/api', () => ({
  fetchData: jest.fn(),
  postData: jest.fn(),
}));

// 在测试中配置 Mock
beforeEach(() => {
  const mockApi = require('@/services/api');
  mockApi.fetchData.mockResolvedValue({ data: 'test' });
});

// 避免过度 Mock
// 只 Mock 外部依赖，不要 Mock 内部逻辑
```

### 4. 异步测试

```typescript
// 好的异步测试
it('should handle async operations', async () => {
  // Arrange
  const mockData = { id: 1, name: 'test' };
  mockApi.fetchData.mockResolvedValue(mockData);

  // Act
  const result = await userService.getData();

  // Assert
  expect(result).toEqual(mockData);
});

// 使用 waitFor
it('should update state after async operation', async () => {
  render(<Component />);
  
  // 触发异步操作
  fireEvent.click(screen.getByText('Load Data'));
  
  // 等待状态更新
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### 5. 测试覆盖率

```typescript
// 运行覆盖率测试
npm run test:coverage

// 查看覆盖率报告
# 查看生成的 coverage/lcov-report/index.html

# 覆盖率目标
# - 语句覆盖率: 80%+
# - 分支覆盖率: 75%+
# - 函数覆盖率: 80%+
# - 行覆盖率: 80%+
```

## 测试运行和调试

### 1. 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- UserService.test.ts

# 运行特定测试
npm test -- --testNamePattern="should create user"

# 监听模式
npm test -- --watch

# 运行覆盖率测试
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

### 2. 调试测试

```typescript
// 使用 console.log
it('should debug test', () => {
  console.log('Debug info:', someVariable);
});

// 使用 debugger
it('should debug test', () => {
  debugger; // 测试会在此处暂停
});

// 使用 VS Code 调试
// 在 VS Code 中设置断点，然后运行调试
```

### 3. 测试报告

```bash
# 生成 HTML 测试报告
npm run test:coverage

# 生成 JUnit XML 报告
npm test -- --reporters=default --reporters=jest-junit
```

## 总结

本测试指南提供了 AI Writer 项目的完整测试策略和最佳实践。通过遵循这些指南，我们可以确保代码质量和系统稳定性。

### 关键要点
- **测试金字塔**: 70% 单元测试，20% 集成测试，10% 端到端测试
- **测试覆盖率**: 目标 80%+ 的代码覆盖率
- **测试工具**: Jest, React Testing Library, Playwright
- **测试原则**: 独立、可重复、快速、可靠

### 持续改进
- 定期审查测试策略
- 收集测试运行数据
- 优化测试性能
- 更新测试工具

通过完善的测试体系，我们可以确保 AI Writer 项目的质量和稳定性。