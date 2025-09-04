import { ICacheManager } from '../interfaces';
import { CacheConfig } from '../types';
import NodeCache from 'node-cache';
import { EventEmitter } from 'events';

// 动态导入Redis类型
let RedisClientType: any;
let createClient: any;

try {
  const redis = require('redis');
  RedisClientType = redis.RedisClientType;
  createClient = redis.createClient;
} catch (error) {
  console.warn('Redis not available, falling back to memory cache only');
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  redisConnected?: boolean;
  lastCleanup: Date;
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  metadata?: Record<string, any>;
}

export class MemoryCache {
  private cache: NodeCache;
  private stats: CacheStats;

  constructor(options: { stdTTL?: number; checkperiod?: number; useClones?: boolean } = {}) {
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 3600,
      checkperiod: options.checkperiod || 600,
      useClones: options.useClones ?? true,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      lastCleanup: new Date(),
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.cache.on('set', () => this.updateStats());
    this.cache.on('del', () => this.updateStats());
    this.cache.on('expired', () => this.updateStats());
    this.cache.on('flush', () => this.updateStats());
  }

  private updateStats(): void {
    const nodeStats = this.cache.getStats();
    this.stats.totalKeys = nodeStats.keys;
    this.stats.memoryUsage = nodeStats.vsize;
    this.stats.hitRate = this.calculateHitRate();
    this.stats.lastCleanup = new Date();
  }

