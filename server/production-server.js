const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { Pool } = require('pg');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: '.env.production' });

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pme2go-api' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/pme2go.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Database connection with production settings
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
});

// Test database connection
pool.connect()
  .then(client => {
    logger.info('✅ Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  });

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", `wss://${process.env.REACT_APP_FRONTEND_URL?.replace('https://', '')}`]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// Compression
app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use(generalLimiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, { 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Authentication endpoints with rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Import existing API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const opportunityRoutes = require('./routes/opportunities');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 PME2GO API Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/api/health`);
});

module.exports = { app, server, pool };