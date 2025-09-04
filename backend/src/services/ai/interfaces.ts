import { ServiceConfig, ServiceMetrics, HealthStatus, LoadBalancerConfig, CacheConfig } from './types';

export interface TextGenerationRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  userId?: string;
  metadata?: Record<string, any>;
}

export interface TextGenerationResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
    finishReason: string;
    cached?: boolean;
  };
}

export interface TopicGenerationRequest {
  material: string;
  count?: number;
  style?: string;
  targetAudience?: string;
  userId?: string;
}

export interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  audience: string;
  value: string;
  keywords: string[];
  score: number;
}

export interface TopicGenerationResponse {
  topics: TopicSuggestion[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
  };
}

export interface ContentOptimizationRequest {
  content: string;
  focus?: 'readability' | 'style' | 'structure' | 'seo';
  targetAudience?: string;
  userId?: string;
}

export interface OptimizationSuggestion {
  type: string;
  description: string;
  before: string;
  after: string;
}

export interface ContentOptimizationResponse {
  optimizedContent: string;
  improvements: OptimizationSuggestion[];
  score: number;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
  };
}

export interface ChatRequest {
  conversationId: string;
  message: string;
  context?: string;
  userId?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  conversationId: string;
  response: string;
  messages: ChatMessage[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
  };
}

export interface IAIService {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly config: ServiceConfig;
  
  // 核心功能
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  generateTopics(request: TopicGenerationRequest): Promise<TopicGenerationResponse>;
  optimizeContent(request: ContentOptimizationRequest): Promise<ContentOptimizationResponse>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  
  // 服务管理
  initialize(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  getMetrics(): Promise<ServiceMetrics>;
  updateConfig(config: Partial<ServiceConfig>): Promise<void>;
  
  // 缓存控制
  clearCache(pattern?: string): Promise<number>;
  getCacheStats(): Promise<any>;
}

export interface IServiceFactory {
  createService(type: string, config: ServiceConfig): Promise<IAIService>;
  getSupportedTypes(): string[];
}

export interface IServiceRegistry {
  register(service: IAIService): Promise<void>;
  unregister(serviceId: string): Promise<void>;
  getService(serviceId: string): IAIService | undefined;
  getAllServices(): IAIService[];
  getServicesByType(type: string): IAIService[];
}

export interface ILoadBalancer {
  selectService(request: any): Promise<IAIService>;
  updateServiceHealth(serviceId: string, health: HealthStatus): void;
  getMetrics(): Promise<any>;
}

export interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<number>;
  getStats(): Promise<any>;
  generateKey(service: string, operation: string, params: any): string;
}

export interface IMetricsCollector {
  recordRequest(serviceId: string, operation: string, duration: number, success: boolean, usage?: any): void;
  recordCacheHit(serviceId: string, operation: string): void;
  recordCacheMiss(serviceId: string, operation: string): void;
  recordError(serviceId: string, operation: string, error: Error): void;
  getMetrics(options?: MetricsQueryOptions): Promise<ServiceMetrics>;
}

export interface MetricsQueryOptions {
  serviceId?: string;
  operation?: string;
  startTime?: Date;
  endTime?: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  expectedExceptions: string[];
  monitoringPeriod?: number;
}

export interface ICircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  getMetrics(): any;
  reset(): void;
}