const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create daily rotate file transports
const createDailyRotateTransport = (filename, level = 'info') => {
  return new DailyRotateFile({
    filename: path.join(logsDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: level,
    format: logFormat
  });
};

// Create winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'pme2go-api',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'production'
    }),
    
    // Combined log (all levels)
    createDailyRotateTransport('combined', 'debug'),
    
    // Error log (error level only)
    createDailyRotateTransport('error', 'error'),
    
    // HTTP requests log
    createDailyRotateTransport('access', 'http'),
    
    // Security events log
    createDailyRotateTransport('security', 'warn'),
    
    // Admin activities log
    createDailyRotateTransport('admin', 'info')
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  ]
});

// Custom logging methods for different contexts
const createContextLogger = (context) => {
  return {
    debug: (message, meta = {}) => logger.debug(message, { ...meta, context }),
    info: (message, meta = {}) => logger.info(message, { ...meta, context }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, context }),
    error: (message, meta = {}) => logger.error(message, { ...meta, context }),
    
    // Security-specific logging
    security: (event, details = {}) => logger.warn(`[SECURITY] ${event}`, {
      context,
      securityEvent: event,
      ...details
    }),
    
    // Admin activity logging
    adminActivity: (action, adminId, details = {}) => logger.info(`[ADMIN] ${action}`, {
      context,
      action,
      adminId,
      ...details
    }),
    
    // HTTP request logging
    http: (req, res, responseTime) => {
      const logData = {
        context,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.userId || null,
        contentLength: res.get('Content-Length') || 0
      };
      
      // Log level based on status code
      if (res.statusCode >= 500) {
        logger.error('[HTTP] Server Error', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('[HTTP] Client Error', logData);
      } else {
        logger.http('[HTTP] Request', logData);
      }
    },
    
    // Database query logging
    database: (query, duration, success = true, error = null) => {
      const logData = {
        context,
        query: query.substring(0, 200), // Truncate long queries
        duration: `${duration}ms`,
        success
      };
      
      if (error) {
        logger.error('[DATABASE] Query Failed', { ...logData, error: error.message });
      } else if (duration > 1000) {
        logger.warn('[DATABASE] Slow Query', logData);
      } else {
        logger.debug('[DATABASE] Query', logData);
      }
    },
    
    // Authentication events
    auth: (event, userId, email, details = {}) => {
      logger.info(`[AUTH] ${event}`, {
        context,
        event,
        userId,
        email,
        ...details
      });
    },
    
    // Performance monitoring
    performance: (operation, duration, metadata = {}) => {
      const logData = {
        context,
        operation,
        duration: `${duration}ms`,
        ...metadata
      };
      
      if (duration > 5000) {
        logger.warn('[PERFORMANCE] Slow Operation', logData);
      } else {
        logger.info('[PERFORMANCE] Operation', logData);
      }
    }
  };
};

// Create specific loggers for different parts of the application
const loggers = {
  server: createContextLogger('SERVER'),
  auth: createContextLogger('AUTH'),
  database: createContextLogger('DATABASE'),
  api: createContextLogger('API'),
  admin: createContextLogger('ADMIN'),
  email: createContextLogger('EMAIL'),
  websocket: createContextLogger('WEBSOCKET'),
  security: createContextLogger('SECURITY')
};

// Middleware for request logging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  loggers.api.debug('Request received', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || null
  });
  
  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - start;
    
    // Log request completion
    loggers.api.http(req, res, responseTime);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || null,
    body: req.body,
    params: req.params,
    query: req.query
  };
  
  // Log different error types at appropriate levels
  if (error.status >= 500 || !error.status) {
    loggers.api.error('Server Error', errorDetails);
  } else if (error.status >= 400) {
    loggers.api.warn('Client Error', errorDetails);
  }
  
  next(error);
};

// Helper function to log database operations
const logDatabaseOperation = async (operation, queryFn) => {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    loggers.database.database(operation, duration, true);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    loggers.database.database(operation, duration, false, error);
    throw error;
  }
};

// System monitoring functions
const logSystemHealth = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  loggers.server.info('System Health Check', {
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: `${Math.round(process.uptime())}s`
  });
};

// Log application startup
const logStartup = (port) => {
  loggers.server.info('PME2GO API Server Starting', {
    port,
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
    logLevel: logger.level,
    pid: process.pid
  });
};

// Log graceful shutdown
const logShutdown = (signal) => {
  loggers.server.info('PME2GO API Server Shutting Down', {
    signal,
    uptime: `${Math.round(process.uptime())}s`
  });
};

// Security event logging helpers
const logSecurityEvent = (event, req, details = {}) => {
  loggers.security.security(event, {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userId || null,
    ...details
  });
};

// Export everything
module.exports = {
  logger,
  loggers,
  requestLogger,
  errorLogger,
  logDatabaseOperation,
  logSystemHealth,
  logStartup,
  logShutdown,
  logSecurityEvent,
  createContextLogger
};