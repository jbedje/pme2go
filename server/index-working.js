const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Direct database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pme-360-db',
  user: 'postgres',
  password: 'Postgres2024!'
});

// Test database connection
let isDatabaseConnected = false;

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`✅ Database connected - Found ${result.rows[0].user_count} users`);
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    console.log('⚠️  Database connection failed:', error.message);
    isDatabaseConnected = false;
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PME2GO API is running',
    databaseConnected: isDatabaseConnected,
    mode: isDatabaseConnected ? 'database' : 'demo'
  });
});

// Authentication - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}, database connected: ${isDatabaseConnected}`);
    
    if (isDatabaseConnected) {
      // Database mode
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }
      
      const user = result.rows[0];
      // For demo, skip password validation (in production, use bcrypt.compare)
      
      res.json({
        success: true,
        user: {
          id: user.uuid,
          name: user.name,
          email: user.email,
          type: user.type,
          industry: user.industry,
          location: user.location,
          description: user.description,
          avatar: user.avatar,
          verified: user.verified || false,
          stats: user.stats || {}
        }
      });
    } else {
      res.status(500).json({ error: 'Database not connected' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    console.log('📊 Users endpoint called, database connected:', isDatabaseConnected);
    
    if (isDatabaseConnected) {
      const { type, industry, location, keywords } = req.query;
      
      let query = 'SELECT uuid as id, name, type, industry, location, description, avatar, verified, stats, profile_data FROM users WHERE 1=1';
      const params = [];
      
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
      
      query += ' ORDER BY created_at DESC';
      
      console.log('🔍 Executing users query with params:', params);
      const result = await pool.query(query, params);
      console.log(`📋 Query returned ${result.rows.length} users`);
      
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Opportunities
app.get('/api/opportunities', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      const result = await pool.query(`
        SELECT o.uuid as id, o.title, o.type, o.company, o.industry, o.location,
               o.budget, o.duration, o.description, o.requirements, o.tags,
               o.deadline, o.applicants, o.status, o.created_at,
               u.name as author_name, u.uuid as author_id
        FROM opportunities o
        JOIN users u ON o.author_id = u.id
        ORDER BY o.created_at DESC
      `);
      
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Get opportunities error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Events
app.get('/api/events', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      const result = await pool.query(`
        SELECT uuid as id, title, type, organizer, event_date as date, location,
               description, attendees, price, tags, created_at
        FROM events
        ORDER BY event_date ASC
      `);
      
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add graceful error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server continuing to run...');
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 PME2GO API server running on http://localhost:${PORT}`);
  
  // Test database connection
  await testDatabaseConnection();
  
  console.log('📡 Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/users');
  console.log('  GET  /api/opportunities');
  console.log('  GET  /api/events');
  console.log('🎯 Server ready and listening...');
});