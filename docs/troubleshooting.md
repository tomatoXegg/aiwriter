# 故障排除指南

## 概述

本文档提供了 AI Writer 项目开发和使用过程中常见问题的解决方案。如果您遇到问题，请首先查看本文档。

## 开发环境问题

### 1. Node.js 和 npm 问题

#### 问题：Node.js 版本不兼容
```bash
# 错误信息
Error: Node.js version 16.x is not supported. Please use Node.js 18.x or higher.

# 解决方案
# 检查当前版本
node --version
npm --version

# 使用 nvm 切换版本
nvm install 18
nvm use 18

# 或者更新 Node.js
# 下载并安装最新的 Node.js 18.x LTS
```

#### 问题：npm 权限错误
```bash
# 错误信息
npm ERR! EACCES: permission denied

# 解决方案
# 方法 1：使用 npx
npx create-react-app my-app

# 方法 2：修复 npm 权限
sudo chown -R $(whoami) ~/.npm

# 方法 3：使用 nvm 管理 Node.js
# nvm 会自动处理权限问题
```

#### 问题：依赖安装失败
```bash
# 错误信息
npm ERR! network request failed
npm ERR! errno ECONNRESET

# 解决方案
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 如果还是失败，尝试使用不同的 registry
npm config set registry https://registry.npmjs.org/
```

### 2. 项目启动问题

#### 问题：端口被占用
```bash
# 错误信息
Error: listen EADDRINUSE :::3000

# 解决方案
# 查找占用端口的进程
# macOS/Linux
lsof -i :3000
netstat -an | grep 3000

# Windows
netstat -ano | findstr :3000

# 终止进程
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F

# 或者修改端口
# 在 .env 文件中修改 PORT 配置
PORT=3001 npm run dev
```

#### 问题：环境变量未设置
```bash
# 错误信息
Error: GEMINI_API_KEY is not defined

# 解决方案
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env

# 添加必需的环境变量
GEMINI_API_KEY=your_actual_api_key
JWT_SECRET=your_jwt_secret

# 重新加载环境变量
source .env
```

#### 问题：数据库连接失败
```bash
# 错误信息
Error: SQLITE_CANTOPEN: unable to open database file

# 解决方案
# 检查数据库目录
ls -la database/

# 创建数据库目录
mkdir -p database

# 检查权限
chmod 755 database/

# 重新初始化数据库
npm run db:init
```

### 3. 构建问题

#### 问题：TypeScript 编译错误
```bash
# 错误信息
error TS2304: Cannot find name 'React'

# 解决方案
# 安装类型定义
npm install --save-dev @types/react @types/node

# 检查 tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}

# 重新启动开发服务器
npm run dev
```

#### 问题：Webpack 构建失败
```bash
# 错误信息
Module not found: Error: Can't resolve 'module-name'

# 解决方案
# 检查模块是否安装
npm list module-name

# 安装缺失的模块
npm install module-name

# 检查导入路径
import Module from 'module-name'; // 正确
import Module from './module-name'; // 相对路径
```

## 前端问题

### 1. React 组件问题

#### 问题：组件不渲染
```typescript
// 常见原因
// 1. 组件名称错误
import UserProfile from './UserProfile'; // 文件名是 userProfile.tsx

// 解决方案：检查文件名和导入路径
import UserProfile from './userProfile'; // 正确

// 2. 条件渲染问题
const Component = () => {
  const [data, setData] = useState(null);
  
  // 错误：data 为 null 时尝试访问属性
  return <div>{data.name}</div>; // 会报错
  
  // 解决方案：添加条件检查
  return data ? <div>{data.name}</div> : <div>Loading...</div>;
};
```

#### 问题：Hooks 使用错误
```typescript
// 常见错误
// 1. 在条件语句中使用 Hooks
if (condition) {
  useState(initialState); // 错误
}

// 解决方案：将条件逻辑移到 Hook 内部
const [state, setState] = useState(initialState);
if (condition) {
  setState(newState); // 正确
}

// 2. Hook 顺序问题
const Component = () => {
  const [state, setState] = useState(initialState);
  
  if (condition) {
    useEffect(() => { /* ... */ }, []); // 错误：Hook 顺序可能改变
  }
  
  const [count, setCount] = useState(0); // 可能会在条件语句之后执行
};

// 解决方案：保持 Hook 顺序一致
const Component = () => {
  const [state, setState] = useState(initialState);
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (condition) {
      // 条件逻辑
    }
  }, [condition]);
};
```

