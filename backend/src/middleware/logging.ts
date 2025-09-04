import { Request, Response, NextFunction } from 'express';

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  responseTime?: number;
  body?: any;
  params?: any;
  query?: any;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original end method
  const originalEnd = res.end;
  
  // Override end method to log response
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      statusCode: res.statusCode,
      responseTime
    };
    
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', {
        ...logEntry,
        body: req.body,
        params: req.params,
        query: req.query
      });
    } else {
      // Production logging - minimal info
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`);
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(err);
};