const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3003;

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
let isConnected = false;

async function testConnection() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Database connected - Found ${result.rows[0].count} users`);
    isConnected = true;
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    isConnected = false;
    return false;
  }
}

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    databaseConnected: isConnected,
    message: `Simple test server running. DB: ${isConnected ? 'connected' : 'disconnected'}`
  });
});

// Simple users endpoint
app.get('/api/users', async (req, res) => {
  try {
    console.log('📊 Users endpoint called, database connected:', isConnected);
    
    if (!isConnected) {
      return res.json([]);
    }

    const query = 'SELECT uuid as id, name, type, email FROM users ORDER BY created_at DESC';
    console.log('🔍 Executing query:', query);
    
    const result = await pool.query(query);
    console.log(`📋 Query returned ${result.rows.length} users`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Users endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, type, industry, location, description } = req.body;
    console.log(`📝 Registration attempt for: ${email} (${name})`);
    
    if (!isConnected) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Insert new user (skip password hashing for demo)
    const uuid = Date.now().toString();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;
    
    const result = await pool.query(`
      INSERT INTO users (uuid, name, email, password_hash, type, industry, location, description, avatar, verified, stats, profile_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      uuid,
      name,
      email,
      'demo_password_hash', // In production, use bcrypt.hash(password, 10)
      type,
      industry,
      location,
      description,
      avatar,
      false, // verified
      JSON.stringify({ connections: 0, projects: 0, rating: 0, reviews: 0 }),
      JSON.stringify({})
    ]);

    const user = result.rows[0];
    console.log(`✅ User registered: ${user.name} (UUID: ${user.uuid})`);

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
        verified: user.verified,
        stats: user.stats || {}
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Simple login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}, database connected: ${isConnected}`);
    
    if (!isConnected) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log(`🔍 Found ${result.rows.length} users with email ${email}`);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
        success: true,
        user: {
          id: user.uuid,
          name: user.name,
          email: user.email,
          type: user.type,
          avatar: user.avatar
        }
      });
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  await testConnection();
  console.log('🎯 Server ready for testing...');
});