#### 问题：状态更新问题
```typescript
// 常见错误
// 1. 直接修改状态
const Component = () => {
  const [user, setUser] = useState({ name: 'John' });
  
  const updateName = () => {
    user.name = 'Jane'; // 错误：直接修改状态
    setUser(user); // 不会触发重新渲染
  };
  
  // 解决方案：创建新对象
  const updateName = () => {
    setUser({ ...user, name: 'Jane' }); // 正确
  };
};

// 2. 异步状态更新
const Component = () => {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    setCount(count + 1); // 可能会使用旧的 count 值
    setCount(prevCount => prevCount + 1); // 正确：使用函数形式
  };
};
```

### 2. 路由问题

#### 问题：路由不匹配
```typescript
// 常见错误
// 1. 路径配置错误
<Routes>
  <Route path="/user/:id" element={<UserProfile />} />
  <Route path="/user/profile" element={<UserProfile />} /> // 冲突
</Routes>

// 解决方案：调整路由顺序
<Routes>
  <Route path="/user/profile" element={<UserProfile />} />
  <Route path="/user/:id" element={<UserProfile />} />
</Routes>

// 2. 导航问题
const navigate = useNavigate();

// 错误：相对路径
navigate('/dashboard'); // 可能会跳转到错误的位置

// 解决方案：使用绝对路径或相对路径的正确方式
navigate('/dashboard'); // 从根路径开始
navigate('../dashboard'); // 相对路径
```

### 3. 样式问题

#### 问题：CSS 样式不生效
```css
/* 常见错误 */
/* 1. 选择器优先级问题 */
.container .button {
  background-color: blue;
}

.button {
  background-color: red; /* 可能被覆盖 */
}

/* 解决方案：提高优先级 */
.container .button {
  background-color: blue !important; /* 避免使用 !important */
}

/* 或者使用更具体的选择器 */
.container .button.primary {
  background-color: blue;
}

/* 2. CSS Modules 命名问题 */
/* Button.module.css */
.button {
  background-color: blue;
}

/* Component.tsx */
import styles from './Button.module.css';

function Button() {
  return (
    <button className={styles.button}>Click me</button> // 正确
    // <button className="button">Click me</button> // 错误
  );
}
```

#### 问题：Tailwind CSS 样式不生效
```bash
# 解决方案
# 1. 检查 Tailwind 配置
# tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

# 2. 检查 CSS 导入
# index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

# 3. 重新启动开发服务器
npm run dev
```

## 后端问题

### 1. Express 服务器问题

#### 问题：服务器启动失败
```javascript
// 常见错误
// 1. 端口冲突
const express = require('express');
const app = express();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// 解决方案：使用环境变量
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 2. 中间件顺序错误
app.use(express.json());
app.use('/api', apiRoutes); // 正确
app.use(cors()); // 错误：应该在路由之前

// 解决方案：调整中间件顺序
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
```

#### 问题：CORS 错误
```javascript
// 错误信息
Access to XMLHttpRequest at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy

// 解决方案
// 安装 cors 中间件
npm install cors

// 配置 CORS
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// 或者手动设置 CORS 头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

### 2. 数据库问题

#### 问题：SQLite 数据库锁定
```bash
# 错误信息
Error: SQLITE_BUSY: database is locked

# 解决方案
# 1. 检查是否有其他进程在使用数据库
lsof database/aiwriter.db

# 2. 关闭所有数据库连接
# 在应用中确保正确关闭连接

# 3. 删除数据库文件（谨慎使用）
rm database/aiwriter.db
npm run db:init

# 4. 使用 WAL 模式
# 在数据库连接时启用 WAL 模式
db.exec('PRAGMA journal_mode=WAL');
```

#### 问题：数据库迁移失败
```bash
# 错误信息
Error: SQLITE_ERROR: table "users" already exists

