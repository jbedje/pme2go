const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// Direct database connection (working configuration)
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pme-360-db',
  user: 'postgres',
  password: 'Postgres2024!'
});

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Demo users for fallback mode
const demoUsers = [
  {
    id: '1',
    uuid: '1',
    name: 'TechStart Solutions',
    email: 'contact@techstart.fr',
    type: 'PME/Startup',
    industry: 'Technologie',
    location: 'Paris, France',
    description: 'Startup innovante dans le développement d\'applications mobiles',
    avatar: 'https://ui-avatars.com/api/?name=TechStart+Solutions&background=3b82f6&color=fff',
    verified: true,
    stats: { connections: 45, projects: 12, rating: 4.8, reviews: 23 }
  },
  {
    id: '2',
    uuid: '2',
    name: 'Marie Dubois',
    email: 'marie.dubois@consulting.fr',
    type: 'Expert/Consultant',
    industry: 'Marketing Digital',
    location: 'Lyon, France',
    description: 'Consultante senior en transformation digitale avec 15 ans d\'expérience',
    avatar: 'https://ui-avatars.com/api/?name=Marie+Dubois&background=10b981&color=fff',
    verified: true,
    stats: { connections: 128, projects: 87, rating: 4.9, reviews: 45 }
  },
  {
    id: '3',
    uuid: '3',
    name: 'Jean-Pierre Martin',
    email: 'jp.martin@mentor.fr',
    type: 'Mentor',
    industry: 'Finance',
    location: 'Bordeaux, France',
    description: 'Ex-directeur financier, accompagne les startups dans leur développement',
    avatar: 'https://ui-avatars.com/api/?name=Jean-Pierre+Martin&background=f59e0b&color=fff',
    verified: true,
    stats: { connections: 89, projects: 34, rating: 4.7, reviews: 28 }
  }
];

// Track database connection status
let isDatabaseConnected = false;

// Demo data for fallback mode
const demoOpportunities = [
  {
    id: '1',
    title: 'Développeur Full-Stack React/Node.js',
    type: 'Mission',
    company: 'TechStart Solutions',
    industry: 'Technologie',
    location: 'Paris, France',
    budget: '45-60k€',
    duration: '6 mois',
    description: 'Recherche un développeur expérimenté pour notre nouvelle plateforme SaaS',
    requirements: ['React', 'Node.js', 'PostgreSQL', '3+ ans d\'expérience'],
    tags: ['React', 'Node.js', 'Full-Stack'],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 12,
    status: 'active',
    author_id: '1',
    author_name: 'TechStart Solutions',
    created_at: new Date().toISOString()
  }
];

const demoEvents = [
  {
    id: '1',
    title: 'Pitch Night - Startups & Investisseurs',
    type: 'Networking',
    organizer: 'PME2GO Community',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Paris, Station F',
    description: 'Soirée de networking entre startups et investisseurs',
    attendees: 45,
    price: 'Gratuit',
    tags: ['Networking', 'Startups', 'Investissement'],
    created_at: new Date().toISOString()
  }
];

const demoMessages = [];

