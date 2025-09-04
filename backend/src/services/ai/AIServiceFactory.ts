import { IServiceFactory, IAIService, ServiceConfig } from '../interfaces';
import { GeminiServiceAdapter } from '../adapters/GeminiServiceAdapter';

export class AIServiceFactory implements IServiceFactory {
  private static instance: AIServiceFactory;
  private serviceTypes: Map<string, (config: ServiceConfig) => IAIService> = new Map();

  private constructor() {
    this.registerDefaultServices();
  }

  static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  async createService(type: string, config: ServiceConfig): Promise<IAIService> {
    const constructor = this.serviceTypes.get(type);
    if (!constructor) {
      throw new Error(`Unknown AI service type: ${type}`);
    }

    const service = constructor(config);
    await service.initialize();
    
    return service;
  }

  getSupportedTypes(): string[] {
    return Array.from(this.serviceTypes.keys());
  }

  registerServiceType(type: string, constructor: (config: ServiceConfig) => IAIService): void {
    this.serviceTypes.set(type, constructor);
  }

  unregisterServiceType(type: string): void {
    this.serviceTypes.delete(type);
  }

  hasServiceType(type: string): boolean {
    return this.serviceTypes.has(type);
  }

  private registerDefaultServices(): void {
    // 注册 Gemini 服务
    this.registerServiceType('gemini', (config: ServiceConfig) => {
      return new GeminiServiceAdapter(config);
    });

    // 预留其他服务类型的注册
    // this.registerServiceType('openai', (config: ServiceConfig) => {
    //   return new OpenAIServiceAdapter(config);
    // });

    // this.registerServiceType('claude', (config: ServiceConfig) => {
    //   return new ClaudeServiceAdapter(config);
    // });
  }

  // 获取服务配置模板
  getConfigTemplate(type: string): Partial<ServiceConfig> | null {
    const templates: Record<string, Partial<ServiceConfig>> = {
      gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        timeout: 30000,
        maxRetries: 3,
        enabled: true,
        weight: 1,
        rateLimit: {
          requests: 60,
          window: 60000
        },
        retryPolicy: {
          maxAttempts: 3,
          backoffFactor: 2,
          maxDelay: 10000
        },
        circuitBreaker: {
          failureThreshold: 50,
          recoveryTimeout: 60000,
          expectedException: ['timeout', 'rate_limit', 'network_error']
        },
        cache: {
          enabled: true,
          ttl: 1800,
          maxSize: 1000
        }
      },
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        timeout: 30000,
        maxRetries: 3,
        enabled: true,
        weight: 1,
        rateLimit: {
          requests: 60,
          window: 60000
        },
        retryPolicy: {
          maxAttempts: 3,
          backoffFactor: 2,
          maxDelay: 10000
        },
        circuitBreaker: {
          failureThreshold: 50,
          recoveryTimeout: 60000,
          expectedException: ['timeout', 'rate_limit', 'network_error']
        },
        cache: {
          enabled: true,
          ttl: 1800,
          maxSize: 1000
        }
      },
      claude: {
        baseUrl: 'https://api.anthropic.com',
        timeout: 30000,
        maxRetries: 3,
        enabled: true,
        weight: 1,
        rateLimit: {
          requests: 60,
          window: 60000
        },
        retryPolicy: {
          maxAttempts: 3,
          backoffFactor: 2,
          maxDelay: 10000
        },
        circuitBreaker: {
          failureThreshold: 50,
          recoveryTimeout: 60000,
          expectedException: ['timeout', 'rate_limit', 'network_error']
        },
        cache: {
          enabled: true,
          ttl: 1800,
          maxSize: 1000
        }
      }
    };

    return templates[type] || null;
  }

  // 验证服务配置
  validateConfig(type: string, config: ServiceConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 通用验证
    if (!config.name || config.name.trim() === '') {
      errors.push('Service name is required');
    }

    if (!config.model || config.model.trim() === '') {
      errors.push('Model is required');
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 120000)) {
      errors.push('Timeout must be between 1000 and 120000 ms');
    }

    if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
      errors.push('Max retries must be between 0 and 10');
    }

    // 特定服务的验证
    switch (type) {
      case 'gemini':
        if (!config.apiKey) {
          errors.push('API key is required for Gemini service');
        }
        break;
      
      case 'openai':
        if (!config.apiKey) {
          errors.push('API key is required for OpenAI service');
        }
        break;
      
      case 'claude':
        if (!config.apiKey) {
          errors.push('API key is required for Claude service');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 创建服务配置的默认值
  createDefaultConfig(type: string, name: string, overrides: Partial<ServiceConfig> = {}): ServiceConfig {
    const template = this.getConfigTemplate(type);
    if (!template) {
      throw new Error(`No config template found for service type: ${type}`);
    }

    // 获取该类型的默认模型
    const defaultModels: Record<string, string> = {
      gemini: 'gemini-pro',
      openai: 'gpt-3.5-turbo',
      claude: 'claude-3-sonnet-20240229'
    };

    return {
      name,
      type: type as any,
      model: defaultModels[type] || 'default',
      ...template,
      ...overrides
    } as ServiceConfig;
  }
}