# 测试开发模板

## 测试策略和最佳实践

### 1. 测试结构

```
tests/
├── unit/                    # 单元测试
│   ├── components/          # 组件测试
│   ├── services/           # 服务测试
│   ├── utils/              # 工具函数测试
│   └── hooks/              # Hook 测试
├── integration/            # 集成测试
│   ├── api/                # API 集成测试
│   ├── database/           # 数据库集成测试
│   └── auth/               # 认证集成测试
├── e2e/                    # 端到端测试
│   ├── pages/              # 页面测试
│   ├── workflows/          # 工作流测试
│   └── performance/        # 性能测试
├── fixtures/               # 测试数据
│   ├── users.json          # 用户数据
│   ├── materials.json      # 素材数据
│   └── responses.json      # API 响应数据
└── utils/                  # 测试工具
    ├── mocks.ts            # Mock 函数
    ├── helpers.ts          # 辅助函数
    └── setup.ts            # 测试设置
```

### 2. 单元测试模板

#### React 组件测试模板

```typescript
// tests/components/ComponentName.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ComponentName from '../../src/components/ComponentName';
import { useAppStore } from '../../src/store/appStore';

// Mock the store
jest.mock('../../src/store/appStore');

// Mock any external dependencies
jest.mock('../../src/services/apiService');

describe('ComponentName', () => {
  const mockStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock return values
    mockStore.mockReturnValue({
      state: 'default',
      setState: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render with props correctly', () => {
      const props = {
        title: 'Test Title',
        isLoading: false,
      };

      render(
        <BrowserRouter>
          <ComponentName {...props} />
        </BrowserRouter>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <BrowserRouter>
          <ComponentName isLoading={true} />
        </BrowserRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(
        <BrowserRouter>
          <ComponentName data={[]} />
        </BrowserRouter>
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button clicks', async () => {
      const mockOnClick = jest.fn();
      
      render(
        <BrowserRouter>
          <ComponentName onClick={mockOnClick} />
        </BrowserRouter>
      );

      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle form submissions', async () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <BrowserRouter>
          <ComponentName onSubmit={mockOnSubmit} />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('Username');
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(input, 'testuser');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
      });
    });

    it('should handle input changes', async () => {
      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('Email');
      await user.type(input, 'test@example.com');

      expect(input).toHaveValue('test@example.com');
    });
  });

  describe('State Management', () => {
    it('should update state when store changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      // Update mock store value
      mockStore.mockReturnValue({
        state: 'updated',
        setState: jest.fn(),
      });

      rerender(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      expect(screen.getByText('Updated State')).toBeInTheDocument();
    });

    it('should call store actions', async () => {
      const mockSetState = jest.fn();
      mockStore.mockReturnValue({
        state: 'default',
        setState: mockSetState,
      });

      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      const button = screen.getByRole('button', { name: /update state/i });
      await user.click(button);

      expect(mockSetState).toHaveBeenCalledWith('new state');
    });
  });

  describe('API Integration', () => {
    it('should fetch data on mount', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      jest.mock('../../src/services/apiService', () => ({
        fetchData: mockFetch,
      }));

      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Data')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
      
      jest.mock('../../src/services/apiService', () => ({
        fetchData: mockFetch,
      }));

      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Action button');
    });

    it('should be keyboard navigable', async () => {
      render(
        <BrowserRouter>
          <ComponentName />
        </BrowserRouter>
      );

      const button = screen.getByRole('button');
      
      // Test Enter key
      await user.keyboard('[Tab]');
      await user.keyboard('[Enter]');

      expect(button).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const mockRenderCount = jest.fn();
      
      function TestComponent() {
        mockRenderCount();
        return <div>Test</div>;
      }

      render(<TestComponent />);

      expect(mockRenderCount).toHaveBeenCalledTimes(1);
    });
  });
});
```

#### Hook 测试模板

```typescript
// tests/hooks/useCustomHook.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomHook } from '../../src/hooks/useCustomHook';
import { apiService } from '../../src/services/apiService';

// Mock the API service
jest.mock('../../src/services/apiService');

describe('useCustomHook', () => {
  const mockApiService = apiService as jest.Mocked<typeof apiService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current).toEqual({
      data: null,
      loading: false,
      error: null,
      refetch: expect.any(Function),
    });
  });

  it('should fetch data when called', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    mockApiService.fetchData.mockResolvedValue(mockData);

    const { result } = renderHook(() => useCustomHook());

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockApiService.fetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle loading state', async () => {
    mockApiService.fetchData.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useCustomHook());

    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle errors', async () => {
    const mockError = new Error('API Error');
    mockApiService.fetchData.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCustomHook());

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.loading).toBe(false);
  });

  it('should respect dependencies', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    mockApiService.fetchData.mockResolvedValue(mockData);

    const { result, rerender } = renderHook(
      ({ dependency }) => useCustomHook(dependency),
      { initialProps: { dependency: 'initial' } }
    );

    // Initial fetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockApiService.fetchData).toHaveBeenCalledTimes(1);

    // Rerender with same dependency
    rerender({ dependency: 'initial' });

    expect(mockApiService.fetchData).toHaveBeenCalledTimes(1);

    // Rerender with different dependency
    rerender({ dependency: 'changed' });

    expect(mockApiService.fetchData).toHaveBeenCalledTimes(2);
  });

  it('should cleanup on unmount', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    mockApiService.fetchData.mockResolvedValue(mockData);

    const { result, unmount } = renderHook(() => useCustomHook());

    const cleanupSpy = jest.fn();
    mockApiService.fetchData.mockReturnValue({
      then: () => ({ catch: () => ({ finally: cleanupSpy } }),
    } as any);

    act(() => {
      result.current.refetch();
    });

    unmount();

    expect(cleanupSpy).toHaveBeenCalled();
  });
});
```

