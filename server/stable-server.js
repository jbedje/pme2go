const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3002; // Port for React app

// Middleware
app.use(cors());
app.use(express.json());

// Direct database connection (proven working)
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PME2GO API is running',
    databaseConnected: isConnected,
    mode: isConnected ? 'database' : 'demo'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);
    
    if (!isConnected) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ User found: ${user.name}`);
      
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
      console.log(`❌ User not found for email: ${email}`);
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Users endpoint
app.get('/api/users', async (req, res) => {
  try {
    console.log('📊 Users endpoint called');
    
    if (!isConnected) {
      return res.json([]);
    }

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
    
    const result = await pool.query(query, params);
    console.log(`📋 Returning ${result.rows.length} users`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Users endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Opportunities endpoint
app.get('/api/opportunities', async (req, res) => {
  try {
    console.log('💼 Opportunities endpoint called');
    
    if (!isConnected) {
      return res.json([]);
    }

    const result = await pool.query(`
      SELECT o.uuid as id, o.title, o.type, o.company, o.industry, o.location,
             o.budget, o.duration, o.description, o.requirements, o.tags,
             o.deadline, o.applicants, o.status, o.created_at,
             u.name as author_name, u.uuid as author_id
      FROM opportunities o
      JOIN users u ON o.author_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    console.log(`📋 Returning ${result.rows.length} opportunities`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Opportunities endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Events endpoint
app.get('/api/events', async (req, res) => {
  try {
    console.log('📅 Events endpoint called');
    
    if (!isConnected) {
      return res.json([]);
    }

    const result = await pool.query(`
      SELECT uuid as id, title, type, organizer, event_date as date, location,
             description, attendees, price, tags, created_at
      FROM events
      ORDER BY event_date ASC
    `);
    
    console.log(`📋 Returning ${result.rows.length} events`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Events endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.log('🔄 Server continuing...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  console.log('🔄 Server continuing...');
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 PME2GO Stable API Server running on http://localhost:${PORT}`);
  
  // Test database connection
  const connected = await testConnection();
  
  if (connected) {
    console.log('🎯 Server ready with database connection!');
    console.log('📡 Available endpoints:');
    console.log('  GET  /api/health');
    console.log('  POST /api/auth/login');
    console.log('  GET  /api/users');
    console.log('  GET  /api/opportunities');
    console.log('  GET  /api/events');
  } else {
    console.log('⚠️  Server running without database connection');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down server...');
  server.close(async () => {
    await pool.end();
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

module.exports = app;