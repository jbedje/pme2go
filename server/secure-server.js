require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./email-service');
const { 
  loggers, 
  requestLogger, 
  errorLogger, 
  logDatabaseOperation, 
  logSystemHealth,
  logStartup, 
  logShutdown,
  logSecurityEvent
} = require('./logger');
const { 
  router: performanceRouter, 
  performanceMonitor, 
  performanceMiddleware 
} = require('./performance-api');

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3004; // Use SERVER_PORT for local development

// Security Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

// Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (before rate limiting to log all requests)
app.use(requestLogger);

// Performance monitoring middleware
app.use(performanceMiddleware);

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'Postgres2024!'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database connection status
let isDatabaseConnected = false;

async function testDatabaseConnection() {
  try {
    loggers.database.info('Testing database connection...');
    const result = await logDatabaseOperation(
      'SELECT COUNT(*) as user_count FROM users',
      () => pool.query('SELECT COUNT(*) as user_count FROM users')
    );
    const userCount = result.rows[0].user_count;
    loggers.database.info('Database connected successfully', { userCount });
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    loggers.database.error('Database connection failed', {
      error: error.message,
      code: error.code,
      detail: error.detail
    });
    isDatabaseConnected = false;
    return false;
  }
}

// JWT Token Utilities
function generateTokens(user) {
  const payload = {
    userId: user.uuid || user.id,
    email: user.email,
    type: user.type
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'pme2go-api',
    audience: 'pme2go-frontend'
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' }, 
    JWT_SECRET, 
    { 
      expiresIn: '7d',
      issuer: 'pme2go-api',
      audience: 'pme2go-frontend'
    }
  );

  return { accessToken, refreshToken };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'pme2go-api',
    audience: 'pme2go-frontend'
  });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logSecurityEvent('MISSING_AUTH_TOKEN', req);
    return res.status(401).json({ 
      error: 'Token d\'accès requis',
      code: 'MISSING_TOKEN' 
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    loggers.auth.debug('Token authenticated successfully', { 
      userId: decoded.userId,
      email: decoded.email 
    });
    next();
  } catch (error) {
    logSecurityEvent('TOKEN_VERIFICATION_FAILED', req, {
      error: error.name,
      message: error.message
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Token invalide',
      code: 'INVALID_TOKEN' 
    });
  }
}

// Input Validation Helpers
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validation Rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'),
  body('type')
    .isIn(['PME/Startup', 'Expert/Consultant', 'Mentor', 'Incubateur', 'Investisseur', 'Institution Financière', 'Organisme Public', 'Partenaire Tech'])
    .withMessage('Type d\'utilisateur invalide'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('L\'industrie ne peut pas dépasser 100 caractères'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La localisation ne peut pas dépasser 200 caractères')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PME2GO Secure API is running',
    databaseConnected: isDatabaseConnected,
    mode: isDatabaseConnected ? 'database' : 'offline',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Authentication Endpoints
app.post('/api/auth/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, type, industry, location, description } = req.body;
    loggers.auth.info('Registration attempt', { email, name, type, hasIndustry: !!industry });

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Check if user already exists
    const existingUser = await logDatabaseOperation(
      'Check existing user by email',
      () => pool.query('SELECT id FROM users WHERE email = $1', [email])
    );
    if (existingUser.rows.length > 0) {
      logSecurityEvent('DUPLICATE_REGISTRATION_ATTEMPT', req, { email });
      performanceMonitor.trackAuthenticationAttempt('failed', 'registration', {
        reason: 'duplicate_email',
        email: email.substring(0, 3) + '***'
      });
      return res.status(409).json({ 
        error: 'Un utilisateur avec cet email existe déjà',
        code: 'EMAIL_EXISTS' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = uuidv4();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;

    // Insert new user with email_verified = false
    const result = await pool.query(`
      INSERT INTO users (uuid, name, email, password_hash, type, industry, location, bio, verified, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING uuid, name, email, type, industry, location, bio, verified, email_verified, created_at
    `, [
      userId,
      name,
      email,
      hashedPassword,
      type,
      industry || null,
      location || null,
      description || null,
      false,
      false // email_verified = false
    ]);

    const user = result.rows[0];
    loggers.auth.auth('USER_REGISTERED', user.uuid, user.email, { 
      name: user.name, 
      type: user.type,
      hasIndustry: !!user.industry,
      hasLocation: !!user.location
    });

    // Track performance metrics
    performanceMonitor.trackAuthenticationAttempt('success', 'registration', {
      userType: user.type,
      hasIndustry: !!user.industry
    });

    // Send verification email
    try {
      const emailResult = await emailService.sendVerificationEmail(user);
      if (emailResult.success) {
        loggers.email.info('Verification email sent', { email: user.email });
      } else {
        loggers.email.error('Failed to send verification email', { 
          email: user.email, 
          error: emailResult.error 
        });
      }
    } catch (error) {
      loggers.email.error('Email service error', { 
        email: user.email, 
        error: error.message 
      });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Un email de vérification a été envoyé.',
      user: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        type: user.type,
        industry: user.industry,
        location: user.location,
        bio: user.bio,
        verified: user.verified,
        emailVerified: user.email_verified
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      },
      requiresEmailVerification: true
    });
  } catch (error) {
    console.error('❌ Secure registration error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du compte',
      code: 'INTERNAL_ERROR' 
    });
  }
});

