const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Simple PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PME2GO API is running' });
});

// Get users
app.get('/api/users', async (req, res) => {
  try {
    console.log('📋 Fetching users from database...');
    const result = await pool.query(`
      SELECT uuid as id, name, type, industry, location, description, avatar, verified, stats
      FROM users
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} users`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Login endpoint  
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`📋 Login attempt for: ${email}`);
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const user = result.rows[0];
    console.log(`✅ User found: ${user.name}`);
    
    // For demo, accept "demo123" password for all users
    if (password !== 'demo123') {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        id: user.uuid,
        stats: user.stats || {}
      }
    });
    
    console.log(`✅ Login successful for: ${user.name}`);
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with better error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 PME2GO Simple API server running on http://localhost:${PORT}`);
  console.log('🎯 Server is ready and listening...');
});

// Test database connection
async function testConnection() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Database connection OK - ${result.rows[0].count} users found`);
  } catch (error) {
    console.log('⚠️  Database connection failed:', error.message);
  }
}

// Test connection after a short delay
setTimeout(testConnection, 1000);

// Prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
});

console.log('📡 API endpoints available:');
console.log('  GET  /api/health');
console.log('  POST /api/auth/login');
console.log('  GET  /api/users');