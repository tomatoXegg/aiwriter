import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// 创建 Gemini API 专用的限流器
const geminiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每个 IP 每分钟最多30个请求
  message: {
    success: false,
    error: 'Gemini API rate limit exceeded. Please wait a minute before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Gemini API rate limit exceeded. Please wait a minute before trying again.',
      retryAfter: 60
    });
  }
});

// 为不同的端点创建不同的限流策略
const generateRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 内容生成限制更严格
  message: {
    success: false,
    error: 'Content generation rate limit exceeded. Please wait before trying again.'
  }
});

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 50, // 对话可以更频繁
  message: {
    success: false,
    error: 'Chat rate limit exceeded. Please slow down your requests.'
  }
});

// 中间件：检查 Gemini API 配置
export const checkGeminiConfig = (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'Gemini API is not configured. Please contact the administrator.',
      code: 'GEMINI_NOT_CONFIGURED'
    });
  }
  next();
};

// 中间件：验证请求大小
export const validateRequestSize = (maxSize: number = 10000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: `Request body too large. Maximum size is ${maxSize} bytes.`,
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

// 中间件：记录 API 使用情况
export const logApiUsage = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 重写 res.json 来记录响应
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // 这里可以添加日志记录逻辑
    console.log(`[Gemini API] ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
    
    return originalJson.call(this, data);
  };
  
  next();
};

// 导出限流中间件
export { geminiRateLimit, generateRateLimit, chatRateLimit };