import { IMetricsCollector, MetricsQueryOptions, ServiceMetrics } from '../interfaces';
import { EventEmitter } from 'events';

export interface MetricRecord {
  timestamp: Date;
  serviceId: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  cached?: boolean;
}

export interface AggregatedMetrics {
  timestamp: Date;
  period: 'minute' | 'hour' | 'day';
  serviceId?: string;
  operation?: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalTokens: number;
  totalCost: number;
  cacheHits: number;
  cacheMisses: number;
  errorRate: number;
  availability: number;
}

export interface MetricsConfig {
  retentionPeriod: number; // 数据保留时间（毫秒）
  aggregationInterval: number; // 聚合间隔（毫秒）
  maxRecords: number; // 最大记录数
  enableAggregation: boolean;
}

export class MetricsCollector extends EventEmitter implements IMetricsCollector {
  private records: MetricRecord[] = [];
  private aggregatedMetrics: Map<string, AggregatedMetrics> = new Map();
  private config: MetricsConfig;
  private aggregationTimer?: NodeJS.Timeout;

  constructor(config: Partial<MetricsConfig> = {}) {
    super();
    this.config = {
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7天
      aggregationInterval: 60 * 1000, // 1分钟
      maxRecords: 100000,
      enableAggregation: true,
      ...config
    };

    if (this.config.enableAggregation) {
      this.startAggregation();
    }

    // 定期清理过期数据
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // 每小时清理一次
  }

  recordRequest(
    serviceId: string,
    operation: string,
    duration: number,
    success: boolean,
    usage?: any
  ): void {
    const record: MetricRecord = {
      timestamp: new Date(),
      serviceId,
      operation,
      duration,
      success,
      usage
    };

    this.records.push(record);

    // 如果超过最大记录数，删除最旧的记录
    if (this.records.length > this.config.maxRecords) {
      this.records = this.records.slice(-this.config.maxRecords);
    }

    this.emit('requestRecorded', record);
  }

  recordCacheHit(serviceId: string, operation: string): void {
    const record: MetricRecord = {
      timestamp: new Date(),
      serviceId,
      operation,
      duration: 0,
      success: true,
      cached: true
    };

    this.records.push(record);
    this.emit('cacheHit', { serviceId, operation });
  }

  recordCacheMiss(serviceId: string, operation: string): void {
    this.emit('cacheMiss', { serviceId, operation });
  }

  recordError(serviceId: string, operation: string, error: Error): void {
    const record: MetricRecord = {
      timestamp: new Date(),
      serviceId,
      operation,
      duration: 0,
      success: false,
      error: error.message
    };

    this.records.push(record);
    this.emit('errorRecorded', { serviceId, operation, error });
  }

  async getMetrics(options: MetricsQueryOptions = {}): Promise<ServiceMetrics> {
    let filteredRecords = this.records;

    // 应用过滤条件
    if (options.serviceId) {
      filteredRecords = filteredRecords.filter(r => r.serviceId === options.serviceId);
    }

    if (options.operation) {
      filteredRecords = filteredRecords.filter(r => r.operation === options.operation);
    }

    if (options.startTime) {
      filteredRecords = filteredRecords.filter(r => r.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      filteredRecords = filteredRecords.filter(r => r.timestamp <= options.endTime!);
    }

    // 如果没有记录，返回空指标
    if (filteredRecords.length === 0) {
      return this.createEmptyMetrics(options.serviceId || 'unknown');
    }

    // 计算指标
    const totalRequests = filteredRecords.length;
    const successRequests = filteredRecords.filter(r => r.success).length;
    const errorRequests = totalRequests - successRequests;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    const responseTimes = filteredRecords.map(r => r.duration).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    // 计算百分位
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // 计算token使用
    const totalTokens = filteredRecords.reduce((sum, r) => sum + (r.usage?.totalTokens || 0), 0);
    const promptTokens = filteredRecords.reduce((sum, r) => sum + (r.usage?.promptTokens || 0), 0);
    const completionTokens = filteredRecords.reduce((sum, r) => sum + (r.usage?.completionTokens || 0), 0);

    // 计算缓存命中率
    const cacheHits = filteredRecords.filter(r => r.cached).length;
    const cacheMisses = filteredRecords.filter(r => !r.cached && r.operation !== 'chat').length;
    const totalCacheOperations = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheOperations > 0 ? (cacheHits / totalCacheOperations) * 100 : 0;

    // 计算成本（简化版）
    const totalCost = filteredRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

    // 计算可用性
    const availability = totalRequests > 0 ? ((totalRequests - errorRequests) / totalRequests) * 100 : 100;

    return {
      serviceId: options.serviceId || 'all',
      timestamp: new Date(),
      requestCount: totalRequests,
      successCount: successRequests,
      errorCount: errorRequests,
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      p95ResponseTime,
      p99ResponseTime,
      tokenUsage: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      cost: Number(totalCost.toFixed(6)),
      cacheHits,
      cacheMisses,
      errorRate: Number(errorRate.toFixed(2)),
      availability: Number(availability.toFixed(2))
    };
  }

  // 获取实时指标
  getRealtimeMetrics(): {
    totalRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeServices: number;
  } {
    const now = Date.now();
    const lastMinute = now - 60000;
    
    const recentRecords = this.records.filter(r => r.timestamp.getTime() > lastMinute);
    const requestsPerSecond = recentRecords.length / 60;
    
    const averageResponseTime = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.duration, 0) / recentRecords.length
      : 0;
    
    const errorRate = recentRecords.length > 0
      ? (recentRecords.filter(r => !r.success).length / recentRecords.length) * 100
      : 0;
    
    const activeServices = new Set(recentRecords.map(r => r.serviceId)).size;

    return {
      totalRequests: this.records.length,
      requestsPerSecond: Number(requestsPerSecond.toFixed(2)),
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      errorRate: Number(errorRate.toFixed(2)),
      activeServices
    };
  }

