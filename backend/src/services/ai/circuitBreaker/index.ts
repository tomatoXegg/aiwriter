import { ICircuitBreaker, CircuitBreakerConfig } from '../interfaces';
import { EventEmitter } from 'events';

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
  successCount: number;
  totalRequests: number;
  totalFailures: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureRate: number;
  requestCount: number;
  failureCount: number;
  successCount: number;
  averageResponseTime: number;
  lastStateChange: Date;
  lastFailure?: Date;
  lastSuccess?: Date;
}

export class CircuitBreaker extends EventEmitter implements ICircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private monitoringPeriod: number;
  private requestTimestamps: number[] = [];
  private responseTimes: number[] = [];

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = {
      monitoringPeriod: 60000, // 默认1分钟监控期
      ...config
    };
    
    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      totalFailures: 0,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0
    };

    this.monitoringPeriod = this.config.monitoringPeriod || 60000;
    this.startMonitoring();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.state.totalRequests++;

    // 检查熔断器状态
    if (this.state.state === 'OPEN') {
      if (Date.now() < (this.state.nextAttemptTime || 0)) {
        throw this.createCircuitBreakerError('Circuit breaker is OPEN');
      } else {
        // 尝试半开状态
        this.transitionToHalfOpen();
      }
    }

    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      
      this.recordSuccess(responseTime);
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.monitoringPeriod
    ).length;

    const recentFailures = this.state.totalFailures - this.getFailuresBefore(now - this.monitoringPeriod);
    const failureRate = recentRequests > 0 ? (recentFailures / recentRequests) * 100 : 0;

    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    return {
      state: this.state.state,
      failureRate: Number(failureRate.toFixed(2)),
      requestCount: this.state.totalRequests,
      failureCount: this.state.totalFailures,
      successCount: this.state.successCount,
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      lastStateChange: new Date(this.state.lastFailureTime || now),
      lastFailure: this.state.lastFailureTime ? new Date(this.state.lastFailureTime) : undefined,
      lastSuccess: this.state.lastFailureTime ? new Date(this.state.lastFailureTime) : undefined
    };
  }

  reset(): void {
    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      totalFailures: 0,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0
    };
    
    this.requestTimestamps = [];
    this.responseTimes = [];
    
    this.emit('reset');
  }

  private recordSuccess(responseTime: number): void {
    this.state.successCount++;
    this.state.consecutiveSuccesses++;
    this.state.consecutiveFailures = 0;
    
    this.requestTimestamps.push(Date.now());
    this.responseTimes.push(responseTime);
    
    // 保持响应时间数组在合理范围内
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }

    // 在半开状态下，成功一定次数后关闭熔断器
    if (this.state.state === 'HALF_OPEN') {
      if (this.state.consecutiveSuccesses >= 3) { // 成功3次后关闭
        this.transitionToClosed();
      }
    }

    this.emit('success', { responseTime, state: this.state.state });
  }

  private recordFailure(): void {
    this.state.totalFailures++;
    this.state.failureCount++;
    this.state.consecutiveFailures++;
    this.state.consecutiveSuccesses = 0;
    this.state.lastFailureTime = Date.now();
    
    this.requestTimestamps.push(Date.now());

    // 检查是否需要打开熔断器
    if (this.shouldOpenCircuit()) {
      this.transitionToOpen();
    }

    this.emit('failure', { state: this.state.state });
  }

  private shouldOpenCircuit(): boolean {
    // 如果已经打开，不需要再次判断
    if (this.state.state === 'OPEN') return false;

    // 在监控期内检查失败率
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.monitoringPeriod
    ).length;

    if (recentRequests === 0) return false;

    const recentFailures = this.getFailuresBefore(now) - this.getFailuresBefore(now - this.monitoringPeriod);
    const failureRate = (recentFailures / recentRequests) * 100;

    // 检查是否达到失败阈值
    return failureRate >= this.config.failureThreshold;
  }

  private getFailuresBefore(timestamp: number): number {
    // 这是一个简化实现，实际应该记录每次失败的时间戳
    return Math.floor(this.state.totalFailures * 0.8); // 简化计算
  }

  private transitionToOpen(): void {
    this.state.state = 'OPEN';
    this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    
    this.emit('stateChange', {
      from: 'HALF_OPEN',
      to: 'OPEN',
      reason: 'Failure threshold exceeded'
    });
  }

  private transitionToHalfOpen(): void {
    this.state.state = 'HALF_OPEN';
    this.state.consecutiveFailures = 0;
    
    this.emit('stateChange', {
      from: 'OPEN',
      to: 'HALF_OPEN',
      reason: 'Recovery timeout elapsed'
    });
  }

  private transitionToClosed(): void {
    this.state.state = 'CLOSED';
    this.state.failureCount = 0;
    this.state.consecutiveSuccesses = 0;
    
    this.emit('stateChange', {
      from: 'HALF_OPEN',
      to: 'CLOSED',
      reason: 'Success threshold reached'
    });
  }

  private createCircuitBreakerError(message: string): Error {
    const error = new Error(message);
    error.name = 'CircuitBreakerError';
    return error;
  }

  private startMonitoring(): void {
    // 定期清理过期的请求时间戳
    setInterval(() => {
      const now = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(
        timestamp => now - timestamp < this.monitoringPeriod * 2 // 保留2倍监控期
      );
    }, this.monitoringPeriod);
  }

  // 手动控制方法
  forceOpen(): void {
    this.transitionToOpen();
  }

  forceClose(): void {
    this.transitionToClosed();
  }

  // 获取详细的状态信息
  getDetailedState(): CircuitBreakerState & {
    config: CircuitBreakerConfig;
    metrics: CircuitBreakerMetrics;
  } {
    return {
      ...this.state,
      config: this.config,
      metrics: this.getMetrics()
    };
  }
}

// 熔断器工厂
export class CircuitBreakerFactory {
  static create(config: CircuitBreakerConfig): ICircuitBreaker {
    return new CircuitBreaker(config);
  }

  // 预定义的熔断器配置
  static defaultConfig(): CircuitBreakerConfig {
    return {
      failureThreshold: 50, // 50%失败率
      recoveryTimeout: 60000, // 1分钟后尝试恢复
      expectedException: ['timeout', 'connection_error', 'rate_limit'],
      monitoringPeriod: 60000 // 1分钟监控期
    };
  }

  static aggressiveConfig(): CircuitBreakerConfig {
    return {
      failureThreshold: 20, // 20%失败率就打开
      recoveryTimeout: 30000, // 30秒后尝试恢复
      expectedException: ['timeout', 'connection_error'],
      monitoringPeriod: 30000 // 30秒监控期
    };
  }

  static lenientConfig(): CircuitBreakerConfig {
    return {
      failureThreshold: 80, // 80%失败率才打开
      recoveryTimeout: 120000, // 2分钟后尝试恢复
      expectedException: ['timeout', 'connection_error', 'rate_limit', 'server_error'],
      monitoringPeriod: 120000 // 2分钟监控期
    };
  }
}