// Middleware
app.use(cors());
app.use(express.json());

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

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`🔍 Login attempt for ${email}, database connected: ${isDatabaseConnected}`);
  
  if (isDatabaseConnected) {
    // Database mode - use real authentication
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }
      
      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }
      
      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        user: {
          ...userWithoutPassword,
          id: user.uuid, // Use UUID as frontend ID
          stats: user.stats || {},
          profile_data: user.profile_data || {}
        }
      });
    } catch (error) {
      console.error('Database login error:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    // Demo mode - simple email matching (accept any password)
    const user = demoUsers.find(u => u.email === email);
    
    if (user) {
      console.log(`✅ Demo login successful for ${email}`);
      res.json({
        success: true,
        user: user
      });
    } else {
      console.log(`❌ Demo login failed for ${email} - user not found`);
      res.status(401).json({ error: 'Email ou mot de passe incorrect. Utilisez un compte de démonstration.' });
    }
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, type, industry, location, description } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = Date.now().toString();
    
    // Insert new user
    const result = await pool.query(`
      INSERT INTO users (uuid, name, email, password_hash, type, industry, location, description, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      uuid,
      name,
      email,
      hashedPassword,
      type,
      industry,
      location,
      description,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`
    ]);
    
    const user = result.rows[0];
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        id: user.uuid
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Users routes
app.get('/api/users', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      // Database mode
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
      res.json(result.rows);
    } else {
      // Demo mode - return filtered demo users
      const { type, industry, location, keywords } = req.query;
      
      let filteredUsers = demoUsers.filter(user => {
        if (type && user.type !== type) return false;
        if (industry && user.industry !== industry) return false;
        if (location && !user.location.toLowerCase().includes(location.toLowerCase())) return false;
        if (keywords && !user.name.toLowerCase().includes(keywords.toLowerCase()) && 
            !user.description?.toLowerCase().includes(keywords.toLowerCase())) return false;
        return true;
      });
      
      res.json(filteredUsers);
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE uuid = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = result.rows[0];
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      ...userWithoutPassword,
      id: user.uuid
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Opportunities routes
app.get('/api/opportunities', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      // Database mode
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
      // Demo mode
      res.json(demoOpportunities);
    }
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/opportunities', async (req, res) => {
  try {
    const { title, type, company, industry, location, budget, duration, description, requirements, tags, deadline, authorId } = req.body;
    
    const uuid = Date.now().toString();
    
    const result = await pool.query(`
      INSERT INTO opportunities (uuid, title, type, author_id, company, industry, location, budget, duration, description, requirements, tags, deadline)
      VALUES ($1, $2, $3, (SELECT id FROM users WHERE uuid = $4), $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING uuid as id, *
    `, [uuid, title, type, authorId, company, industry, location, budget, duration, description, requirements, tags, deadline]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Messages routes
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contactId } = req.query;
    
    let query = `
      SELECT m.uuid as id, m.content, m.read_status as read, m.created_at as timestamp,
             sender.uuid as senderId, receiver.uuid as receiverId,
             sender.name as senderName, receiver.name as receiverName
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (sender.uuid = $1 OR receiver.uuid = $1)
    `;
    
    const params = [userId];
    
    if (contactId) {
      params.push(contactId);
      query += ` AND (sender.uuid = $2 OR receiver.uuid = $2)`;
    }
    
    query += ' ORDER BY m.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    
    const uuid = Date.now().toString();
    
    const result = await pool.query(`
      INSERT INTO messages (uuid, sender_id, receiver_id, content)
      VALUES ($1, (SELECT id FROM users WHERE uuid = $2), (SELECT id FROM users WHERE uuid = $3), $4)
      RETURNING uuid as id, content, created_at as timestamp, read_status as read
    `, [uuid, senderId, receiverId, content]);
    
    res.json({
      ...result.rows[0],
      senderId,
      receiverId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Events routes
app.get('/api/events', async (req, res) => {
  try {
    if (isDatabaseConnected) {
      // Database mode
      const result = await pool.query(`
        SELECT uuid as id, title, type, organizer, event_date as date, location,
               description, attendees, price, tags, created_at
        FROM events
        ORDER BY event_date ASC
      `);
      
      res.json(result.rows);
    } else {
      // Demo mode
      res.json(demoEvents);
    }
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Favorites routes
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT profile.uuid as id
      FROM favorites f
      JOIN users user_table ON f.user_id = user_table.id
      JOIN users profile ON f.profile_id = profile.id
      WHERE user_table.uuid = $1
    `, [userId]);
    
    res.json(result.rows.map(row => row.id));
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, profileId } = req.body;
    
    await pool.query(`
      INSERT INTO favorites (user_id, profile_id)
      VALUES ((SELECT id FROM users WHERE uuid = $1), (SELECT id FROM users WHERE uuid = $2))
      ON CONFLICT (user_id, profile_id) DO NOTHING
    `, [userId, profileId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/favorites/:userId/:profileId', async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    
    await pool.query(`
      DELETE FROM favorites
      WHERE user_id = (SELECT id FROM users WHERE uuid = $1)
      AND profile_id = (SELECT id FROM users WHERE uuid = $2)
    `, [userId, profileId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`✅ Database connected - Found ${result.rows[0].user_count} users`);
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    console.log('⚠️  Database connection failed:', error.message);
    console.log('🔄 Server will continue in demo mode with API endpoints');
    isDatabaseConnected = false;
    return false;
  }
}

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 PME2GO API server running on http://localhost:${PORT}`);
  
  // Test database connection
  await testDatabaseConnection();
  
  console.log('📡 Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/users');
  console.log('  GET  /api/opportunities');
  console.log('  POST /api/opportunities');
  console.log('  GET  /api/messages/:userId');
  console.log('  POST /api/messages');
  console.log('  GET  /api/events');
  console.log('  GET  /api/favorites/:userId');
  console.log('  POST /api/favorites');
  console.log('🎯 Server ready and listening...');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

// Handle uncaught exceptions and rejections to prevent server crash
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server continuing to run...');
});