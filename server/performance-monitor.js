const prometheus = require('prom-client');
const { loggers } = require('./logger');

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enablePrometheus: options.enablePrometheus !== false,
      metricsPrefix: options.metricsPrefix || 'pme2go_api_',
      collectDefaultMetrics: options.collectDefaultMetrics !== false,
      histogramBuckets: options.histogramBuckets || [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      ...options
    };

    // Initialize metrics registry
    this.registry = new prometheus.Registry();
    
    // Collect default Node.js metrics
    if (this.options.collectDefaultMetrics) {
      prometheus.collectDefaultMetrics({ 
        register: this.registry,
        prefix: this.options.metricsPrefix
      });
    }

    // Initialize custom metrics
    this.initializeMetrics();

    // Performance tracking state
    this.performanceData = {
      requests: new Map(),
      database: new Map(),
      system: {
        startTime: Date.now(),
        requestCount: 0,
        errorCount: 0
      },
      apiEndpoints: new Map(),
      slowQueries: [],
      alerts: []
    };

    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    loggers.server.info('Performance monitor initialized', {
      enablePrometheus: this.options.enablePrometheus,
      metricsPrefix: this.options.metricsPrefix,
      collectDefaultMetrics: this.options.collectDefaultMetrics
    });
  }

  initializeMetrics() {
    const prefix = this.options.metricsPrefix;
    
    // HTTP Request metrics
    this.httpRequestDuration = new prometheus.Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: this.options.histogramBuckets,
      registers: [this.registry]
    });

    this.httpRequestTotal = new prometheus.Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.httpRequestsActive = new prometheus.Gauge({
      name: `${prefix}http_requests_active`,
      help: 'Number of active HTTP requests',
      registers: [this.registry]
    });

    // Database metrics
    this.dbQueryDuration = new prometheus.Histogram({
      name: `${prefix}database_query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.dbConnectionsActive = new prometheus.Gauge({
      name: `${prefix}database_connections_active`,
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    this.dbQueryErrors = new prometheus.Counter({
      name: `${prefix}database_query_errors_total`,
      help: 'Total number of database query errors',
      labelNames: ['error_type', 'table'],
      registers: [this.registry]
    });

    // Application metrics
    this.userSessions = new prometheus.Gauge({
      name: `${prefix}user_sessions_active`,
      help: 'Number of active user sessions',
      registers: [this.registry]
    });

    this.authenticationAttempts = new prometheus.Counter({
      name: `${prefix}authentication_attempts_total`,
      help: 'Total authentication attempts',
      labelNames: ['result', 'type'],
      registers: [this.registry]
    });

    this.businessLogicDuration = new prometheus.Histogram({
      name: `${prefix}business_logic_duration_seconds`,
      help: 'Duration of business logic operations',
      labelNames: ['operation', 'component'],
      buckets: this.options.histogramBuckets,
      registers: [this.registry]
    });

    // System resource metrics
    this.memoryUsage = new prometheus.Gauge({
      name: `${prefix}memory_usage_bytes`,
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.registry]
    });

    this.cpuUsage = new prometheus.Gauge({
      name: `${prefix}cpu_usage_percent`,
      help: 'CPU usage percentage',
      labelNames: ['type'],
      registers: [this.registry]
    });

    this.errorRate = new prometheus.Gauge({
      name: `${prefix}error_rate_percent`,
      help: 'Error rate percentage',
      labelNames: ['time_window'],
      registers: [this.registry]
    });
  }

  // Middleware for Express.js request monitoring
  createHttpMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = `${req.method}_${req.path}_${Date.now()}_${Math.random()}`;
      
      // Track active requests
      this.httpRequestsActive.inc();
      this.performanceData.system.requestCount++;
      
      // Store request start time
      this.performanceData.requests.set(requestId, {
        method: req.method,
        path: req.path,
        startTime,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId || null
      });

      // Override response.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = (Date.now() - startTime) / 1000;
        const route = this.normalizeRoute(req.path);
        
        // Record HTTP metrics
        this.httpRequestDuration
          .labels(req.method, route, res.statusCode.toString())
          .observe(duration);
          
        this.httpRequestTotal
          .labels(req.method, route, res.statusCode.toString())
          .inc();
          
        this.httpRequestsActive.dec();

        // Track endpoint performance
        this.trackEndpointPerformance(req.method, route, duration, res.statusCode);

        // Log slow requests
        if (duration > 2) { // Log requests slower than 2 seconds
          loggers.api.warn('Slow HTTP request detected', {
            method: req.method,
            path: req.path,
            duration: `${duration}s`,
            statusCode: res.statusCode,
            userId: req.user?.userId || null,
            ip: req.ip
          });
        }

        // Track errors
        if (res.statusCode >= 400) {
          this.performanceData.system.errorCount++;
          this.trackErrorMetrics(req, res, duration);
        }

        // Cleanup request data
        this.performanceData.requests.delete(requestId);
        
        // Log performance data
        loggers.api.performance('HTTP Request', duration * 1000, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userId: req.user?.userId || null,
          contentLength: res.get('Content-Length') || 0
        });

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Database query monitoring
  trackDatabaseQuery(queryText, duration, error = null, table = 'unknown') {
    const durationSeconds = duration / 1000;
    const operation = this.extractQueryOperation(queryText);
    const queryType = this.categorizeQuery(queryText);

    // Record metrics
    this.dbQueryDuration
      .labels(queryType, table, operation)
      .observe(durationSeconds);

    if (error) {
      this.dbQueryErrors
        .labels(error.code || 'unknown', table)
        .inc();
    }

    // Track slow queries
    if (durationSeconds > 1) { // Queries slower than 1 second
      this.performanceData.slowQueries.push({
        query: queryText.substring(0, 200) + (queryText.length > 200 ? '...' : ''),
        duration: durationSeconds,
        table,
        operation,
        timestamp: new Date().toISOString(),
        error: error?.message || null
      });

      // Keep only last 50 slow queries
      if (this.performanceData.slowQueries.length > 50) {
        this.performanceData.slowQueries = this.performanceData.slowQueries.slice(-50);
      }

      loggers.database.warn('Slow database query detected', {
        operation,
        table,
        duration: `${durationSeconds}s`,
        query: queryText.substring(0, 100) + '...'
      });
    }
  }

  // Business logic operation monitoring
  trackBusinessOperation(operation, component, duration, metadata = {}) {
    const durationSeconds = duration / 1000;
    
    this.businessLogicDuration
      .labels(operation, component)
      .observe(durationSeconds);

    loggers.api.performance(`Business Logic: ${operation}`, duration, {
      component,
      ...metadata
    });

    // Alert on slow business operations
    if (durationSeconds > 5) {
      this.createAlert('slow_business_operation', {
        operation,
        component,
        duration: durationSeconds,
        ...metadata
      });
    }
  }

  // Authentication monitoring
  trackAuthenticationAttempt(result, type = 'password', metadata = {}) {
    this.authenticationAttempts
      .labels(result, type)
      .inc();

    if (result === 'failed') {
      loggers.security.security('Authentication failed', {
        type,
        ...metadata
      });
    }
  }

  // System resource monitoring
  startPerformanceMonitoring() {
    // Update system metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);

    // Calculate error rates every minute
    setInterval(() => {
      this.calculateErrorRates();
    }, 60000);

    // Generate performance report every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);

    // Cleanup old data every 10 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 600000);
  }

  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    this.memoryUsage.labels('rss').set(memUsage.rss);
    this.memoryUsage.labels('heap_used').set(memUsage.heapUsed);
    this.memoryUsage.labels('heap_total').set(memUsage.heapTotal);
    this.memoryUsage.labels('external').set(memUsage.external);

    // CPU metrics (note: these are cumulative values)
    this.cpuUsage.labels('user').set(cpuUsage.user);
    this.cpuUsage.labels('system').set(cpuUsage.system);

    // Calculate current active sessions (this would be updated elsewhere)
    // this.userSessions.set(activeSessionCount);
  }

  calculateErrorRates() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;
    const fifteenMinutesAgo = now - 900000;

    // Calculate error rates for different time windows
    // This would require tracking errors with timestamps
    const totalRequests = this.performanceData.system.requestCount;
    const totalErrors = this.performanceData.system.errorCount;

    if (totalRequests > 0) {
      const errorRate = (totalErrors / totalRequests) * 100;
      this.errorRate.labels('total').set(errorRate);
    }
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.performanceData.system.startTime,
      requests: {
        total: this.performanceData.system.requestCount,
        active: this.performanceData.requests.size,
        errors: this.performanceData.system.errorCount
      },
      slowQueries: this.performanceData.slowQueries.slice(-10),
      topEndpoints: this.getTopEndpoints(),
      systemHealth: this.getSystemHealth(),
      alerts: this.performanceData.alerts.slice(-10)
    };

    loggers.server.info('Performance Report Generated', report);

    return report;
  }

  // Utility methods
  normalizeRoute(path) {
    // Normalize paths to group similar routes
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9-]{8,}/g, '/:hash');
  }

  extractQueryOperation(query) {
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery.startsWith('select')) return 'SELECT';
    if (lowerQuery.startsWith('insert')) return 'INSERT';
    if (lowerQuery.startsWith('update')) return 'UPDATE';
    if (lowerQuery.startsWith('delete')) return 'DELETE';
    if (lowerQuery.startsWith('create')) return 'CREATE';
    if (lowerQuery.startsWith('alter')) return 'ALTER';
    if (lowerQuery.startsWith('drop')) return 'DROP';
    return 'OTHER';
  }

  categorizeQuery(query) {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('users')) return 'users';
    if (lowerQuery.includes('messages')) return 'messages';
    if (lowerQuery.includes('opportunities')) return 'opportunities';
    if (lowerQuery.includes('notifications')) return 'notifications';
    if (lowerQuery.includes('admin')) return 'admin';
    return 'other';
  }

  trackEndpointPerformance(method, route, duration, statusCode) {
    const key = `${method} ${route}`;
    if (!this.performanceData.apiEndpoints.has(key)) {
      this.performanceData.apiEndpoints.set(key, {
        method,
        route,
        requestCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        statusCodes: new Map()
      });
    }

    const endpoint = this.performanceData.apiEndpoints.get(key);
    endpoint.requestCount++;
    endpoint.totalDuration += duration;
    endpoint.avgDuration = endpoint.totalDuration / endpoint.requestCount;
    endpoint.minDuration = Math.min(endpoint.minDuration, duration);
    endpoint.maxDuration = Math.max(endpoint.maxDuration, duration);

    if (statusCode >= 400) {
      endpoint.errorCount++;
    }

    // Track status codes
    const statusCount = endpoint.statusCodes.get(statusCode) || 0;
    endpoint.statusCodes.set(statusCode, statusCount + 1);
  }

  trackErrorMetrics(req, res, duration) {
    // Create error tracking entry
    const errorData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || null
    };

    // Log security events for specific error codes
    if (res.statusCode === 401 || res.statusCode === 403) {
      loggers.security.security('Authorization Error', errorData);
    }
  }

  getTopEndpoints(limit = 10) {
    return Array.from(this.performanceData.apiEndpoints.values())
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limit)
      .map(endpoint => ({
        endpoint: `${endpoint.method} ${endpoint.route}`,
        requests: endpoint.requestCount,
        avgDuration: Math.round(endpoint.avgDuration * 1000) / 1000,
        errorRate: (endpoint.errorCount / endpoint.requestCount * 100).toFixed(2) + '%'
      }));
  }

  getSystemHealth() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      uptime: Math.round(uptime),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      requests: {
        total: this.performanceData.system.requestCount,
        active: this.performanceData.requests.size,
        errorRate: this.performanceData.system.requestCount > 0 
          ? ((this.performanceData.system.errorCount / this.performanceData.system.requestCount) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  createAlert(type, details) {
    const alert = {
      id: Date.now().toString(),
      type,
      severity: this.getAlertSeverity(type),
      message: this.generateAlertMessage(type, details),
      details,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.performanceData.alerts.push(alert);

    loggers.server.warn('Performance Alert Generated', alert);

    return alert;
  }

  getAlertSeverity(type) {
    const severityMap = {
      slow_request: 'medium',
      slow_query: 'medium',
      slow_business_operation: 'high',
      high_error_rate: 'high',
      memory_leak: 'critical',
      database_error: 'high'
    };
    return severityMap[type] || 'low';
  }

  generateAlertMessage(type, details) {
    const messageMap = {
      slow_request: `Slow HTTP request detected: ${details.method} ${details.path} took ${details.duration}s`,
      slow_query: `Slow database query detected: ${details.operation} on ${details.table} took ${details.duration}s`,
      slow_business_operation: `Slow business operation: ${details.operation} in ${details.component} took ${details.duration}s`,
      high_error_rate: `High error rate detected: ${details.errorRate}% over ${details.timeWindow}`,
      memory_leak: `Potential memory leak: Memory usage increased by ${details.increase}MB`,
      database_error: `Database error: ${details.error}`
    };
    return messageMap[type] || `Alert: ${type}`;
  }

  cleanupOldData() {
    const oneHourAgo = Date.now() - 3600000;
    
    // Clean up old alerts
    this.performanceData.alerts = this.performanceData.alerts
      .filter(alert => new Date(alert.timestamp).getTime() > oneHourAgo);

    // Reset counters periodically to prevent memory leaks
    if (this.performanceData.system.requestCount > 1000000) {
      this.performanceData.system.requestCount = 0;
      this.performanceData.system.errorCount = 0;
    }

    loggers.server.debug('Performance data cleanup completed');
  }

  // Public API methods
  getMetrics() {
    if (!this.options.enablePrometheus) {
      return null;
    }
    return this.registry.metrics();
  }

  getPerformanceReport() {
    return this.generatePerformanceReport();
  }

  getSlowQueries() {
    return this.performanceData.slowQueries;
  }

  getAlerts(unresolved = false) {
    return unresolved 
      ? this.performanceData.alerts.filter(alert => !alert.resolved)
      : this.performanceData.alerts;
  }

  resolveAlert(alertId) {
    const alert = this.performanceData.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  reset() {
    this.performanceData = {
      requests: new Map(),
      database: new Map(),
      system: {
        startTime: Date.now(),
        requestCount: 0,
        errorCount: 0
      },
      apiEndpoints: new Map(),
      slowQueries: [],
      alerts: []
    };
    
    loggers.server.info('Performance monitor reset');
  }
}

module.exports = PerformanceMonitor;