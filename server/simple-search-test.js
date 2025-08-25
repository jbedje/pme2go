const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3008;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pme-360-db',
  password: 'Postgres2024!',
  port: 5432,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

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

// Simple search endpoint
app.get('/api/search/users', authenticateToken, async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    let searchQuery = `
      SELECT 
        id, uuid, name, email, company, position, bio, skills, languages, availability,
        website, linkedin, twitter, phone, created_at, updated_at
      FROM users 
      WHERE uuid != $1
    `;
    let queryParams = [req.user.userId];
    
    if (q) {
      searchQuery += ` AND (LOWER(name) ILIKE $2 OR LOWER(company) ILIKE $2)`;
      queryParams.push(`%${q.toLowerCase()}%`);
    }
    
    searchQuery += ` ORDER BY updated_at DESC LIMIT 20`;
    
    console.log('🔍 Executing search query:', searchQuery);
    console.log('📋 Query params:', queryParams);
    
    const result = await pool.query(searchQuery, queryParams);
    
    const users = result.rows.map(user => ({
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      fullName: user.name,
      first_name: user.name ? user.name.split(' ')[0] : '',
      last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email ? user.email.replace(/(.{2}).*@/, '$1***@') : null,
      company: user.company,
      position: user.position,
      bio: user.bio,
      skills: user.skills || [],
      languages: user.languages || [],
      availability: user.availability,
      website: user.website,
      linkedin: user.linkedin,
      twitter: user.twitter,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      has_avatar: !!(user.avatar),
      avatar_url: user.avatar
    }));
    
    res.json({
      users,
      pagination: {
        page: 1,
        limit: 20,
        total: users.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      filters: { q }
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      service: 'simple-search-test',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'simple-search-test',
      error: 'Database connection failed'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔍 Simple Search Test server running on port ${PORT}`);
});

module.exports = app;