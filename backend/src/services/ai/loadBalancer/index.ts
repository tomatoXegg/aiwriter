import { 
  ILoadBalancer, 
  IAIService, 
  HealthStatus 
} from './interfaces';
import { LoadBalancerConfig } from './types';
import { EventEmitter } from 'events';

export interface LoadBalancerMetrics {
  totalRequests: number;
  requestsByService: Record<string, number>;
  averageResponseTime: number;
  lastSelectedService?: string;
  algorithmStats: any;
}

export abstract class BaseLoadBalancer extends EventEmitter implements ILoadBalancer {
  protected services: Map<string, IAIService> = new Map();
  protected healthStatus: Map<string, HealthStatus> = new Map();
  protected config: LoadBalancerConfig;
  protected metrics: LoadBalancerMetrics;

  constructor(config: LoadBalancerConfig) {
    super();
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      requestsByService: {},
      averageResponseTime: 0,
      algorithmStats: {}
    };
  }

  abstract selectService(request: any): Promise<IAIService>;

  registerService(service: IAIService): void {
    this.services.set(service.id, service);
    this.metrics.requestsByService[service.id] = 0;
    this.emit('serviceRegistered', service);
  }

  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
    this.healthStatus.delete(serviceId);
    delete this.metrics.requestsByService[serviceId];
    this.emit('serviceUnregistered', serviceId);
  }

  updateServiceHealth(serviceId: string, health: HealthStatus): void {
    this.healthStatus.set(serviceId, health);
    this.emit('serviceHealthUpdated', serviceId, health);
  }

  getHealthyServices(): IAIService[] {
    return Array.from(this.services.values()).filter(service => {
      const health = this.healthStatus.get(service.id);
      return health?.status === 'healthy' || health?.status === 'degraded';
    });
  }

  async getMetrics(): Promise<LoadBalancerMetrics> {
    return {
      ...this.metrics,
      averageResponseTime: this.calculateAverageResponseTime()
    };
  }

  protected updateMetrics(serviceId: string): void {
    this.metrics.totalRequests++;
    this.metrics.requestsByService[serviceId] = 
      (this.metrics.requestsByService[serviceId] || 0) + 1;
    this.metrics.lastSelectedService = serviceId;
  }

  private calculateAverageResponseTime(): number {
    const healthyServices = this.getHealthyServices();
    if (healthyServices.length === 0) return 0;

    const totalResponseTime = healthyServices.reduce((sum, service) => {
      const health = this.healthStatus.get(service.id);
      return sum + (health?.responseTime || 0);
    }, 0);

    return totalResponseTime / healthyServices.length;
  }

  protected getServicesWithWeights(): Array<{ service: IAIService; weight: number }> {
    const healthyServices = this.getHealthyServices();
    
    return healthyServices.map(service => {
      const health = this.healthStatus.get(service.id);
      const configWeight = service.config.weight || 1;
      
      // 根据健康状态调整权重
      let healthWeight = 1;
      if (health?.status === 'degraded') {
        healthWeight = 0.5;
      }
      
      // 根据响应时间调整权重（响应时间越长，权重越低）
      const responseTimeWeight = health?.responseTime 
        ? Math.max(0.1, 1 - (health.responseTime / 10000)) // 10秒为基准
        : 1;
      
      const totalWeight = configWeight * healthWeight * responseTimeWeight;
      
      return {
        service,
        weight: totalWeight
      };
    });
  }
}

export class RoundRobinLoadBalancer extends BaseLoadBalancer {
  private currentIndex = 0;

  async selectService(request: any): Promise<IAIService> {
    const healthyServices = this.getHealthyServices();
    
    if (healthyServices.length === 0) {
      throw new Error('No healthy services available');
    }

    const service = healthyServices[this.currentIndex % healthyServices.length];
    this.currentIndex = (this.currentIndex + 1) % healthyServices.length;
    
    this.updateMetrics(service.id);
    
    return service;
  }
}

export class WeightedRoundRobinLoadBalancer extends BaseLoadBalancer {
  private currentWeights: Map<string, number> = new Map();

