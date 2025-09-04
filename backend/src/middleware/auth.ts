import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // For now, we'll use a simple API key authentication
  // In a real application, you would use JWT or other authentication methods
  
  const apiKey = req.headers['x-api-key'] || req.headers.authorization;
  
  if (!apiKey) {
    throw new AppError('API key is required', 401);
  }
  
  // Simple API key validation (in production, use proper key management)
  const validApiKey = process.env.API_KEY || 'your-api-key-here';
  
  if (apiKey !== validApiKey) {
    throw new AppError('Invalid API key', 401);
  }
  
  // Add user info to request (mock data for now)
  req.user = {
    id: 'user-1',
    username: 'admin',
    role: 'admin'
  };
  
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    
    next();
  };
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers.authorization;
    const validApiKey = process.env.API_KEY || 'your-api-key-here';
    
    if (apiKey && apiKey === validApiKey) {
      req.user = {
        id: 'user-1',
        username: 'admin',
        role: 'admin'
      };
    }
  } catch (error) {
    // Continue without authentication
  }
  
  next();
};