#### 服务层测试模板

```typescript
// tests/services/resourceService.test.ts
import { ResourceService } from '../../src/services/ResourceService';
import { Database } from '../../src/database';

// Mock the database
jest.mock('../../src/database');

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    // Create mock database instance
    mockDb = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
    } as any;

    // Mock Database.getInstance
    (Database.getInstance as jest.Mock).mockReturnValue(mockDb);

    resourceService = new ResourceService();
  });

  describe('getAll', () => {
    it('should return resources with pagination', async () => {
      const mockResources = [
        { id: 1, title: 'Resource 1' },
        { id: 2, title: 'Resource 2' },
      ];
      const mockTotal = 2;

      mockDb.all.mockResolvedValue(mockResources);
      mockDb.get.mockResolvedValue({ total: mockTotal });

      const result = await resourceService.getAll({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        resources: mockResources,
        pagination: {
          page: 1,
          limit: 10,
          total: mockTotal,
          pages: 1,
        },
      });

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM resources ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [10, 0]
      );
    });

    it('should handle search functionality', async () => {
      const mockResources = [{ id: 1, title: 'Search Result' }];
      const mockTotal = 1;

      mockDb.all.mockResolvedValue(mockResources);
      mockDb.get.mockResolvedValue({ total: mockTotal });

      const result = await resourceService.getAll({
        page: 1,
        limit: 10,
        search: 'search term',
      });

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM resources WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        ['%search term%', '%search term%', 10, 0]
      );
    });

    it('should handle database errors', async () => {
      mockDb.all.mockRejectedValue(new Error('Database Error'));

      await expect(resourceService.getAll({
        page: 1,
        limit: 10,
      })).rejects.toThrow('Failed to retrieve resources');
    });
  });

  describe('create', () => {
    it('should create a new resource', async () => {
      const mockResource = { id: 1, title: 'New Resource' };
      const createData = {
        title: 'New Resource',
        description: 'Description',
        userId: 1,
      };

      mockDb.run.mockResolvedValue({ lastID: 1 } as any);
      mockDb.get.mockResolvedValue(mockResource);

      const result = await resourceService.create(createData);

      expect(result).toEqual(mockResource);
      expect(mockDb.run).toHaveBeenCalledWith(
        `INSERT INTO resources (title, description, user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [createData.title, createData.description, createData.userId, 'active']
      );
    });

    it('should handle creation errors', async () => {
      mockDb.run.mockRejectedValue(new Error('Creation Error'));

      await expect(resourceService.create({
        title: 'Test',
        description: 'Test',
        userId: 1,
      })).rejects.toThrow('Failed to create resource');
    });
  });
});
```

### 3. 集成测试模板

#### API 集成测试模板

```typescript
// tests/integration/api/resources.test.ts
import request from 'supertest';
import { app } from '../../../src/app';
import { Database } from '../../../src/database';