  // 获取服务排名
  getServiceRanking(metric: 'requests' | 'responseTime' | 'errorRate' | 'cost', limit: number = 10): Array<{
    serviceId: string;
    value: number;
    rank: number;
  }> {
    const serviceMetrics = new Map<string, {
      requests: number;
      totalTime: number;
      errors: number;
      cost: number;
    }>();

    // 聚合每个服务的指标
    for (const record of this.records) {
      if (!serviceMetrics.has(record.serviceId)) {
        serviceMetrics.set(record.serviceId, {
          requests: 0,
          totalTime: 0,
          errors: 0,
          cost: 0
        });
      }

      const metrics = serviceMetrics.get(record.serviceId)!;
      metrics.requests++;
      metrics.totalTime += record.duration;
      if (!record.success) metrics.errors++;
      metrics.cost += record.cost || 0;
    }

    // 计算排名值
    const rankings: Array<{
      serviceId: string;
      value: number;
      rank: number;
    }> = [];

    for (const [serviceId, metrics] of serviceMetrics) {
      let value: number;
      
      switch (metric) {
        case 'requests':
          value = metrics.requests;
          break;
        case 'responseTime':
          value = metrics.requests > 0 ? metrics.totalTime / metrics.requests : 0;
          break;
        case 'errorRate':
          value = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
          break;
        case 'cost':
          value = metrics.cost;
          break;
      }

      rankings.push({ serviceId, value, rank: 0 });
    }

    // 排序并分配排名
    rankings.sort((a, b) => {
      // 对于错误率和响应时间，值越小排名越高
      if (metric === 'errorRate' || metric === 'responseTime') {
        return a.value - b.value;
      }
      return b.value - a.value;
    });

    rankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    return rankings.slice(0, limit);
  }

  // 导出指标数据
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.records, null, 2);
    } else {
      // CSV格式
      const headers = [
        'timestamp',
        'serviceId',
        'operation',
        'duration',
        'success',
        'error',
        'promptTokens',
        'completionTokens',
        'totalTokens',
        'cost',
        'cached'
      ];

      const rows = this.records.map(r => [
        r.timestamp.toISOString(),
        r.serviceId,
        r.operation,
        r.duration,
        r.success,
        r.error || '',
        r.usage?.promptTokens || 0,
        r.usage?.completionTokens || 0,
        r.usage?.totalTokens || 0,
        r.cost || 0,
        r.cached || false
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }

  private aggregateMetrics(): void {
    const now = new Date();
    const periodStart = new Date(now.getTime() - this.config.aggregationInterval);

    // 按服务和操作聚合
    const groups = new Map<string, MetricRecord[]>();

    for (const record of this.records) {
      if (record.timestamp >= periodStart) {
        const key = `${record.serviceId}:${record.operation}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(record);
      }
    }

    // 计算聚合指标
    for (const [key, records] of groups) {
      const [serviceId, operation] = key.split(':');
      
      // 这里可以实现更复杂的聚合逻辑
      // 暂时简化处理
    }

    this.emit('metricsAggregated', {
      timestamp: now,
      groupsCount: groups.size
    });
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    this.records = this.records.filter(r => r.timestamp > cutoff);
  }

  private createEmptyMetrics(serviceId: string): ServiceMetrics {
    return {
      serviceId,
      timestamp: new Date(),
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0
      },
      cost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorRate: 0,
      availability: 100
    };
  }

  // 停止收集器
  stop(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }
  }

  // 获取配置信息
  getConfig(): MetricsConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(config: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enableAggregation && !this.aggregationTimer) {
      this.startAggregation();
    } else if (!config.enableAggregation && this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }
  }
}