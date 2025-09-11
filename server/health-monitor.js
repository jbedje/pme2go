const express = require('express');
const { Pool } = require('pg');
const client = require('redis').createClient();
const winston = require('winston');
const promClient = require('prom-client');

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const dbConnectionsActive = new promClient.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections'
});

const wsConnectionsActive = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(wsConnectionsActive);
register.registerMetric(userRegistrations);

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/monitoring.log' }),
    new winston.transports.Console()
  ]
});

class HealthMonitor {
  constructor() {
    this.dbPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = null;
    this.initRedis();
  }

  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = client.createClient({
          url: process.env.REDIS_URL,
          password: process.env.REDIS_PASSWORD
        });
        await this.redisClient.connect();
        logger.info('✅ Redis connected for monitoring');
      }
    } catch (error) {
      logger.warn('⚠️ Redis not available for monitoring:', error.message);
    }
  }

  async checkDatabase() {
    try {
      const client = await this.dbPool.connect();
      const result = await client.query('SELECT 1 as health');
      client.release();
      
      // Update metrics
      dbConnectionsActive.set(this.dbPool.totalCount);
      
      return {
        status: 'healthy',
        responseTime: Date.now(),
        activeConnections: this.dbPool.totalCount,
        idleConnections: this.dbPool.idleCount
      };
    } catch (error) {
      logger.error('❌ Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async checkRedis() {
    if (!this.redisClient) {
      return { status: 'not_configured' };
    }

    try {
      const start = Date.now();
      await this.redisClient.ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime
      };
    } catch (error) {
      logger.error('❌ Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async checkDiskSpace() {
    const { execSync } = require('child_process');
    try {
      const result = execSync('df -h / | tail -1').toString();
      const [filesystem, size, used, available, usePercent, mountPoint] = result.split(/\s+/);
      
      return {
        status: 'healthy',
        filesystem,
        size,
        used,
        available,
        usePercent: parseInt(usePercent.replace('%', '')),
        mountPoint
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  getCpuUsage() {
    const usage = process.cpuUsage();
    return {
      user: usage.user / 1000, // Convert to milliseconds
      system: usage.system / 1000
    };
  }

  async getSystemHealth() {
    const [database, redis, disk] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace()
    ]);

    const memory = this.getMemoryUsage();
    const cpu = this.getCpuUsage();

    const overallStatus = database.status === 'healthy' ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      services: {
        database,
        redis,
        disk
      },
      resources: {
        memory,
        cpu
      }
    };
  }

  // Middleware for request metrics
  metricsMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration
          .labels(req.method, req.route?.path || req.path, res.statusCode)
          .observe(duration);
      });
      
      next();
    };
  }

  // Expose metrics endpoint
  getMetricsHandler() {
    return async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
      } catch (error) {
        res.status(500).end('Error collecting metrics');
      }
    };
  }

  // Increment user registration counter
  recordUserRegistration() {
    userRegistrations.inc();
  }

  // Update WebSocket connections count
  updateWebSocketConnections(count) {
    wsConnectionsActive.set(count);
  }
}

module.exports = HealthMonitor;