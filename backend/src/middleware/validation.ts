import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    // Validate body
    if (req.body) {
      Object.keys(schema).forEach(key => {
        const rule = schema[key];
        const value = req.body[key];
        
        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`${key} is required`);
          return;
        }
        
        // Skip validation if field is not required and not provided
        if (!rule.required && (value === undefined || value === null)) {
          return;
        }
        
        // Type validation
        if (rule.type) {
          switch (rule.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`${key} must be a string`);
              } else if (rule.min && value.length < rule.min) {
                errors.push(`${key} must be at least ${rule.min} characters long`);
              } else if (rule.max && value.length > rule.max) {
                errors.push(`${key} must be no more than ${rule.max} characters long`);
              } else if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${key} format is invalid`);
              }
              break;
            case 'number':
              if (typeof value !== 'number') {
                errors.push(`${key} must be a number`);
              } else if (rule.min !== undefined && value < rule.min) {
                errors.push(`${key} must be at least ${rule.min}`);
              } else if (rule.max !== undefined && value > rule.max) {
                errors.push(`${key} must be no more than ${rule.max}`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                errors.push(`${key} must be a boolean`);
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                errors.push(`${key} must be an array`);
              }
              break;
            case 'object':
              if (typeof value !== 'object' || value === null) {
                errors.push(`${key} must be an object`);
              }
              break;
          }
        }
        
        // Custom validation
        if (rule.custom) {
          const result = rule.custom(value);
          if (result !== true) {
            errors.push(result as string || `${key} is invalid`);
          }
        }
      });
    }
    
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
    }
    
    next();
  };
};

// Common validation schemas
export const validationSchemas = {
  account: {
    name: { required: true, type: 'string' as const, min: 1, max: 100 },
    description: { type: 'string' as const, max: 500 },
    platform: { 
      type: 'string' as const, 
      min: 1, 
      max: 50,
      custom: (value: string) => {
        const validPlatforms = ['wechat', 'weibo', 'zhihu', 'other'];
        return validPlatforms.includes(value) || 'Platform must be one of: wechat, weibo, zhihu, other';
      }
    }
  },

  accountUpdate: {
    name: { type: 'string' as const, min: 1, max: 100 },
    description: { type: 'string' as const, max: 500 },
    platform: { 
      type: 'string' as const, 
      min: 1, 
      max: 50,
      custom: (value: string) => {
        const validPlatforms = ['wechat', 'weibo', 'zhihu', 'other'];
        return validPlatforms.includes(value) || 'Platform must be one of: wechat, weibo, zhihu, other';
      }
    },
    status: {
      type: 'string' as const,
      custom: (value: string) => {
        const validStatuses = ['active', 'inactive', 'suspended'];
        return validStatuses.includes(value) || 'Status must be one of: active, inactive, suspended';
      }
    }
  },

  bulkStatusUpdate: {
    accountIds: { 
      required: true, 
      type: 'array' as const,
      custom: (value: any[]) => {
        return Array.isArray(value) && value.length > 0 || 'Account IDs must be a non-empty array';
      }
    },
    status: {
      required: true,
      type: 'string' as const,
      custom: (value: string) => {
        const validStatuses = ['active', 'inactive', 'suspended'];
        return validStatuses.includes(value) || 'Status must be one of: active, inactive, suspended';
      }
    }
  },
  
  material: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    content: { required: true, type: 'string', min: 1 },
    tags: { type: 'array' },
    type: { type: 'string', min: 1, max: 50 }
  },
  
  topic: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    description: { type: 'string', max: 1000 },
    material_id: { type: 'string' },
    prompt: { type: 'string' }
  },
  
  content: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    body: { required: true, type: 'string', min: 1 },
    topic_id: { type: 'string' },
    account_id: { type: 'string' },
    prompt: { type: 'string' }
  },
  
  review: {
    content_id: { required: true, type: 'string' },
    quality: { type: 'number', min: 1, max: 10 },
    originality: { type: 'number', min: 1, max: 10 },
    suggestions: { type: 'array' }
  }
};