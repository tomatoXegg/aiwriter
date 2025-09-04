import sqlite3 from 'sqlite3';
import path from 'path';

export interface ConnectionPoolOptions {
  maxConnections?: number;
  idleTimeoutMillis?: number;
  acquireTimeoutMillis?: number;
}

export interface ConnectionInfo {
  id: string;
  db: sqlite3.Database;
  createdAt: Date;
  lastUsed: Date;
  inUse: boolean;
}

export class ConnectionPool {
  private connections: Map<string, ConnectionInfo> = new Map();
  private availableConnections: string[] = [];
  private options: Required<ConnectionPoolOptions>;
  private dbPath: string;

  constructor(dbPath: string, options: ConnectionPoolOptions = {}) {
    this.dbPath = dbPath;
    this.options = {
      maxConnections: options.maxConnections || 10,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 10000
    };

    // Start idle connection cleanup
    this.startIdleCleanup();
  }

  async acquire(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquisition timeout'));
      }, this.options.acquireTimeoutMillis);

      const tryAcquire = () => {
        // Check for available connections
        if (this.availableConnections.length > 0) {
          const connectionId = this.availableConnections.shift()!;
          const connection = this.connections.get(connectionId)!;
          connection.inUse = true;
          connection.lastUsed = new Date();
          
          clearTimeout(timeout);
          resolve(connection.db);
          return;
        }

        // Create new connection if under max limit
        if (this.connections.size < this.options.maxConnections) {
          this.createConnection()
            .then(db => {
              clearTimeout(timeout);
              resolve(db);
            })
            .catch(error => {
              clearTimeout(timeout);
              reject(error);
            });
          return;
        }

        // Wait for a connection to become available
        setTimeout(tryAcquire, 100);
      };

      tryAcquire();
    });
  }

  release(db: sqlite3.Database): void {
    for (const [connectionId, connection] of this.connections) {
      if (connection.db === db) {
        connection.inUse = false;
        connection.lastUsed = new Date();
        
        if (!this.availableConnections.includes(connectionId)) {
          this.availableConnections.push(connectionId);
        }
        break;
      }
    }
  }

  private async createConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const connectionId = this.generateConnectionId();
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');

        // Enable WAL mode for better concurrency
        db.run('PRAGMA journal_mode = WAL');

        // Set busy timeout
        db.run('PRAGMA busy_timeout = 5000');

        const connection: ConnectionInfo = {
          id: connectionId,
          db,
          createdAt: new Date(),
          lastUsed: new Date(),
          inUse: true
        };

        this.connections.set(connectionId, connection);
        resolve(db);
      });

      // Handle connection errors
      db.on('error', (err) => {
        console.error(`Database connection error (${connectionId}):`, err);
        this.removeConnection(connectionId);
      });
    });
  }

  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.db.close();
      this.connections.delete(connectionId);
      
      const index = this.availableConnections.indexOf(connectionId);
      if (index > -1) {
        this.availableConnections.splice(index, 1);
      }
    }
  }

  private startIdleCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const idleThreshold = new Date(now.getTime() - this.options.idleTimeoutMillis);

      for (const [connectionId, connection] of this.connections) {
        if (!connection.inUse && connection.lastUsed < idleThreshold) {
          // Keep minimum connections
          if (this.connections.size > 2) {
            this.removeConnection(connectionId);
          }
        }
      }
    }, this.options.idleTimeoutMillis / 2);
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    for (const [connectionId, connection] of this.connections) {
      closePromises.push(new Promise<void>((resolve) => {
        connection.db.close(() => {
          this.connections.delete(connectionId);
          resolve();
        });
      }));
    }

    await Promise.all(closePromises);
    this.availableConnections = [];
  }

  getStatus(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    maxConnections: number;
  } {
    const activeConnections = Array.from(this.connections.values()).filter(conn => conn.inUse).length;
    
    return {
      totalConnections: this.connections.size,
      activeConnections,
      idleConnections: this.availableConnections.length,
      maxConnections: this.options.maxConnections
    };
  }
}

// Database connection manager
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private pools: Map<string, ConnectionPool> = new Map();

  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  async getConnection(dbPath?: string): Promise<sqlite3.Database> {
    const path = dbPath || this.getDefaultDbPath();
    
    if (!this.pools.has(path)) {
      this.pools.set(path, new ConnectionPool(path));
    }

    const pool = this.pools.get(path)!;
    return pool.acquire();
  }

  releaseConnection(db: sqlite3.Database, dbPath?: string): void {
    const path = dbPath || this.getDefaultDbPath();
    const pool = this.pools.get(path);
    
    if (pool) {
      pool.release(db);
    }
  }

  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    for (const pool of this.pools.values()) {
      closePromises.push(pool.close());
    }

    await Promise.all(closePromises);
    this.pools.clear();
  }

  getStatus(dbPath?: string): any {
    const path = dbPath || this.getDefaultDbPath();
    const pool = this.pools.get(path);
    
    if (pool) {
      return pool.getStatus();
    }

    return null;
  }

  private getDefaultDbPath(): string {
    return path.join(process.cwd(), 'database', 'aiwriter.db');
  }
}

// Decorator for automatic connection management
export function withConnection(dbPath?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const manager = DatabaseConnectionManager.getInstance();
      let connection: sqlite3.Database;
      
      try {
        connection = await manager.getConnection(dbPath);
        const result = await originalMethod.apply(this, [connection, ...args]);
        return result;
      } finally {
        if (connection) {
          manager.releaseConnection(connection, dbPath);
        }
      }
    };

    return descriptor;
  };
}

// Higher-order function for connection management
export function withConnectionHandler<T extends any[], R>(
  handler: (connection: sqlite3.Database, ...args: T) => Promise<R>,
  dbPath?: string
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    const manager = DatabaseConnectionManager.getInstance();
    let connection: sqlite3.Database;
    
    try {
      connection = await manager.getConnection(dbPath);
      return await handler(connection, ...args);
    } finally {
      if (connection) {
        manager.releaseConnection(connection, dbPath);
      }
    }
  };
}