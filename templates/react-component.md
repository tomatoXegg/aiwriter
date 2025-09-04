# React 组件开发模板

## 基础组件模板

### 1. 函数组件模板

```tsx
import React from 'react';
import { ComponentProps } from './types';

/**
 * 组件描述
 * 
 * @param {ComponentProps} props - 组件属性
 * @returns {JSX.Element} 渲染的组件
 */
const ComponentName: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2, 
  className = '',
  children 
}) => {
  // 状态管理
  const [state, setState] = React.useState<string>('');

  // 事件处理
  const handleClick = (event: React.MouseEvent) => {
    // 处理点击事件
  };

  // 副作用
  React.useEffect(() => {
    // 组件挂载时的副作用
    return () => {
      // 清理函数
    };
  }, []);

  // 计算属性
  const computedValue = React.useMemo(() => {
    // 计算逻辑
    return result;
  }, [dependencies]);

  return (
    <div className={`component-name ${className}`}>
      {/* 组件内容 */}
      {children}
    </div>
  );
};

export default ComponentName;
```

### 2. 组件类型定义模板

```tsx
// types.ts
export interface ComponentProps {
  /** 属性1描述 */
  prop1: string;
  /** 属性2描述 */
  prop2: number;
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children?: React.ReactNode;
}

export interface ComponentState {
  /** 状态描述 */
  value: string;
}

export interface ComponentEvent {
  /** 事件类型 */
  type: 'click' | 'change';
  /** 事件数据 */
  data: unknown;
}
```

### 3. 组件样式模板

```css
/* ComponentName.module.css */
.container {
  /* 基础样式 */
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    flex-direction: row;
  }
}

/* 主题样式 */
.container.dark {
  background-color: #1a1a1a;
  color: #ffffff;
}

/* 动画 */
.container.animated {
  transition: all 0.3s ease-in-out;
}

/* 状态样式 */
.container.active {
  border: 2px solid #007bff;
}
```

## 高级组件模板

### 1. 高阶组件 (HOC) 模板

```tsx
import React from 'react';

/**
 * 高阶组件模板
 * 
 * @param {React.ComponentType} WrappedComponent - 被包装的组件
 * @returns {React.ComponentType} 包装后的组件
 */
const withHOC = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const WithHOC: React.FC<P> = (props) => {
    // HOC 逻辑
    const [hocState, setHocState] = React.useState<string>('');

    const hocHandler = () => {
      // HOC 处理逻辑
    };

    return (
      <div className="hoc-wrapper">
        <WrappedComponent 
          {...props} 
          hocProp={hocState}
          onHocEvent={hocHandler}
        />
      </div>
    );
  };

  WithHOC.displayName = `WithHOC(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithHOC;
};

export default withHOC;
```

### 2. 自定义 Hook 模板

```tsx
import { useState, useEffect, useCallback } from 'react';

/**
 * 自定义 Hook 模板
 * 
 * @param {HookParams} params - Hook 参数
 * @returns {HookReturn} Hook 返回值
 */
export const useCustomHook = <T>(params: HookParams): HookReturn<T> => {
  const [state, setState] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // 数据获取逻辑
      const result = await apiCall(params);
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    state,
    loading,
    error,
    refetch: fetchData,
  };
};

// Hook 类型定义
interface HookParams {
  id: string;
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  };
}

interface HookReturn<T> {
  state: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### 3. Context 模板

```tsx
import React, { createContext, useContext, useReducer } from 'react';

// 状态类型
interface State {
  user: User | null;
  theme: 'light' | 'dark';
  loading: boolean;
}

// Action 类型
type Action = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOADING'; payload: boolean };

// 初始状态
const initialState: State = {
  user: null,
  theme: 'light',
  loading: false,
};

// Reducer
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// Provider 组件
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
```

## 测试模板

### 1. 单元测试模板

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  const defaultProps = {
    prop1: 'test',
    prop2: 123,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    render(<ComponentName {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('should update state on user interaction', async () => {
    render(<ComponentName {...defaultProps} />);
    const input = screen.getByLabelText('Input Label');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('new value')).toBeInTheDocument();
    });
  });

  it('should handle loading states', () => {
    render(<ComponentName {...defaultProps} loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error states', () => {
    render(<ComponentName {...defaultProps} error="Test error" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ComponentName {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('component-container')).toHaveClass('custom-class');
  });
});
```

### 2. 集成测试模板

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import ComponentName from './ComponentName';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('ComponentName Integration', () => {
  it('should work with context', () => {
    renderWithProviders(<ComponentName />);
    // 测试与 context 的交互
  });

  it('should handle navigation', () => {
    renderWithProviders(<ComponentName />);
    // 测试路由导航
  });

  it('should make API calls', async () => {
    // Mock API calls
    jest.spyOn(api, 'fetchData').mockResolvedValue(mockData);
    
    renderWithProviders(<ComponentName />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded Data')).toBeInTheDocument();
    });
  });
});
```

## 开发检查清单

### 组件开发检查清单

- [ ] 组件名称符合 PascalCase 命名规范
- [ ] 文件名与组件名称一致
- [ ] 类型定义完整且准确
- [ ] Props 接口包含详细的 JSDoc 注释
- [ ] 组件具有默认 props
- [ ] 组件具有 PropTypes 或 TypeScript 类型检查
- [ ] 组件具有适当的错误边界处理
- [ ] 组件具有加载状态处理
- [ ] 组件具有空状态处理
- [ ] 组件响应式设计完成
- [ ] 组件支持无障碍访问
- [ ] 组件样式模块化
- [ ] 组件具有完整的单元测试
- [ ] 组件具有集成测试
- [ ] 组件性能优化（useMemo, useCallback）
- [ ] 组件文档完整

### 性能优化检查清单

- [ ] 使用 React.memo 优化不必要的重渲染
- [ ] 使用 useMemo 缓存计算结果
- [ ] 使用 useCallback 缓存事件处理函数
- [ ] 避免在渲染函数中创建新对象
- [ ] 使用虚拟滚动处理长列表
- [ ] 图片懒加载实现
- [ ] 代码分割和懒加载
- [ ] 组件卸载时清理副作用
- [ ] 避免过度的重新渲染

### 无障碍访问检查清单

- [ ] 所有可交互元素具有适当的 ARIA 属性
- [ ] 图片具有 alt 文本
- [ ] 表单元素具有 label
- [ ] 颜色对比度符合 WCAG 标准
- [ ] 键盘导航支持
- [ ] 屏幕阅读器支持
- [ ] 焦点管理正确
- [ ] 动画和过渡效果可控制

---

这个模板提供了完整的 React 组件开发规范和最佳实践。请根据具体需求调整模板内容。