  private calculateHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    this.cache.del(key);
  }

  async clear(): Promise<void> {
    this.cache.flushAll();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  keys(): string[] {
    return this.cache.keys();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getTTL(key: string): number | undefined {
    return this.cache.getTTL(key);
  }
}

export class RedisCache {
  private client: any = null;
  private config: CacheConfig['redis'];
  private connected = false;
  private connectionPromise: Promise<void> | null = null;
  private redisAvailable = false;

  constructor(config: CacheConfig['redis']) {
    this.config = config;
    this.redisAvailable = !!createClient;
  }

  async connect(): Promise<void> {
    if (!this.redisAvailable) {
      console.warn('Redis client not available, skipping connection');
      return;
    }

    if (this.connected) return;

    if (!this.connectionPromise) {
      this.connectionPromise = this.establishConnection();
    }

    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: this.config!.host,
          port: this.config!.port,
        },
        password: this.config!.password,
        database: this.config!.db,
      });

      this.client.on('error', (err: any) => {
        console.error('Redis client error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.connected = false;
      this.redisAvailable = false;
    }
  }

  private getFullKey(key: string): string {
    return `${this.config!.keyPrefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisAvailable) {
      return null;
    }

    if (!this.connected && this.client) {
      await this.connect();
    }

    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.redisAvailable) {
      return;
    }

    if (!this.connected && this.client) {
      await this.connect();
    }

    if (!this.client || !this.connected) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(fullKey, ttl, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redisAvailable || !this.client || !this.connected) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(pattern?: string): Promise<number> {
    if (!this.redisAvailable || !this.client || !this.connected) {
      return 0;
    }

    try {
      if (pattern) {
        const keys = await this.client.keys(`${this.config!.keyPrefix}:${pattern}`);
        if (keys.length > 0) {
          return await this.client.del(keys);
        }
      } else {
        const keys = await this.client.keys(`${this.config!.keyPrefix}:*`);
        if (keys.length > 0) {
          return await this.client.del(keys);
        }
      }
      return 0;
    } catch (error) {
      console.error('Redis clear error:', error);
      return 0;
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.redisAvailable || !this.client) return false;
    
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.redisAvailable && this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

export class HybridCacheManager extends EventEmitter implements ICacheManager {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache | null = null;
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    
    this.memoryCache = new MemoryCache({
      stdTTL: Math.min(config.ttl, 1800), // 内存缓存最多30分钟
      checkperiod: 300,
    });

    if (config.type === 'redis' || config.type === 'hybrid') {
      if (config.redis && createClient) {
        this.redisCache = new RedisCache(config.redis);
        this.redisCache.connect().catch(console.error);
      } else if (!createClient) {
        console.warn('Redis not available, falling back to memory cache only');
      }
    }

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      lastCleanup: new Date(),
    };
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. 先检查内存缓存
    const memoryResult = await this.memoryCache.get<CacheEntry<T>>(key);
    if (memoryResult) {
      this.stats.hits++;
      return memoryResult.value;
    }

    // 2. 检查Redis缓存
    if (this.redisCache) {
      const redisResult = await this.redisCache.get<CacheEntry<T>>(key);
      if (redisResult) {
        // 回填内存缓存
        const memoryTTL = Math.min(
          redisResult.ttl - (Date.now() - redisResult.timestamp) / 1000,
          1800
        );
        if (memoryTTL > 0) {
          await this.memoryCache.set(key, redisResult, memoryTTL);
        }
        this.stats.hits++;
        return redisResult.value;
      }
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.config.ttl;
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: actualTTL * 1000, // 转换为毫秒
      accessCount: 0,
    };

    // 1. 设置内存缓存
    await this.memoryCache.set(key, entry, Math.min(actualTTL, 1800));

    // 2. 设置Redis缓存
    if (this.redisCache && (this.config.type === 'redis' || this.config.type === 'hybrid')) {
      await this.redisCache.set(key, entry, actualTTL);
    }
  }

  async delete(key: string): Promise<void> {
    await this.memoryCache.delete(key);
    if (this.redisCache) {
      await this.redisCache.delete(key);
    }
  }

  async clear(pattern?: string): Promise<number> {
    let clearedCount = 0;

    // 清理内存缓存
    if (pattern) {
      const memoryKeys = this.memoryCache.keys();
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete = memoryKeys.filter(key => regex.test(key));
      
      for (const key of keysToDelete) {
        await this.memoryCache.delete(key);
        clearedCount++;
      }
    } else {
      await this.memoryCache.clear();
      clearedCount = this.memoryCache.keys().length;
    }

    // 清理Redis缓存
    if (this.redisCache) {
      const redisCleared = await this.redisCache.clear(pattern);
      clearedCount += redisCleared;
    }

    return clearedCount;
  }

  async getStats(): Promise<CacheStats> {
    const memoryStats = this.memoryCache.getStats();
    
    this.stats = {
      hits: memoryStats.hits,
      misses: memoryStats.misses,
      hitRate: memoryStats.hitRate,
      totalKeys: memoryStats.totalKeys,
      memoryUsage: memoryStats.memoryUsage,
      redisConnected: this.redisCache ? await this.redisCache.isConnected() : undefined,
      lastCleanup: memoryStats.lastCleanup,
    };

    return { ...this.stats };
  }

  generateKey(service: string, operation: string, params: any): string {
    // 创建标准化的缓存键
    const normalizedParams = this.normalizeParams(params);
    const paramString = JSON.stringify(normalizedParams);
    const hash = require('crypto')
      .createHash('sha256')
      .update(paramString)
      .digest('hex')
      .substring(0, 16);
    
    return `${service}:${operation}:${hash}`;
  }

  private normalizeParams(params: any): any {
    // 移除不影响结果的参数
    const { userId, metadata, ...relevantParams } = params;
    return relevantParams;
  }

  // 预热缓存
  async warmup(keys: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await Promise.all(
        batch.map(({ key, value, ttl }) => this.set(key, value, ttl))
      );
      
      // 避免过载
      if (i + batchSize < keys.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // 缓存淘汰策略
  async evict(pattern: string, strategy: 'lru' | 'lfu' | 'fifo' = 'lru'): Promise<number> {
    // 这里可以实现更复杂的淘汰策略
    // 目前使用简单的模式匹配删除
    return this.clear(pattern);
  }

  async close(): Promise<void> {
    if (this.redisCache) {
      await this.redisCache.close();
    }
  }
}

// 缓存管理器工厂
export class CacheManagerFactory {
  static create(config: CacheConfig): ICacheManager {
    switch (config.type) {
      case 'memory':
        return new MemoryCache({ stdTTL: config.ttl });
      case 'redis':
        return new HybridCacheManager({ ...config, type: 'redis' });
      case 'hybrid':
        return new HybridCacheManager(config);
      default:
        throw new Error(`Unknown cache type: ${config.type}`);
    }
  }
}