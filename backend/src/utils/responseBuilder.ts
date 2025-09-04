import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ResponseBuilder {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    error: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };
    
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(
    res: Response,
    error: string = 'Bad request',
    details?: any
  ): Response {
    return this.error(res, error, 400, details);
  }

  static unauthorized(
    res: Response,
    error: string = 'Unauthorized'
  ): Response {
    return this.error(res, error, 401);
  }

  static forbidden(
    res: Response,
    error: string = 'Forbidden'
  ): Response {
    return this.error(res, error, 403);
  }

  static notFound(
    res: Response,
    error: string = 'Resource not found'
  ): Response {
    return this.error(res, error, 404);
  }

  static validationError(
    res: Response,
    error: string,
    details?: any
  ): Response {
    return this.error(res, error, 422, details);
  }
}

export default ResponseBuilder;