describe('Resources API Integration', () => {
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

  describe('POST /api/resources', () => {
    it('should create a new resource', async () => {
      const resourceData = {
        title: 'Test Resource',
        description: 'Test Description',
      };

      const response = await request(app)
        .post('/api/resources')
        .send(resourceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(resourceData.title);
      expect(response.body.data.description).toBe(resourceData.description);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(1);
    });

    it('should handle duplicate resources', async () => {
      const resourceData = {
        title: 'Duplicate Resource',
        description: 'Test Description',
      };

      // Create first resource
      await request(app)
        .post('/api/resources')
        .send(resourceData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/resources')
        .send(resourceData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/resources', () => {
    it('should return all resources', async () => {
      // Create test data
      await request(app)
        .post('/api/resources')
        .send({ title: 'Resource 1', description: 'Description 1' });

      await request(app)
        .post('/api/resources')
        .send({ title: 'Resource 2', description: 'Description 2' });

      const response = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resources).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      // Create test data
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/resources')
          .send({ title: `Resource ${i}`, description: `Description ${i}` });
      }

      const response = await request(app)
        .get('/api/resources?page=2&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.total).toBe(15);
      expect(response.body.data.pagination.pages).toBe(3);
      expect(response.body.data.resources).toHaveLength(5);
    });

    it('should support search', async () => {
      // Create test data
      await request(app)
        .post('/api/resources')
        .send({ title: 'Searchable Resource', description: 'Can be found' });

      await request(app)
        .post('/api/resources')
        .send({ title: 'Other Resource', description: 'Not found' });

      const response = await request(app)
        .get('/api/resources?search=Searchable')
        .expect(200);

      expect(response.body.data.resources).toHaveLength(1);
      expect(response.body.data.resources[0].title).toBe('Searchable Resource');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send({ title: 'Protected Resource' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle invalid tokens', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
```

### 4. 端到端测试模板

```typescript
// tests/e2e/complete-workflow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Content Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Login
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should complete content creation workflow', async ({ page }) => {
    // Step 1: Create a new account
    await page.click('[data-testid="accounts-tab"]');
    await page.click('[data-testid="create-account-button"]');
    
    await page.fill('[data-testid="account-name"]', 'Test Account');
    await page.selectOption('[data-testid="account-platform"]', '微信公众号');
    await page.fill('[data-testid="account-description"]', 'Test account description');
    await page.click('[data-testid="save-account-button"]');

    // Verify account creation
    await expect(page.locator('[data-testid="account-item"]')).toHaveText('Test Account');

    // Step 2: Add materials
    await page.click('[data-testid="materials-tab"]');
    await page.click('[data-testid="add-material-button"]');

    await page.fill('[data-testid="material-title"]', 'AI Technology Trends');
    await page.fill('[data-testid="material-content"]', 'AI is transforming various industries...');
    await page.fill('[data-testid="material-tags"]', 'AI, Technology, Trends');
    await page.click('[data-testid="save-material-button"]');

    // Verify material creation
    await expect(page.locator('[data-testid="material-item"]')).toHaveText('AI Technology Trends');

    // Step 3: Generate topics
    await page.click('[data-testid="topics-tab"]');
    await page.click('[data-testid="generate-topics-button"]');

    // Select materials for topic generation
    await page.check('[data-testid="material-checkbox"]');
    await page.click('[data-testid="generate-topics-confirm"]');

    // Wait for AI to generate topics
    await expect(page.locator('[data-testid="generated-topics"]')).toBeVisible();

    // Step 4: Create content from topic
    const topicItem = page.locator('[data-testid="topic-item"]').first();
    await topicItem.click('[data-testid="create-content-button"]');

    // Configure content generation
    await page.selectOption('[data-testid="content-style"]', 'professional');
    await page.fill('[data-testid="word-count"]', '1500');
    await page.click('[data-testid="generate-content-button']');

    // Wait for content generation
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible();

    // Step 5: Review and publish content
    await page.click('[data-testid="review-content-button"]');
    
    // Wait for review to complete
    await expect(page.locator('[data-testid="review-results"]')).toBeVisible();

    // Publish content
    await page.click('[data-testid="publish-content-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(
      'Content published successfully!'
    );

    // Verify content appears in published list
    await page.click('[data-testid="published-tab"]');
    await expect(page.locator('[data-testid="published-content"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Try to create content without materials
    await page.click('[data-testid="topics-tab"]');
    await page.click('[data-testid="generate-topics-button"]');
    await page.click('[data-testid="generate-topics-confirm"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toHaveText(
      'Please select at least one material'
    );
  });

  test('should maintain data consistency', async ({ page }) => {
    // Create account
    await page.click('[data-testid="accounts-tab"]');
    await page.click('[data-testid="create-account-button"]');
    await page.fill('[data-testid="account-name"]', 'Consistency Test Account');
    await page.click('[data-testid="save-account-button"]');

    // Navigate away and back
    await page.click('[data-testid="materials-tab"]');
    await page.click('[data-testid="accounts-tab"]');

    // Verify account still exists
    await expect(page.locator('[data-testid="account-item"]')).toHaveText('Consistency Test Account');
  });
});
```

### 5. 测试工具和辅助函数

```typescript
// tests/utils/testHelpers.ts
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../src/context/AppContext';

// Custom render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
};

// Create test data builders
export const testDataBuilder = {
  user: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    ...overrides,
  }),
  resource: (overrides = {}) => ({
    id: 1,
    title: 'Test Resource',
    description: 'Test Description',
    status: 'active',
    ...overrides,
  }),
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key]),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};
```

## 测试检查清单

### 单元测试检查清单
- [ ] 测试覆盖所有关键功能
- [ ] 测试正常情况和边界情况
- [ ] 测试错误处理
- [ ] Mock 外部依赖
- [ ] 测试组件渲染
- [ ] 测试用户交互
- [ ] 测试状态管理
- [ ] 测试性能优化

### 集成测试检查清单
- [ ] 测试 API 端点
- [ ] 测试数据库集成
- [ ] 测试认证流程
- [ ] 测试数据一致性
- [ ] 测试错误处理
- [ ] 测试性能影响

### 端到端测试检查清单
- [ ] 测试完整用户流程
- [ ] 测试跨页面导航
- [ ] 测试表单提交
- [ ] 测试错误恢复
- [ ] 测试数据持久化
- [ ] 测试用户体验

### 测试质量检查清单
- [ ] 测试命名清晰明确
- [ ] 测试独立且可重复
- [ ] 测试覆盖率达到目标
- [ ] 测试文档完整
- [ ] 测试运行稳定
- [ ] 测试性能可接受

---

这个模板提供了完整的测试开发规范和最佳实践。请根据具体需求调整模板内容。