# 解决方案
# 1. 检查迁移脚本
# 确保迁移脚本有幂等性
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 其他字段
);

# 2. 重置数据库
npm run db:reset

# 3. 手动修复数据库
sqlite3 database/aiwriter.db
DROP TABLE IF EXISTS users;
.exit
```

### 3. API 问题

#### 问题：API 请求失败
```javascript
// 常见错误
// 1. 错误处理不完整
app.get('/api/users', async (req, res) => {
  const users = await User.findAll(); // 可能抛出错误
  res.json(users);
});

// 解决方案：添加错误处理
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users',
      },
    });
  }
});

// 2. 异步错误处理
app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user',
        },
      });
    }
  }
});
```

#### 问题：请求体解析错误
```javascript
// 错误信息
TypeError: Cannot read property 'username' of undefined

// 解决方案
// 1. 添加 JSON 解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 验证请求体
app.post('/api/users', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'Username, email, and password are required',
      },
    });
  }
  
  // 处理用户创建
});
```

## 认证和安全问题

### 1. JWT 认证问题

#### 问题：Token 验证失败
```javascript
// 常见错误
// 1. Token 格式错误
const token = req.headers.authorization; // Bearer token
const decoded = jwt.verify(token, process.env.JWT_SECRET); // 错误

// 解决方案：正确提取 token
const token = req.headers.authorization?.replace('Bearer ', '');
if (!token) {
  return res.status(401).json({
    success: false,
    error: {
      code: 'MISSING_TOKEN',
      message: 'Access token is required',
    },
  });
}

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
} catch (error) {
  return res.status(401).json({
    success: false,
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid access token',
    },
  });
}

// 2. Token 过期处理
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  if (err && err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
      },
    });
  }
  // 其他处理
});
```

### 2. 密码加密问题

#### 问题：密码验证失败
```javascript
// 常见错误
// 1. 使用不安全的加密方式
const hashedPassword = crypto.createHash('md5').update(password).digest('hex'); // 不安全

// 解决方案：使用 bcrypt
const bcrypt = require('bcrypt');

// 密码加密
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// 密码验证
const isMatch = await bcrypt.compare(password, hashedPassword);

// 2. 密码长度验证
if (password.length < 8) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_PASSWORD',
      message: 'Password must be at least 8 characters long',
    },
  });
}
```

## 性能问题

### 1. 前端性能问题

#### 问题：页面加载缓慢
```javascript
// 解决方案
// 1. 代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// 2. 图片优化
import Image from 'next/image';

function MyComponent() {
  return (
    <Image
      src="/path/to/image.jpg"
      alt="Description"
      width={500}
      height={300}
      loading="lazy"
    />
  );
}

// 3. 缓存优化
import { useMemo, useCallback } from 'react';

function MyComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true,
    }));
  }, [data]);

  const handleClick = useCallback(() => {
    // 处理点击事件
  }, []);

  return (
    <div>
      {processedData.map(item => (
        <button key={item.id} onClick={handleClick}>
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

### 2. 后端性能问题

#### 问题：API 响应缓慢
```javascript
// 解决方案
// 1. 数据库查询优化
// 添加索引
CREATE INDEX idx_users_email ON users(email);

// 使用分页
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const users = await User.findAll({
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  res.json(users);
});

// 2. 缓存策略
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10分钟缓存

app.get('/api/users', async (req, res) => {
  const cacheKey = 'users:' + JSON.stringify(req.query);
  const cachedUsers = cache.get(cacheKey);

  if (cachedUsers) {
    return res.json(cachedUsers);
  }

  const users = await User.findAll(req.query);
  cache.set(cacheKey, users);
  res.json(users);
});

// 3. 连接池
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.get('/api/data', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM data');
    res.json(result.rows);
  } finally {
    client.release();
  }
});
```

## 测试问题

### 1. 测试运行失败

#### 问题：测试超时
```javascript
// 解决方案
// 1. 增加测试超时时间
describe('Long running test', () => {
  jest.setTimeout(30000); // 30秒超时
  
  it('should complete long operation', async () => {
    // 测试代码
  });
});

// 2. 使用 mock 替代长时间操作
jest.mock('./api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' }),
}));

// 3. 并行测试
describe('Parallel tests', () => {
  it('should run in parallel', async () => {
    // 测试代码
  });
});
```

#### 问题：Mock 不生效
```javascript
// 解决方案
// 1. 正确设置 mock
jest.mock('./module', () => ({
  functionName: jest.fn(),
}));

// 2. 在测试中配置 mock
beforeEach(() => {
  const mockModule = require('./module');
  mockModule.functionName.mockResolvedValue('test');
});

// 3. 清除 mock
afterEach(() => {
  jest.clearAllMocks();
});
```

## 部署问题

### 1. 构建失败

#### 问题：生产环境构建失败
```bash
# 解决方案
# 1. 检查环境变量
echo $NODE_ENV
export NODE_ENV=production

# 2. 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 3. 检查依赖版本
npm outdated
npm update

# 4. 增加内存
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 2. 服务器配置问题

#### 问题：Nginx 配置错误
```nginx
# 解决方案
# 检查 Nginx 配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 正确的 Nginx 配置示例
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 调试技巧

### 1. 前端调试

#### 使用浏览器开发者工具
```javascript
// 1. Console 调试
console.log('Debug info:', variable);
console.warn('Warning:', variable);
console.error('Error:', variable);

// 2. 断点调试
// 在浏览器开发者工具中设置断点

// 3. Network 面板
// 检查 API 请求和响应

// 4. Performance 面板
// 分析性能瓶颈
```

#### 使用 React Developer Tools
```javascript
// 1. 组件检查
// 检查组件状态和 props

// 2. 性能分析
// 使用 Profiler 组件分析性能

// 3. Redux DevTools
// 调试状态管理
```

### 2. 后端调试

#### 使用 Node.js 调试器
```javascript
// 1. 使用 --inspect 标志
node --inspect index.js

// 2. 使用 VS Code 调试
// 配置 launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Node.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/index.js",
      "runtimeExecutable": "${workspaceFolder}/.venv/bin/node",
      "outputCapture": "std"
    }
  ]
}

// 3. 使用 console.log
console.log('Debug info:', variable);
console.error('Error:', error);

// 4. 使用调试器
debugger; // 代码会在此处暂停
```

#### 使用日志记录
```javascript
// 1. 使用 winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 2. 记录错误
logger.error('Error occurred:', error);

// 3. 记录信息
logger.info('Processing request:', req.body);
```

## 获取帮助

### 1. 社区支持

- **GitHub Issues**: [提交问题](https://github.com/your-repo/aiwriter/issues)
- **讨论区**: [GitHub Discussions](https://github.com/your-repo/aiwriter/discussions)
- **Stack Overflow**: 使用标签 #aiwriter

### 2. 联系方式

- **邮件**: [your-email@example.com](mailto:your-email@example.com)
- **Slack**: [加入我们的 Slack 频道](https://aiwriter.slack.com)
- **文档**: [完整文档](https://docs.aiwriter.com)

### 3. 报告问题的模板

```
## 问题描述
简要描述您遇到的问题

## 复现步骤
1. 执行步骤 1
2. 执行步骤 2
3. 观察到的问题

## 期望行为
描述您期望的行为

## 实际行为
描述实际发生的行为

## 错误信息
粘贴完整的错误信息

## 环境信息
- 操作系统: [例如 Ubuntu 20.04]
- Node.js 版本: [例如 18.16.0]
- 浏览器: [例如 Chrome 114]
- 项目版本: [例如 1.0.0]

## 附加信息
任何其他有用的信息，如截图、日志等
```

## 总结

本故障排除指南涵盖了 AI Writer 项目中最常见的问题和解决方案。如果您遇到的问题不在本文档中，请参考获取帮助部分寻求支持。

### 关键要点
- **系统化排查**: 从简单到复杂逐步排查问题
- **日志记录**: 充分利用日志和调试工具
- **社区支持**: 善用社区资源获取帮助
- **持续改进**: 定期更新故障排除指南

通过遵循这些指南，您可以快速解决大多数开发和使用中的问题。