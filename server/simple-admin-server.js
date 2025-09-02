const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pme-360-db',
  user: 'postgres',
  password: 'Postgres2024!'
});

let isDatabaseConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
async function testDatabaseConnection() {
  try {
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
    mode: isDatabaseConnected ? 'database' : 'demo',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoints
app.get('/api/admin/test', (req, res) => {
  res.json({ 
    message: 'Admin endpoints are working!', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      const [users, opportunities, messages, events] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM opportunities'),
        pool.query('SELECT COUNT(*) FROM messages'),
        pool.query('SELECT COUNT(*) FROM events')
      ]);

      res.json({
        users: { total: parseInt(users.rows[0].count), growth: '+12%' },
        opportunities: { total: parseInt(opportunities.rows[0].count), growth: '+8%' },
        messages: { total: parseInt(messages.rows[0].count), growth: '+25%' },
        events: { total: parseInt(events.rows[0].count), growth: '+5%' },
        revenue: { total: 125430, growth: '+18%' },
        activeUsers: { total: 89, growth: '+15%' }
      });
    } else {
      // Demo data
      res.json({
        users: { total: 156, growth: '+12%' },
        opportunities: { total: 43, growth: '+8%' },
        messages: { total: 892, growth: '+25%' },
        events: { total: 12, growth: '+5%' },
        revenue: { total: 125430, growth: '+18%' },
        activeUsers: { total: 89, growth: '+15%' }
      });
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      const result = await pool.query(`
        SELECT id, uuid, name, email, type, industry, location, 
               verified, created_at, role, email_verified
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 100
      `);
      res.json(result.rows);
    } else {
      // Demo users
      res.json([
        {
          id: 1,
          uuid: '1',
          name: 'TechStart Solutions',
          email: 'contact@techstart.fr',
          type: 'PME/Startup',
          role: 'user',
          verified: true,
          email_verified: true,
          created_at: new Date().toISOString()
        }
      ]);
    }
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/system/health', (req, res) => {
  res.json({
    database: {
      status: isDatabaseConnected ? 'connected' : 'disconnected',
      connection_count: isDatabaseConnected ? 5 : 0
    },
    server: {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    api: {
      status: 'healthy',
      response_time: Math.floor(Math.random() * 50) + 10
    }
  });
});

app.get('/api/admin/logs', (req, res) => {
  const mockLogs = [
    {
      id: 1,
      action: 'USER_LOGIN',
      user_name: 'Marie Dubois',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      details: 'Successful login'
    },
    {
      id: 2,
      action: 'OPPORTUNITY_CREATED',
      user_name: 'TechStart Solutions',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      details: 'New job posting created'
    }
  ];
  
  res.json(mockLogs);
});

app.get('/api/admin/settings', (req, res) => {
  res.json({
    maintenance_mode: false,
    registration_enabled: true,
    email_notifications: true,
    max_file_size: 10485760,
    session_timeout: 3600
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 PME2GO Simple Admin Server running on http://localhost:${PORT}`);
  
  await testDatabaseConnection();
  
  console.log('📡 Admin endpoints available:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/admin/test');
  console.log('  GET  /api/admin/dashboard/stats');
  console.log('  GET  /api/admin/users');
  console.log('  GET  /api/admin/system/health');
  console.log('  GET  /api/admin/logs');
  console.log('  GET  /api/admin/settings');
  console.log('🎯 Server ready!');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});