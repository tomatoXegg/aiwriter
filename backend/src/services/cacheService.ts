import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';

export interface CacheOptions {
  stdTTL?: number; // 标准过期时间（秒）
  checkperiod?: number; // 检查过期项的时间间隔（秒）
  useClones?: boolean; // 是否返回克隆的数据
  deleteOnExpire?: boolean; // 过期时是否删除
  enableLegacyCallbacks?: boolean; // 是否启用旧版回调
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  ksize: number;
  vsize: number;
}

class CacheService {
  private cache: NodeCache;
  private stats: {
    hits: number;
    misses: number;
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 3600, // 默认1小时
      checkperiod: options.checkperiod || 600, // 默认10分钟
      useClones: options.useClones ?? true,
      deleteOnExpire: options.deleteOnExpire ?? true,
      enableLegacyCallbacks: options.enableLegacyCallbacks ?? false
    });

    this.stats = {
      hits: 0,
      misses: 0
    };

    // 监听缓存事件
    this.cache.on('set', () => this.logCacheEvent('SET'));
    this.cache.on('del', () => this.logCacheEvent('DEL'));
    this.cache.on('expired', () => this.logCacheEvent('EXPIRED'));
    this.cache.on('flush', () => this.logCacheEvent('FLUSH'));
  }

  private logCacheEvent(event: string): void {
    console.log(`[Cache] ${event} event occurred`);
  }

  // 设置缓存
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      return this.cache.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // 获取缓存
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        this.stats.hits++;
        return value;
      } else {
        this.stats.misses++;
        return undefined;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return undefined;
    }
  }

  // 检查键是否存在
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // 删除缓存
  del(key: string): number {
    return this.cache.del(key);
  }

  // 获取并删除
  take<T>(key: string): T | undefined {
    const value = this.get<T>(key);
    if (value !== undefined) {
      this.del(key);
    }
    return value;
  }

  // 设置键的过期时间
  ttl(key: string, ttl: number): boolean {
    return this.cache.ttl(key, ttl);
  }

  // 获取键的剩余时间
  getTTL(key: string): number | undefined {
    return this.cache.getTTL(key);
  }

  // 获取所有键
  keys(): string[] {
    return this.cache.keys();
  }

  // 获取缓存统计信息
  getStats(): CacheStats {
    const nodeStats = this.cache.getStats();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      keys: nodeStats.keys,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Number(hitRate.toFixed(2)),
      ksize: nodeStats.ksize,
      vsize: nodeStats.vsize
    };
  }

  // 清空缓存
  flushAll(): void {
    this.cache.flushAll();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  // 关闭缓存
  close(): void {
    this.cache.close();
  }

  // 获取或设置（如果不存在）
  getOrSet<T>(key: string, fn: () => T | Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return Promise.resolve(cachedValue);
    }

    return Promise.resolve(fn()).then(value => {
      this.set(key, value, ttl);
      return value;
    });
  }

  // 批量获取
  mget<T>(keys: string[]): Record<string, T | undefined> {
    return this.cache.mget<T>(keys);
  }

  // 批量设置
  mset<T>(keyValueTuples: [string, T][], ttl?: number): void {
    this.cache.mset(keyValueTuples, ttl);
  }

  // 批量删除
  mdel(keys: string[]): number {
    return this.cache.del(keys);
  }
}

// 创建不同的缓存实例
export const geminiResponseCache = new CacheService({
  stdTTL: 1800, // 30分钟
  checkperiod: 300 // 5分钟
});

export const chatSessionCache = new CacheService({
  stdTTL: 7200, // 2小时
  checkperiod: 600 // 10分钟
});

export const statisticsCache = new CacheService({
  stdTTL: 300, // 5分钟
  checkperiod: 60 // 1分钟
});

// 缓存键生成器
export class CacheKeyGenerator {
  static generateResponseKey(prompt: string, options: any = {}): string {
    const optionsStr = JSON.stringify(options);
    return `gemini:response:${Buffer.from(prompt + optionsStr).toString('base64')}`;
  }

  static generateTopicKey(material: string, options: any = {}): string {
    const optionsStr = JSON.stringify(options);
    return `gemini:topics:${Buffer.from(material + optionsStr).toString('base64')}`;
  }

  static generateChatKey(conversationId: string): string {
    return `gemini:chat:${conversationId}`;
  }

  static generateStatisticsKey(filters: any = {}): string {
    const filtersStr = JSON.stringify(filters);
    return `gemini:stats:${Buffer.from(filtersStr).toString('base64')}`;
  }

  static generatePattern(prefix: string): string {
    return `gemini:${prefix}:*`;
  }
}

export default CacheService;