app.post('/api/auth/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Secure login attempt for: ${email}`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Login failed - User not found: ${email}`);
      return res.status(401).json({ 
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`❌ Login failed - Invalid password for: ${email}`);
      return res.status(401).json({ 
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    console.log(`✅ Secure login successful: ${user.name}`);

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login time
    await pool.query('UPDATE users SET last_login = NOW() WHERE uuid = $1', [user.uuid]);

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        type: user.type,
        industry: user.industry,
        location: user.location,
        description: user.description,
        avatar: user.avatar,
        verified: user.verified,
        stats: user.stats
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    console.error('❌ Secure login error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la connexion',
      code: 'INTERNAL_ERROR' 
    });
  }
});

// Token Refresh Endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Token de rafraîchissement requis',
        code: 'MISSING_REFRESH_TOKEN' 
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      return res.status(403).json({ 
        error: 'Token de rafraîchissement invalide',
        code: 'INVALID_REFRESH_TOKEN' 
      });
    }

    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE uuid = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = result.rows[0];

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      success: true,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token de rafraîchissement expiré',
        code: 'REFRESH_TOKEN_EXPIRED' 
      });
    }
    
    res.status(403).json({ 
      error: 'Token de rafraîchissement invalide',
      code: 'INVALID_REFRESH_TOKEN' 
    });
  }
});

// Logout (Optional - mainly for token blacklisting if implemented)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just return success
  console.log(`🚪 User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Protected Routes (require authentication)

// Users endpoint with pagination and improved filtering
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Secure users endpoint called');
    
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const { 
      type, 
      industry, 
      location, 
      keywords,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
    const offset = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'name', 'type', 'industry'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `
      SELECT uuid as id, name, type, industry, location, description, 
             avatar, verified, stats, profile_data, created_at
      FROM users 
      WHERE uuid != $1
    `;
    const params = [req.user.userId]; // Exclude current user

    // Add filters
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    if (industry) {
      params.push(industry);
      query += ` AND industry = $${params.length}`;
    }
    
    if (location) {
      params.push(`%${location}%`);
      query += ` AND location ILIKE $${params.length}`;
    }
    
    if (keywords) {
      params.push(`%${keywords}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    // Add sorting and pagination
    query += ` ORDER BY ${sortField} ${sortDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM users WHERE uuid != $1`;
    const countParams = [req.user.userId];
    let countParamIndex = 1;

    if (type) {
      countParams.push(type);
      countQuery += ` AND type = $${++countParamIndex}`;
    }
    if (industry) {
      countParams.push(industry);
      countQuery += ` AND industry = $${++countParamIndex}`;
    }
    if (location) {
      countParams.push(`%${location}%`);
      countQuery += ` AND location ILIKE $${++countParamIndex}`;
    }
    if (keywords) {
      countParams.push(`%${keywords}%`);
      countQuery += ` AND (name ILIKE $${++countParamIndex} OR description ILIKE $${++countParamIndex})`;
      countParams.push(`%${keywords}%`); // Add the same parameter again for the second ILIKE
    }

    console.log('🔍 Executing users query with params:', params.slice(1)); // Don't log user ID
    
    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limitNum);

    console.log(`📋 Returning ${result.rows.length} users (page ${pageNum}/${totalPages})`);
    
    res.json({
      users: result.rows,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Secure get users error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des utilisateurs',
      code: 'INTERNAL_ERROR' 
    });
  }
});

