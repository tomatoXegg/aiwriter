import { IAIService, IServiceRegistry } from './interfaces';
import { ServiceInstance } from './types';
import { EventEmitter } from 'events';

export class ServiceRegistry extends EventEmitter implements IServiceRegistry {
  private services: Map<string, IAIService> = new Map();
  private serviceInstances: Map<string, ServiceInstance> = new Map();

  async register(service: IAIService): Promise<void> {
    if (this.services.has(service.id)) {
      throw new Error(`Service with id ${service.id} already exists`);
    }

    this.services.set(service.id, service);

    // 创建服务实例记录
    const instance: ServiceInstance = {
      id: service.id,
      name: service.name,
      type: service.type,
      config: service.config,
      status: 'active',
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorRate: 0
      },
      metrics: this.createEmptyMetrics(service.id),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.serviceInstances.set(service.id, instance);

    // 监听服务事件
    this.setupServiceListeners(service);

    this.emit('serviceRegistered', service);
  }

  async unregister(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      return;
    }

    this.services.delete(serviceId);
    this.serviceInstances.delete(serviceId);

    this.emit('serviceUnregistered', service);
  }

  getService(serviceId: string): IAIService | undefined {
    return this.services.get(serviceId);
  }

  getAllServices(): IAIService[] {
    return Array.from(this.services.values());
  }

  getServicesByType(type: string): IAIService[] {
    return Array.from(this.services.values()).filter(service => service.type === type);
  }

  getServiceInstance(serviceId: string): ServiceInstance | undefined {
    return this.serviceInstances.get(serviceId);
  }

  getAllServiceInstances(): ServiceInstance[] {
    return Array.from(this.serviceInstances.values());
  }

  getActiveServices(): IAIService[] {
    return Array.from(this.services.values()).filter(service => {
      const instance = this.serviceInstances.get(service.id);
      return instance?.status === 'active';
    });
  }

  getHealthyServices(): IAIService[] {
    return Array.from(this.services.values()).filter(service => {
      const instance = this.serviceInstances.get(service.id);
      return instance?.health.status === 'healthy';
    });
  }

  updateServiceHealth(serviceId: string, health: any): void {
    const instance = this.serviceInstances.get(serviceId);
    if (instance) {
      instance.health = health;
      instance.updatedAt = new Date();
      this.emit('serviceHealthUpdated', serviceId, health);
    }
  }

  updateServiceMetrics(serviceId: string, metrics: Partial<any>): void {
    const instance = this.serviceInstances.get(serviceId);
    if (instance) {
      // 更新指标
      Object.assign(instance.metrics, metrics);
      instance.updatedAt = new Date();
      this.emit('serviceMetricsUpdated', serviceId, metrics);
    }
  }

  private setupServiceListeners(service: IAIService): void {
    // 监听服务错误事件
    if ('on' in service && typeof service.on === 'function') {
      service.on('error', (error: Error) => {
        this.emit('serviceError', service.id, error);
        
        // 更新服务健康状态
        const instance = this.serviceInstances.get(service.id);
        if (instance) {
          instance.health.status = 'degraded';
          instance.health.errorRate += 1;
          instance.updatedAt = new Date();
        }
      });
    }
  }

  private createEmptyMetrics(serviceId: string): any {
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

  // 获取服务统计信息
  getStatistics() {
    const services = Array.from(this.serviceInstances.values());
    const totalServices = services.length;
    const activeServices = services.filter(s => s.status === 'active').length;
    const healthyServices = services.filter(s => s.health.status === 'healthy').length;

    const totalRequests = services.reduce((sum, s) => sum + s.metrics.requestCount, 0);
    const totalErrors = services.reduce((sum, s) => sum + s.metrics.errorCount, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    const averageResponseTime = services.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / totalServices || 0;

    return {
      totalServices,
      activeServices,
      healthyServices,
      availability: totalServices > 0 ? (healthyServices / totalServices) * 100 : 0,
      totalRequests,
      totalErrors,
      errorRate: Number(errorRate.toFixed(2)),
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      byType: this.getStatisticsByType(),
      byStatus: this.getStatisticsByStatus()
    };
  }

  private getStatisticsByType() {
    const stats: Record<string, any> = {};
    
    for (const instance of this.serviceInstances.values()) {
      if (!stats[instance.type]) {
        stats[instance.type] = {
          count: 0,
          active: 0,
          healthy: 0,
          totalRequests: 0,
          totalErrors: 0
        };
      }
      
      stats[instance.type].count++;
      if (instance.status === 'active') stats[instance.type].active++;
      if (instance.health.status === 'healthy') stats[instance.type].healthy++;
      stats[instance.type].totalRequests += instance.metrics.requestCount;
      stats[instance.type].totalErrors += instance.metrics.errorCount;
    }

    // 计算错误率
    for (const type in stats) {
      const { totalRequests, totalErrors } = stats[type];
      stats[type].errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    }

    return stats;
  }

  private getStatisticsByStatus() {
    const stats: Record<string, any> = {
      active: { count: 0, services: [] as string[] },
      inactive: { count: 0, services: [] as string[] },
      error: { count: 0, services: [] as string[] }
    };

    for (const instance of this.serviceInstances.values()) {
      stats[instance.status].count++;
      stats[instance.status].services.push(instance.name);
    }

    return stats;
  }
}