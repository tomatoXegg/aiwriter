export * from './DatabaseService';
export * from './ReportService';

// Factory function to create services
import Database from '../init';
import { DatabaseService } from './DatabaseService';
import { ReportService } from './ReportService';

export interface Services {
  database: DatabaseService;
  reports: ReportService;
}

export function createServices(database: Database): Services {
  const dbService = new DatabaseService(database);
  const reportService = new ReportService(dbService);

  return {
    database: dbService,
    reports: reportService
  };
}

// Service utilities
export class ServiceManager {
  private static instance: ServiceManager;
  private services: Services | null = null;

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  async initializeServices(dbPath?: string): Promise<Services> {
    const Database = require('../init').default;
    const database = new Database();
    
    await database.connect();
    await database.initTables();

    this.services = createServices(database);
    return this.services;
  }

  getServices(): Services {
    if (!this.services) {
      throw new Error('Services not initialized. Call initializeServices() first.');
    }
    return this.services;
  }

  async closeServices(): Promise<void> {
    if (this.services) {
      await this.services.database.close();
      this.services = null;
    }
  }
}

// Service health check
export async function checkServicesHealth(services: Services): Promise<{
  healthy: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  try {
    // Check database connection
    const status = await services.database.getStatus();
    checks.database = status.connected;
    
    if (!status.connected) {
      errors.push('Database connection failed');
    }

    // Check basic queries
    try {
      await services.database.getConfigurations({ limit: 1 });
      checks.queries = true;
    } catch (error) {
      checks.queries = false;
      errors.push(`Database query failed: ${error}`);
    }

    // Check model operations
    try {
      await services.database.getAccounts({ limit: 1 });
      checks.models = true;
    } catch (error) {
      checks.models = false;
      errors.push(`Model operation failed: ${error}`);
    }

  } catch (error) {
    errors.push(`Service health check failed: ${error}`);
  }

  return {
    healthy: Object.values(checks).every(check => check),
    checks,
    errors
  };
}

// Service configuration
export interface ServiceConfig {
  database: {
    path?: string;
    maxConnections?: number;
    idleTimeout?: number;
  };
  reports: {
    autoGenerate?: boolean;
    schedule?: string;
    retentionDays?: number;
  };
}

export const defaultServiceConfig: ServiceConfig = {
  database: {
    maxConnections: 10,
    idleTimeout: 30000
  },
  reports: {
    autoGenerate: true,
    schedule: '0 0 * * *', // Daily at midnight
    retentionDays: 30
  }
};

// Initialize services with configuration
export async function initializeServicesWithConfig(config: ServiceConfig = defaultServiceConfig): Promise<Services> {
  const manager = ServiceManager.getInstance();
  const services = await manager.initializeServices(config.database.path);

  // Setup scheduled reports if enabled
  if (config.reports.autoGenerate) {
    setupScheduledReports(services, config.reports);
  }

  return services;
}

function setupScheduledReports(services: Services, config: NonNullable<ServiceConfig['reports']>): void {
  if (typeof setInterval === 'undefined') return; // Not in browser environment

  // Simple interval-based scheduling (in production, use a proper scheduler)
  const intervalMs = 24 * 60 * 60 * 1000; // Daily
  
  setInterval(async () => {
    try {
      await services.reports.generateScheduledReports();
      
      if (config.retentionDays) {
        await services.reports.cleanupOldReports(config.retentionDays);
      }
    } catch (error) {
      console.error('Scheduled report generation failed:', error);
    }
  }, intervalMs);

  console.log('Scheduled reports configured');
}