  async selectService(request: any): Promise<IAIService> {
    const weightedServices = this.getServicesWithWeights();
    
    if (weightedServices.length === 0) {
      throw new Error('No healthy services available');
    }

    let selectedService: { service: IAIService; weight: number } | null = null;
    let maxWeight = -1;

    // 计算当前权重
    for (const { service, weight } of weightedServices) {
      const currentWeight = this.currentWeights.get(service.id) || 0;
      const newWeight = currentWeight + weight;
      this.currentWeights.set(service.id, newWeight);

      if (newWeight > maxWeight) {
        maxWeight = newWeight;
        selectedService = { service, weight };
      }
    }

    if (selectedService) {
      // 减去总权重
      const totalWeight = weightedServices.reduce((sum, s) => sum + s.weight, 0);
      this.currentWeights.set(
        selectedService.service.id,
        this.currentWeights.get(selectedService.service.id)! - totalWeight
      );
      
      this.updateMetrics(selectedService.service.id);
      return selectedService.service;
    }

    throw new Error('Failed to select service');
  }
}

export class LeastConnectionsLoadBalancer extends BaseLoadBalancer {
  private connections: Map<string, number> = new Map();

  async selectService(request: any): Promise<IAIService> {
    const healthyServices = this.getHealthyServices();
    
    if (healthyServices.length === 0) {
      throw new Error('No healthy services available');
    }

    // 找到连接数最少的服务
    let selectedService = healthyServices[0];
    let minConnections = this.connections.get(selectedService.id) || 0;

    for (const service of healthyServices) {
      const connections = this.connections.get(service.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedService = service;
      }
    }

    // 增加连接数
    this.connections.set(
      selectedService.id,
      (this.connections.get(selectedService.id) || 0) + 1
    );

    this.updateMetrics(selectedService.id);

    // 模拟连接完成（实际使用时应该在请求完成后调用）
    setTimeout(() => {
      const current = this.connections.get(selectedService.id) || 0;
      this.connections.set(selectedService.id, Math.max(0, current - 1));
    }, 1000);

    return selectedService;
  }
}

export class FastestResponseLoadBalancer extends BaseLoadBalancer {
  async selectService(request: any): Promise<IAIService> {
    const healthyServices = this.getHealthyServices();
    
    if (healthyServices.length === 0) {
      throw new Error('No healthy services available');
    }

    // 找到响应时间最快的服务
    let selectedService = healthyServices[0];
    let minResponseTime = this.healthStatus.get(selectedService.id)?.responseTime || Infinity;

    for (const service of healthyServices) {
      const health = this.healthStatus.get(service.id);
      const responseTime = health?.responseTime || Infinity;
      
      if (responseTime < minResponseTime) {
        minResponseTime = responseTime;
        selectedService = service;
      }
    }

    this.updateMetrics(selectedService.id);
    return selectedService;
  }
}

export class RandomLoadBalancer extends BaseLoadBalancer {
  async selectService(request: any): Promise<IAIService> {
    const healthyServices = this.getHealthyServices();
    
    if (healthyServices.length === 0) {
      throw new Error('No healthy services available');
    }

    const randomIndex = Math.floor(Math.random() * healthyServices.length);
    const selectedService = healthyServices[randomIndex];
    
    this.updateMetrics(selectedService.id);
    return selectedService;
  }
}

// 负载均衡器工厂
export class LoadBalancerFactory {
  static create(config: LoadBalancerConfig): ILoadBalancer {
    switch (config.algorithm) {
      case 'round-robin':
        return new RoundRobinLoadBalancer(config);
      case 'weighted':
        return new WeightedRoundRobinLoadBalancer(config);
      case 'least-connections':
        return new LeastConnectionsLoadBalancer(config);
      case 'fastest-response':
        return new FastestResponseLoadBalancer(config);
      case 'random':
        return new RandomLoadBalancer(config);
      default:
        throw new Error(`Unknown load balancing algorithm: ${config.algorithm}`);
    }
  }
}