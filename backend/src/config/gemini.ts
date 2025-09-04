import dotenv from 'dotenv';

dotenv.config();

export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeout: number;
  maxRetries: number;
  rateLimit: {
    requests: number;
    window: number;
  };
  models: {
    [key: string]: {
      name: string;
      maxTokens: number;
      supportedFeatures: string[];
    };
  };
  safetySettings: {
    [key: string]: {
      category: string;
      threshold: string;
    };
  };
}

const defaultConfig: GeminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-pro',
  baseUrl: process.env.GEMINI_BASE_URL,
  timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '3'),
  rateLimit: {
    requests: parseInt(process.env.GEMINI_RATE_LIMIT_REQUESTS || '60'),
    window: parseInt(process.env.GEMINI_RATE_LIMIT_WINDOW || '60000')
  },
  models: {
    'gemini-pro': {
      name: 'Gemini Pro',
      maxTokens: 32768,
      supportedFeatures: ['text-generation', 'chat', 'topics', 'review']
    },
    'gemini-pro-vision': {
      name: 'Gemini Pro Vision',
      maxTokens: 16384,
      supportedFeatures: ['text-generation', 'image-understanding']
    },
    'gemini-1.5-pro': {
      name: 'Gemini 1.5 Pro',
      maxTokens: 2097152,
      supportedFeatures: ['text-generation', 'chat', 'topics', 'review', 'long-context']
    },
    'gemini-1.5-flash': {
      name: 'Gemini 1.5 Flash',
      maxTokens: 1048576,
      supportedFeatures: ['text-generation', 'chat', 'fast-generation']
    }
  },
  safetySettings: {
    harassment: {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE'
    },
    hateSpeech: {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_NONE'
    },
    sexuallyExplicit: {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE'
    },
    dangerousContent: {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE'
    }
  }
};

class GeminiConfigManager {
  private config: GeminiConfig;

  constructor(config?: Partial<GeminiConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  getConfig(): GeminiConfig {
    if (!this.config.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    return this.config;
  }

  getModelConfig(modelName?: string) {
    const model = modelName || this.config.model;
    const modelConfig = this.config.models[model];
    
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }
    
    return modelConfig;
  }

  getSafetySettings() {
    return Object.values(this.config.safetySettings);
  }

  updateConfig(updates: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('GEMINI_API_KEY is required');
    }

    if (this.config.timeout < 1000 || this.config.timeout > 120000) {
      errors.push('GEMINI_TIMEOUT must be between 1000 and 120000ms');
    }

    if (this.config.maxRetries < 0 || this.config.maxRetries > 10) {
      errors.push('GEMINI_MAX_RETRIES must be between 0 and 10');
    }

    if (this.config.rateLimit.requests < 1 || this.config.rateLimit.requests > 1000) {
      errors.push('GEMINI_RATE_LIMIT_REQUESTS must be between 1 and 1000');
    }

    if (!this.config.models[this.config.model]) {
      errors.push(`Invalid model: ${this.config.model}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const geminiConfig = new GeminiConfigManager();
export default geminiConfig;