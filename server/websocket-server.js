const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const PORT = 3005; // WebSocket enabled server port

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

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
      connectSrc: ["'self'", "ws:", "wss:"],
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

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pme-360-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Postgres2024!',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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

// JWT Token Utilities
function generateTokens(user) {
  const payload = {
    userId: user.id || user.uuid,
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

// Authentication Middleware for HTTP routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis',
      code: 'MISSING_TOKEN' 
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
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

// WebSocket Authentication Middleware
function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.userType = decoded.type;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
}

// In-memory store for active connections (in production, use Redis)
const activeUsers = new Map(); // userId -> socketId
const userRooms = new Map(); // userId -> Set of room IDs

// WebSocket Connection Handler
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`👤 User ${userId} connected via WebSocket`);
  
  // Store active user connection
  activeUsers.set(userId, socket.id);
  socket.emit('connected', { userId, message: 'Connected to real-time messaging' });

  // Join user to their personal room
  socket.join(`user_${userId}`);

  // Handle joining conversation rooms
  socket.on('join_conversation', async (data) => {
    try {
      const { contactId } = data;
      const roomId = [userId, contactId].sort().join('_'); // Create consistent room ID
      
      socket.join(roomId);
      
      // Track rooms for this user
      if (!userRooms.has(userId)) {
        userRooms.set(userId, new Set());
      }
      userRooms.get(userId).add(roomId);
      
      console.log(`💬 User ${userId} joined conversation with ${contactId} (room: ${roomId})`);
      socket.emit('conversation_joined', { roomId, contactId });
    } catch (error) {
      console.error('Join conversation error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content, messageType = 'text' } = data;
      
      if (!receiverId || !content?.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Save message to database
      const messageId = uuidv4();
      const timestamp = new Date().toISOString();
      
      if (isDatabaseConnected) {
        await pool.query(`
          INSERT INTO messages (uuid, sender_id, receiver_id, content, message_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [messageId, userId, receiverId, content, messageType, timestamp]);
      }

      const messageData = {
        id: messageId,
        senderId: userId,
        receiverId: receiverId,
        content: content,
        messageType: messageType,
        timestamp: timestamp,
        read_at: null
      };

      // Create room ID for this conversation
      const roomId = [userId, receiverId].sort().join('_');
      
      // Emit to conversation room
      io.to(roomId).emit('new_message', messageData);
      
      // Also emit to specific user rooms in case they're not in the conversation room yet
      io.to(`user_${receiverId}`).emit('new_message', messageData);
      
      console.log(`📨 Message sent from ${userId} to ${receiverId}`);
      
      // Confirm message sent to sender
      socket.emit('message_sent', { messageId, timestamp });
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle marking messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { senderId } = data;
      
      if (isDatabaseConnected) {
        await pool.query(`
          UPDATE messages 
          SET read_at = NOW() 
          WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL
        `, [userId, senderId]);
      }
      
      // Notify sender that messages were read
      io.to(`user_${senderId}`).emit('messages_read', { 
        readerId: userId, 
        readAt: new Date().toISOString() 
      });
      
      console.log(`👁️  Messages marked as read by ${userId} from ${senderId}`);
      
    } catch (error) {
      console.error('Mark messages read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(`user_${receiverId}`).emit('user_typing', { 
        userId: userId, 
        typing: true 
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(`user_${receiverId}`).emit('user_typing', { 
        userId: userId, 
        typing: false 
      });
    }
  });

  // Handle getting online users
  socket.on('get_online_users', () => {
    const onlineUsers = Array.from(activeUsers.keys());
    socket.emit('online_users', onlineUsers);
  });

  // === NOTIFICATIONS SYSTEM ===
  
  // Send notification to specific user
  const sendNotificationToUser = async (targetUserId, notification) => {
    try {
      const notificationId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const notificationData = {
        id: notificationId,
        userId: targetUserId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        data: notification.data || {},
        read: false,
        timestamp,
        fromUserId: userId
      };

      // Save to database if connected
      if (isDatabaseConnected) {
        try {
          await pool.query(`
            INSERT INTO notifications (uuid, user_id, title, message, type, data, read_status, created_at, from_user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            notificationId, targetUserId, notification.title, notification.message,
            notification.type, JSON.stringify(notification.data || {}), false,
            timestamp, userId
          ]);
        } catch (dbError) {
          console.error('Failed to save notification to database:', dbError);
        }
      }

      // Send real-time notification if user is online
      io.to(`user_${targetUserId}`).emit('new_notification', notificationData);
      
      console.log(`🔔 Notification sent to user ${targetUserId}: ${notification.title}`);
      return notificationData;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  };

  // Handle sending custom notifications
  socket.on('send_notification', async (data) => {
    try {
      const { targetUserId, title, message, type, notificationData } = data;
      
      if (!targetUserId || !title || !message) {
        socket.emit('error', { message: 'Invalid notification data' });
        return;
      }

      await sendNotificationToUser(targetUserId, {
        title,
        message,
        type: type || 'info',
        data: notificationData
      });

      socket.emit('notification_sent', { targetUserId, title });
    } catch (error) {
      console.error('Send notification error:', error);
      socket.emit('error', { message: 'Failed to send notification' });
    }
  });

  // Handle connection request notifications
  socket.on('send_connection_request', async (data) => {
    try {
      const { targetUserId } = data;
      
      if (!targetUserId) {
        socket.emit('error', { message: 'Target user ID required' });
        return;
      }

      // Get sender info from database
      let senderName = 'Utilisateur';
      if (isDatabaseConnected) {
        try {
          const result = await pool.query('SELECT name FROM users WHERE uuid = $1', [userId]);
          if (result.rows.length > 0) {
            senderName = result.rows[0].name;
          }
        } catch (dbError) {
          console.error('Failed to get sender name:', dbError);
        }
      }

      await sendNotificationToUser(targetUserId, {
        title: 'Nouvelle demande de connexion',
        message: `${senderName} souhaite se connecter avec vous`,
        type: 'connection_request',
        data: {
          fromUserId: userId,
          fromUserName: senderName,
          action: 'connection_request'
        }
      });

      socket.emit('connection_request_sent', { targetUserId });
    } catch (error) {
      console.error('Send connection request error:', error);
      socket.emit('error', { message: 'Failed to send connection request' });
    }
  });

  // Handle opportunity application notifications
  socket.on('send_opportunity_notification', async (data) => {
    try {
      const { opportunityId, targetUserId, action } = data;
      
      if (!opportunityId || !targetUserId || !action) {
        socket.emit('error', { message: 'Invalid opportunity notification data' });
        return;
      }

      // Get sender info
      let senderName = 'Utilisateur';
      if (isDatabaseConnected) {
        try {
          const result = await pool.query('SELECT name FROM users WHERE uuid = $1', [userId]);
          if (result.rows.length > 0) {
            senderName = result.rows[0].name;
          }
        } catch (dbError) {
          console.error('Failed to get sender name:', dbError);
        }
      }

      let title, message;
      switch (action) {
        case 'apply':
          title = 'Nouvelle candidature';
          message = `${senderName} a postulé à votre opportunité`;
          break;
        case 'accept':
          title = 'Candidature acceptée';
          message = `${senderName} a accepté votre candidature`;
          break;
        case 'reject':
          title = 'Candidature refusée';
          message = `${senderName} a refusé votre candidature`;
          break;
        default:
          title = 'Notification d\'opportunité';
          message = `${senderName} - Opportunité mise à jour`;
      }

      await sendNotificationToUser(targetUserId, {
        title,
        message,
        type: 'opportunity',
        data: {
          opportunityId,
          fromUserId: userId,
          fromUserName: senderName,
          action
        }
      });

      socket.emit('opportunity_notification_sent', { opportunityId, targetUserId, action });
    } catch (error) {
      console.error('Send opportunity notification error:', error);
      socket.emit('error', { message: 'Failed to send opportunity notification' });
    }
  });

  // Handle system notifications
  socket.on('send_system_notification', async (data) => {
    try {
      const { title, message, type = 'system', targets = 'all' } = data;
      
      if (!title || !message) {
        socket.emit('error', { message: 'Title and message required for system notification' });
        return;
      }

      // Admin check - only allow system notifications from admin users
      // For now, we'll allow it but in production you'd want to check user permissions

      if (targets === 'all') {
        // Send to all connected users
        const systemNotification = {
          id: uuidv4(),
          title,
          message,
          type,
          data: {},
          read: false,
          timestamp: new Date().toISOString(),
          fromUserId: null // System notification
        };

        io.emit('new_notification', systemNotification);
        console.log(`🔔 System notification sent to all users: ${title}`);
      } else if (Array.isArray(targets)) {
        // Send to specific users
        for (const targetUserId of targets) {
          await sendNotificationToUser(targetUserId, {
            title,
            message,
            type,
            data: {}
          });
        }
      }

      socket.emit('system_notification_sent', { title, targets });
    } catch (error) {
      console.error('Send system notification error:', error);
      socket.emit('error', { message: 'Failed to send system notification' });
    }
  });

  // Handle marking notifications as read
  socket.on('mark_notification_read', async (data) => {
    try {
      const { notificationId } = data;
      
      if (!notificationId) {
        socket.emit('error', { message: 'Notification ID required' });
        return;
      }

      // Update database if connected
      if (isDatabaseConnected) {
        try {
          await pool.query(`
            UPDATE notifications 
            SET read_status = true, read_at = NOW() 
            WHERE uuid = $1 AND user_id = $2
          `, [notificationId, userId]);
        } catch (dbError) {
          console.error('Failed to mark notification as read:', dbError);
        }
      }

      socket.emit('notification_read', { notificationId });
    } catch (error) {
      console.error('Mark notification read error:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });

  // Handle getting user notifications
  socket.on('get_notifications', async (data) => {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = data || {};
      
      if (!isDatabaseConnected) {
        socket.emit('notifications', { notifications: [], total: 0 });
        return;
      }

      let query = `
        SELECT n.uuid, n.title, n.message, n.type, n.data, n.read_status, n.created_at, n.from_user_id,
               u.name as from_user_name, u.avatar as from_user_avatar
        FROM notifications n
        LEFT JOIN users u ON n.from_user_id = u.uuid
        WHERE n.user_id = $1
      `;
      
      const params = [userId];
      
      if (unreadOnly) {
        query += ' AND n.read_status = false';
      }
      
      query += ' ORDER BY n.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      const notifications = result.rows.map(row => ({
        id: row.uuid,
        title: row.title,
        message: row.message,
        type: row.type,
        data: row.data,
        read: row.read_status,
        timestamp: row.created_at,
        fromUser: row.from_user_id ? {
          id: row.from_user_id,
          name: row.from_user_name,
          avatar: row.from_user_avatar
        } : null
      }));

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1${unreadOnly ? ' AND read_status = false' : ''}`,
        [userId]
      );
      
      socket.emit('notifications', {
        notifications,
        total: parseInt(countResult.rows[0].count),
        unreadCount: unreadOnly ? notifications.length : undefined
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      socket.emit('error', { message: 'Failed to get notifications' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`👤 User ${userId} disconnected from WebSocket`);
    
    // Remove from active users
    activeUsers.delete(userId);
    
    // Clean up user rooms
    userRooms.delete(userId);
    
    // Notify other users that this user went offline
    socket.broadcast.emit('user_offline', { userId });
  });
});

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
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'),
  body('type').isIn(['PME/Startup', 'Expert/Consultant', 'Mentor', 'Incubateur', 'Investisseur', 'Institution Financière', 'Organisme Public', 'Partenaire Tech']).withMessage('Type d\'utilisateur invalide'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PME2GO WebSocket API is running',
    databaseConnected: isDatabaseConnected,
    mode: isDatabaseConnected ? 'database' : 'offline',
    websocket: 'enabled',
    activeConnections: activeUsers.size,
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  });
});

// Authentication Endpoints (copied from secure-server.js)
app.post('/api/auth/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, type, industry, location, description } = req.body;
    console.log(`📝 WebSocket registration attempt for: ${email} (${name})`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Un utilisateur avec cet email existe déjà',
        code: 'EMAIL_EXISTS' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = uuidv4();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;

    const result = await pool.query(`
      INSERT INTO users (uuid, name, email, password_hash, type, industry, location, description, avatar, verified, stats, profile_data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING uuid, name, email, type, industry, location, description, avatar, verified, stats, created_at
    `, [
      userId, name, email, hashedPassword, type,
      industry || null, location || null, description || null,
      avatar, false,
      JSON.stringify({ connections: 0, projects: 0, rating: 0, reviews: 0 }),
      JSON.stringify({})
    ]);

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
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
      tokens: { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN }
    });
  } catch (error) {
    console.error('❌ WebSocket registration error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/auth/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 WebSocket login attempt for: ${email}`);

    if (!isDatabaseConnected) {
      return res.status(503).json({ error: 'Service temporairement indisponible', code: 'DATABASE_OFFLINE' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
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
      tokens: { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN }
    });
  } catch (error) {
    console.error('❌ WebSocket login error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

// Token Refresh
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Token de rafraîchissement requis', code: 'MISSING_REFRESH_TOKEN' });
    }

    const decoded = verifyToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Token de rafraîchissement invalide', code: 'INVALID_REFRESH_TOKEN' });
    }

    const result = await pool.query('SELECT * FROM users WHERE uuid = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(result.rows[0]);
    res.json({
      success: true,
      tokens: { accessToken, refreshToken: newRefreshToken, expiresIn: JWT_EXPIRES_IN }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token de rafraîchissement expiré', code: 'REFRESH_TOKEN_EXPIRED' });
    }
    res.status(403).json({ error: 'Token de rafraîchissement invalide', code: 'INVALID_REFRESH_TOKEN' });
  }
});

// Protected Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ error: 'Service temporairement indisponible', code: 'DATABASE_OFFLINE' });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT uuid as id, name, type, industry, location, description, 
             avatar, verified, stats, profile_data, created_at
      FROM users 
      WHERE uuid != $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const countQuery = 'SELECT COUNT(*) FROM users WHERE uuid != $1';
    
    const [result, countResult] = await Promise.all([
      pool.query(query, [req.user.userId, limitNum, offset]),
      pool.query(countQuery, [req.user.userId])
    ]);

    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limitNum);

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
    console.error('❌ Get users error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

// Messages endpoints
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId: contactId } = req.params;
    const currentUserId = req.user.userId;

    if (!isDatabaseConnected) {
      return res.json([]);
    }

    const query = `
      SELECT uuid as id, sender_id, receiver_id, content, message_type, created_at, read_at
      FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [currentUserId, contactId]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    if (!isDatabaseConnected) {
      return res.json([]);
    }

    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id 
          ELSE m.sender_id 
        END as contact_id,
        u.name as contact_name,
        u.avatar as contact_avatar,
        u.type as contact_type,
        (
          SELECT content 
          FROM messages m2 
          WHERE (m2.sender_id = $1 AND m2.receiver_id = contact_id) 
             OR (m2.sender_id = contact_id AND m2.receiver_id = $1)
          ORDER BY m2.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages m2 
          WHERE (m2.sender_id = $1 AND m2.receiver_id = contact_id) 
             OR (m2.sender_id = contact_id AND m2.receiver_id = $1)
          ORDER BY m2.created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m2 
          WHERE m2.sender_id = contact_id AND m2.receiver_id = $1 AND m2.read_at IS NULL
        ) as unread_count
      FROM messages m
      JOIN users u ON u.uuid = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY last_message_time DESC
    `;

    const result = await pool.query(query, [currentUserId]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Erreur serveur interne', code: 'INTERNAL_ERROR' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé', code: 'NOT_FOUND' });
});

// Graceful error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 PME2GO WebSocket API Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket enabled for real-time messaging`);
  console.log(`🔒 Security Features: JWT Auth, bcrypt passwords, rate limiting`);
  
  const connected = await testDatabaseConnection();
  
  if (connected) {
    console.log('🎯 WebSocket server ready with database connection!');
    console.log('📡 Available endpoints:');
    console.log('  GET    /api/health');
    console.log('  POST   /api/auth/register');
    console.log('  POST   /api/auth/login');
    console.log('  POST   /api/auth/refresh');
    console.log('  GET    /api/users (protected)');
    console.log('  GET    /api/messages/:userId (protected)');
    console.log('  GET    /api/conversations (protected)');
    console.log('🔌 WebSocket Events:');
    console.log('  - join_conversation');
    console.log('  - send_message');
    console.log('  - mark_messages_read');
    console.log('  - typing_start/stop');
    console.log('  - get_online_users');
  } else {
    console.log('⚠️  WebSocket server running without database connection');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  server.close(async () => {
    await pool.end();
    console.log('✅ WebSocket server shut down gracefully');
    process.exit(0);
  });
});

module.exports = { app, server, io };