// Get single user profile
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const result = await pool.query(`
      SELECT uuid as id, name, type, industry, location, description, 
             avatar, verified, stats, profile_data, created_at
      FROM users 
      WHERE uuid = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND' 
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du profil',
      code: 'INTERNAL_ERROR' 
    });
  }
});

// Update user profile (user can only update their own profile)
app.put('/api/users/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('location').optional().trim().isLength({ max: 200 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { name, description, industry, location } = req.body;
    const userId = req.user.userId;

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      values.push(description);
    }
    if (industry !== undefined) {
      updates.push(`industry = $${++paramCount}`);
      values.push(industry);
    }
    if (location !== undefined) {
      updates.push(`location = $${++paramCount}`);
      values.push(location);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée à mettre à jour',
        code: 'NO_UPDATE_DATA' 
      });
    }

    // Add updated_at and user ID
    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE uuid = $${++paramCount}
      RETURNING uuid as id, name, type, industry, location, description, 
                avatar, verified, stats, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND' 
      });
    }

    console.log(`✅ Profile updated for user: ${result.rows[0].name}`);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du profil',
      code: 'INTERNAL_ERROR' 
    });
  }
});

// === ADMIN ROUTES ===
const { router: adminRouter, setPool } = require('./admin-endpoints');
setPool(pool); // Pass database pool to admin endpoints
app.use('/api/admin', authenticateToken, adminRouter);

// === PERFORMANCE MONITORING ROUTES ===
app.use('/api/admin/performance', authenticateToken, performanceRouter);

// Public performance dashboard (no authentication)
app.get('/performance-dashboard', (req, res) => {
  const dashboardHtml = require('./performance-api').generatePerformanceDashboard?.() || 
    '<h1>Dashboard Unavailable</h1><p>Please use /api/admin/performance/dashboard with authentication.</p>';
  res.set('Content-Type', 'text/html');
  res.send(dashboardHtml);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Données JSON invalides',
      code: 'INVALID_JSON'
    });
  }
  
  res.status(500).json({
    error: 'Erreur serveur interne',
    code: 'INTERNAL_ERROR'
  });
});

// Email Verification Endpoints

// Verify email token
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token de vérification requis',
        code: 'TOKEN_REQUIRED'
      });
    }

    console.log(`📧 Email verification attempt with token: ${token.substring(0, 8)}...`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Verify token
    const tokenData = await emailService.verifyToken(token, 'email_verification');
    
    if (!tokenData) {
      console.log(`❌ Invalid or expired verification token`);
      return res.status(400).json({
        error: 'Token de vérification invalide ou expiré',
        code: 'INVALID_TOKEN'
      });
    }

    // Update user as verified
    const result = await pool.query(`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
      WHERE uuid = $1
      RETURNING uuid, name, email, email_verified, email_verified_at;
    `, [tokenData.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Mark token as used
    await emailService.markTokenAsUsed(token);

    const user = result.rows[0];
    console.log(`✅ Email verified for user: ${user.name} (${user.email})`);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
      console.log(`🎉 Welcome email sent to: ${user.email}`);
    } catch (error) {
      console.log(`⚠️  Failed to send welcome email: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Email vérifié avec succès ! Bienvenue sur PME2GO.',
      user: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        verifiedAt: user.email_verified_at
      }
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la vérification',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requis',
        code: 'EMAIL_REQUIRED'
      });
    }

    console.log(`📧 Resend verification request for: ${email}`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, un nouveau lien de vérification a été envoyé.'
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'Cet email est déjà vérifié.'
      });
    }

    // Send verification email
    try {
      const emailResult = await emailService.sendVerificationEmail(user);
      if (emailResult.success) {
        console.log(`📧 Verification email resent to: ${user.email}`);
      }
    } catch (error) {
      console.log(`⚠️  Failed to resend verification email: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Un nouveau lien de vérification a été envoyé à votre adresse email.'
    });

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Password reset request
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requis',
        code: 'EMAIL_REQUIRED'
      });
    }

    console.log(`🔒 Password reset request for: ${email}`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.'
      });
    }

    const user = result.rows[0];

    // Send password reset email
    try {
      const emailResult = await emailService.sendPasswordResetEmail(user);
      if (emailResult.success) {
        console.log(`📧 Password reset email sent to: ${user.email}`);
      }
    } catch (error) {
      console.log(`⚠️  Failed to send password reset email: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.'
    });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token et nouveau mot de passe requis',
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    console.log(`🔒 Password reset attempt with token: ${token.substring(0, 8)}...`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    // Verify token
    const tokenData = await emailService.verifyToken(token, 'password_reset');
    
    if (!tokenData) {
      console.log(`❌ Invalid or expired password reset token`);
      return res.status(400).json({
        error: 'Token de réinitialisation invalide ou expiré',
        code: 'INVALID_TOKEN'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update user password
    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE uuid = $2
      RETURNING uuid, name, email;
    `, [hashedPassword, tokenData.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Mark token as used
    await emailService.markTokenAsUsed(token);

    const user = result.rows[0];
    console.log(`✅ Password reset successful for user: ${user.name} (${user.email})`);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès.'
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la réinitialisation',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================
// MESSAGES ENDPOINTS
// =====================

// Send message
app.post('/api/messages', authenticateToken, [
  body('receiverId').notEmpty().withMessage('ID du destinataire requis'),
  body('content').notEmpty().trim().isLength({ min: 1, max: 1000 }).withMessage('Contenu du message requis (1-1000 caractères)')
], handleValidationErrors, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;
    
    const uuid = uuidv4();
    
    const result = await logDatabaseOperation(
      'Create message',
      () => pool.query(`
        INSERT INTO messages (uuid, sender_id, receiver_id, content)
        VALUES ($1, (SELECT id FROM users WHERE uuid = $2), (SELECT id FROM users WHERE uuid = $3), $4)
        RETURNING uuid as id, content, created_at as timestamp, read_status as read
      `, [uuid, senderId, receiverId, content])
    );
    
    const message = {
      ...result.rows[0],
      senderId,
      receiverId
    };
    
    loggers.api.info('Message sent successfully', {
      messageId: message.id,
      senderId: senderId.substring(0, 8) + '...',
      receiverId: receiverId.substring(0, 8) + '...'
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Send message error:', error);
    loggers.api.error('Failed to send message', { error: error.message });
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi du message',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get messages for user
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    
    const result = await logDatabaseOperation(
      'Get user messages',
      () => pool.query(`
        SELECT m.uuid as id, m.content, m.created_at as timestamp, 
               m.read_status as read,
               sender.uuid as sender_id, receiver.uuid as receiver_id,
               sender.name as sender_name, receiver.name as receiver_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE (sender.uuid = $1 AND receiver.uuid = $2) 
           OR (sender.uuid = $2 AND receiver.uuid = $1)
        ORDER BY m.created_at DESC
        LIMIT 50
      `, [currentUserId, userId])
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get messages error:', error);
    loggers.api.error('Failed to get messages', { error: error.message });
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des messages',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================
// OPPORTUNITIES ENDPOINTS
// =====================

// Create opportunity
app.post('/api/opportunities', authenticateToken, [
  body('title').notEmpty().trim().isLength({ min: 5, max: 200 }).withMessage('Titre requis (5-200 caractères)'),
  body('type').isIn(['Mission', 'Emploi', 'Stage', 'Freelance', 'Partenariat', 'Autre']).withMessage('Type invalide'),
  body('company').optional().trim().isLength({ max: 100 }),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('location').optional().trim().isLength({ max: 255 }),
  body('budget').optional().trim().isLength({ max: 100 }),
  body('duration').optional().trim().isLength({ max: 100 }),
  body('description').notEmpty().trim().isLength({ min: 10, max: 2000 }).withMessage('Description requise (10-2000 caractères)'),
  body('deadline').optional().isISO8601().withMessage('Date limite invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const { title, type, company, industry, location, budget, duration, description, requirements, tags, deadline } = req.body;
    const authorId = req.user.userId;
    
    const uuid = uuidv4();
    
    const result = await logDatabaseOperation(
      'Create opportunity',
      () => pool.query(`
        INSERT INTO opportunities (uuid, title, type, author_id, company, industry, location, budget, duration, description, requirements, tags, deadline)
        VALUES ($1, $2, $3, (SELECT id FROM users WHERE uuid = $4), $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING uuid as id, title, type, company, industry, location, budget, duration, description, requirements, tags, deadline, created_at
      `, [uuid, title, type, authorId, company, industry, location, budget, duration, description, requirements || [], tags || [], deadline])
    );
    
    loggers.api.info('Opportunity created successfully', {
      opportunityId: result.rows[0].id,
      authorId: authorId.substring(0, 8) + '...',
      title: title.substring(0, 50)
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create opportunity error:', error);
    loggers.api.error('Failed to create opportunity', { error: error.message });
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'opportunité',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get opportunities
app.get('/api/opportunities', authenticateToken, async (req, res) => {
  try {
    const { type, industry, location, keywords } = req.query;
    
    let query = `
      SELECT o.uuid as id, o.title, o.type, o.company, o.industry, o.location, 
             o.budget, o.duration, o.description, o.requirements, o.tags, o.deadline,
             o.created_at, u.name as author_name, u.uuid as author_id
      FROM opportunities o
      JOIN users u ON o.author_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND o.type = $${params.length}`;
    }
    
    if (industry) {
      params.push(industry);
      query += ` AND o.industry = $${params.length}`;
    }
    
    if (location) {
      params.push(`%${location}%`);
      query += ` AND o.location ILIKE $${params.length}`;
    }
    
    if (keywords) {
      params.push(`%${keywords}%`);
      query += ` AND (o.title ILIKE $${params.length} OR o.description ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT 50`;
    
    const result = await logDatabaseOperation('Get opportunities', () => pool.query(query, params));
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get opportunities error:', error);
    loggers.api.error('Failed to get opportunities', { error: error.message });
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des opportunités',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================
// EVENTS ENDPOINTS
// =====================

// Create event
app.post('/api/events', authenticateToken, [
  body('title').notEmpty().trim().isLength({ min: 5, max: 200 }).withMessage('Titre requis (5-200 caractères)'),
  body('type').notEmpty().trim().withMessage('Type d\'événement requis'),
  body('event_date').isISO8601().withMessage('Date d\'événement requise et valide'),
  body('location').optional().trim().isLength({ max: 255 }),
  body('description').notEmpty().trim().isLength({ min: 10, max: 2000 }).withMessage('Description requise (10-2000 caractères)'),
  body('price').optional().trim().isLength({ max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const { title, type, event_date, location, description, price, tags } = req.body;
    const organizerId = req.user.userId;
    
    const uuid = uuidv4();
    
    // Get organizer name
    const organizerResult = await pool.query('SELECT name FROM users WHERE uuid = $1', [organizerId]);
    const organizer = organizerResult.rows[0]?.name || 'Organisateur';
    
    const result = await logDatabaseOperation(
      'Create event',
      () => pool.query(`
        INSERT INTO events (uuid, title, type, organizer, organizer_id, event_date, location, description, price, tags)
        VALUES ($1, $2, $3, $4, (SELECT id FROM users WHERE uuid = $5), $6, $7, $8, $9, $10)
        RETURNING uuid as id, title, type, organizer, event_date as date, location, description, attendees, price, tags, created_at
      `, [uuid, title, type, organizer, organizerId, event_date, location, description, price, tags || []])
    );
    
    loggers.api.info('Event created successfully', {
      eventId: result.rows[0].id,
      organizerId: organizerId.substring(0, 8) + '...',
      title: title.substring(0, 50)
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create event error:', error);
    loggers.api.error('Failed to create event', { error: error.message });
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'événement',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get events
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const { type, location, keywords } = req.query;
    
    let query = `
      SELECT uuid as id, title, type, organizer, event_date as date, location,
             description, attendees, price, tags, created_at
      FROM events
      WHERE event_date >= NOW()
    `;
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    if (location) {
      params.push(`%${location}%`);
      query += ` AND location ILIKE $${params.length}`;
    }
    
    if (keywords) {
      params.push(`%${keywords}%`);
      query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY event_date ASC LIMIT 50`;
    
    const result = await logDatabaseOperation('Get events', () => pool.query(query, params));
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get events error:', error);
    loggers.api.error('Failed to get events', { error: error.message });
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des événements',
      code: 'INTERNAL_ERROR'
    });
  }
});

// 404 handler
// Error logging middleware (before 404 handler)
app.use(errorLogger);

app.use((req, res) => {
  logSecurityEvent('ENDPOINT_NOT_FOUND', req, { endpoint: req.originalUrl });
  res.status(404).json({
    error: 'Endpoint non trouvé',
    code: 'NOT_FOUND'
  });
});

// Graceful error handling
process.on('uncaughtException', (error) => {
  loggers.server.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack,
    name: error.name
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  loggers.server.error('Unhandled Rejection', { 
    reason: reason?.toString?.() || reason, 
    promise: promise?.toString?.() || 'Unknown promise'
  });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logShutdown('SIGTERM');
  server.close(() => {
    loggers.server.info('Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logShutdown('SIGINT');
  server.close(() => {
    loggers.server.info('Server closed gracefully');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, async () => {
  logStartup(PORT);
  
  // Test database connection
  const connected = await testDatabaseConnection();
  
  if (connected) {
    loggers.server.info('Server ready with database connection', {
      endpoints: [
        'GET /api/health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/refresh',
        'POST /api/auth/logout',
        'GET /api/auth/verify-email',
        'POST /api/auth/resend-verification',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password',
        'GET /api/users (protected)',
        'GET /api/users/:id (protected)',
        'PUT /api/users/profile (protected)',
        'GET /api/admin/* (admin endpoints)'
      ]
    });
    
    // Start periodic system health monitoring
    setInterval(() => {
      logSystemHealth();
    }, 300000); // Every 5 minutes
    
    loggers.server.info('Admin credentials available', { 
      email: 'admin@pme360.com', 
      note: 'Use password123 for admin access' 
    });
  } else {
    loggers.server.warn('Server running in limited mode - database not available');
  }
});

module.exports = app;