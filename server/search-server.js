const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.SEARCH_PORT || 3007;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Database configuration
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 search requests per windowMs
  message: { error: 'Too many search requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/search', searchLimiter);
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Search users endpoint
app.get('/api/search/users', 
  authenticateToken,
  [
    query('q').optional().isLength({ min: 1, max: 100 }).trim(),
    query('skills').optional().isArray(),
    query('company').optional().isLength({ max: 100 }).trim(),
    query('position').optional().isLength({ max: 100 }).trim(),
    query('availability').optional().isIn(['available', 'busy', 'unavailable']),
    query('languages').optional().isArray(),
    query('location').optional().isLength({ max: 100 }).trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sortBy').optional().isIn(['relevance', 'name', 'company', 'updated_at', 'created_at']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        q = '',
        skills = [],
        company = '',
        position = '',
        availability = '',
        languages = [],
        location = '',
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = req.query;

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      // Exclude current user from results (use UUID field)
      whereConditions.push(`uuid != $${++paramCount}`);
      queryParams.push(req.user.userId);

      // Text search in name, email, company, position, bio
      if (q) {
        whereConditions.push(`(
          LOWER(name) ILIKE $${++paramCount} OR
          LOWER(email) ILIKE $${++paramCount} OR
          LOWER(company) ILIKE $${++paramCount} OR
          LOWER(position) ILIKE $${++paramCount} OR
          LOWER(bio) ILIKE $${++paramCount}
        )`);
        const searchTerm = `%${q.toLowerCase()}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Skills filter (JSON array contains any of the specified skills)
      if (Array.isArray(skills) && skills.length > 0) {
        const skillsConditions = skills.map(skill => {
          whereConditions.push(`skills ? $${++paramCount}`);
          queryParams.push(skill);
          return true;
        });
      }

      // Company filter
      if (company) {
        whereConditions.push(`LOWER(company) ILIKE $${++paramCount}`);
        queryParams.push(`%${company.toLowerCase()}%`);
      }

      // Position filter
      if (position) {
        whereConditions.push(`LOWER(position) ILIKE $${++paramCount}`);
        queryParams.push(`%${position.toLowerCase()}%`);
      }

      // Availability filter
      if (availability) {
        whereConditions.push(`availability = $${++paramCount}`);
        queryParams.push(availability);
      }

      // Languages filter
      if (Array.isArray(languages) && languages.length > 0) {
        const languageConditions = languages.map(lang => {
          whereConditions.push(`languages ? $${++paramCount}`);
          queryParams.push(lang);
          return true;
        });
      }

      // Location filter (basic text search)
      if (location) {
        whereConditions.push(`LOWER(COALESCE(address, '')) ILIKE $${++paramCount}`);
        queryParams.push(`%${location.toLowerCase()}%`);
      }

      // Build the WHERE clause
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Build ORDER BY clause
      let orderClause = '';
      if (sortBy === 'relevance' && q) {
        orderClause = `ORDER BY 
          CASE 
            WHEN LOWER(name) ILIKE $${++paramCount} THEN 1
            WHEN LOWER(company) ILIKE $${++paramCount} THEN 2
            WHEN LOWER(position) ILIKE $${++paramCount} THEN 3
            ELSE 4
          END ASC,
          updated_at DESC`;
        const exactMatch = `%${q.toLowerCase()}%`;
        queryParams.push(exactMatch, exactMatch, exactMatch);
      } else {
        const validSortColumns = {
          'name': 'name',
          'company': 'company',
          'updated_at': 'updated_at',
          'created_at': 'created_at'
        };
        const sortColumn = validSortColumns[sortBy] || 'updated_at';
        orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Main search query
      const searchQuery = `
        SELECT 
          id,
          name,
          email,
          company,
          position,
          bio,
          avatar,
          skills,
          languages,
          availability,
          website,
          linkedin,
          twitter,
          phone,
          created_at,
          updated_at,
          CASE 
            WHEN avatar IS NOT NULL AND avatar != '' THEN true
            ELSE false
          END as has_avatar
        FROM users 
        ${whereClause}
        ${orderClause}
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      queryParams.push(limit, offset);

      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users 
        ${whereClause}
      `;

      const countParams = queryParams.slice(0, queryParams.length - 2); // Remove limit and offset

      // Execute both queries
      const [searchResult, countResult] = await Promise.all([
        pool.query(searchQuery, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const users = searchResult.rows.map(user => ({
        ...user,
        // Map the single name to first/last for compatibility with frontend
        first_name: user.name ? user.name.split(' ')[0] : '',
        last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
        fullName: user.name,
        avatar_url: user.avatar,
        skills: user.skills || [],
        languages: user.languages || [],
        // Don't expose sensitive information
        email: user.email ? user.email.replace(/(.{2}).*@/, '$1***@') : null
      }));

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          q,
          skills,
          company,
          position,
          availability,
          languages,
          location
        }
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Internal server error during search' });
    }
  }
);

// Get search filters/facets endpoint
app.get('/api/search/filters', 
  authenticateToken,
  async (req, res) => {
    try {
      // Get unique values for filter options
      const filtersQuery = `
        SELECT 
          array_agg(DISTINCT company) FILTER (WHERE company IS NOT NULL AND company != '') as companies,
          array_agg(DISTINCT position) FILTER (WHERE position IS NOT NULL AND position != '') as positions,
          array_agg(DISTINCT availability) FILTER (WHERE availability IS NOT NULL) as availability_options
        FROM users
      `;

      // Get all unique skills and languages
      const skillsQuery = `
        SELECT DISTINCT jsonb_array_elements_text(skills) as skill
        FROM users 
        WHERE skills IS NOT NULL AND jsonb_array_length(skills) > 0
        ORDER BY skill
      `;

      const languagesQuery = `
        SELECT DISTINCT jsonb_array_elements_text(languages) as language
        FROM users 
        WHERE languages IS NOT NULL AND jsonb_array_length(languages) > 0
        ORDER BY language
      `;

      const [filtersResult, skillsResult, languagesResult] = await Promise.all([
        pool.query(filtersQuery),
        pool.query(skillsQuery),
        pool.query(languagesQuery)
      ]);

      const filters = filtersResult.rows[0];

      res.json({
        companies: filters.companies || [],
        positions: filters.positions || [],
        availability: filters.availability_options || [],
        skills: skillsResult.rows.map(row => row.skill),
        languages: languagesResult.rows.map(row => row.language)
      });

    } catch (error) {
      console.error('Get filters error:', error);
      res.status(500).json({ error: 'Internal server error getting filters' });
    }
  }
);

// Search suggestions endpoint
app.get('/api/search/suggestions',
  authenticateToken,
  [
    query('q').isLength({ min: 1, max: 50 }).trim(),
    query('type').optional().isIn(['users', 'companies', 'positions', 'skills'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, type = 'users' } = req.query;
      const searchTerm = `%${q.toLowerCase()}%`;

      let suggestions = [];

      switch (type) {
        case 'users':
          const usersQuery = `
            SELECT DISTINCT name as suggestion
            FROM users 
            WHERE LOWER(name) ILIKE $1
            AND uuid != $2
            LIMIT 10
          `;
          const usersResult = await pool.query(usersQuery, [searchTerm, req.user.userId]);
          suggestions = usersResult.rows.map(row => row.suggestion);
          break;

        case 'companies':
          const companiesQuery = `
            SELECT DISTINCT company as suggestion
            FROM users 
            WHERE LOWER(company) ILIKE $1 
            AND company IS NOT NULL 
            AND company != ''
            LIMIT 10
          `;
          const companiesResult = await pool.query(companiesQuery, [searchTerm]);
          suggestions = companiesResult.rows.map(row => row.suggestion);
          break;

        case 'positions':
          const positionsQuery = `
            SELECT DISTINCT position as suggestion
            FROM users 
            WHERE LOWER(position) ILIKE $1 
            AND position IS NOT NULL 
            AND position != ''
            LIMIT 10
          `;
          const positionsResult = await pool.query(positionsQuery, [searchTerm]);
          suggestions = positionsResult.rows.map(row => row.suggestion);
          break;

        case 'skills':
          const skillsQuery = `
            SELECT DISTINCT jsonb_array_elements_text(skills) as suggestion
            FROM users 
            WHERE skills IS NOT NULL 
            AND LOWER(jsonb_array_elements_text(skills)) ILIKE $1
            LIMIT 10
          `;
          const skillsResult = await pool.query(skillsQuery, [searchTerm]);
          suggestions = skillsResult.rows.map(row => row.suggestion);
          break;
      }

      res.json({ suggestions });

    } catch (error) {
      console.error('Search suggestions error:', error);
      res.status(500).json({ error: 'Internal server error getting suggestions' });
    }
  }
);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      service: 'search-api',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'search-api',
      error: 'Database connection failed'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🔍 Search API server running on port ${PORT}`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔍 Search server shutting down...');
  server.close(async () => {
    await pool.end();
    console.log('🔍 Search server stopped');
    process.exit(0);
  });
});

module.exports = app;