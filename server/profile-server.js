const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3006; // Profile management server port

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
      imgSrc: ["'self'", "data:", "https:", "http://localhost:*"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// File upload rate limiting (more restrictive)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 10, // limit each IP to 10 file uploads per windowMs
  message: { error: 'Trop d\'uploads, veuillez réessayer plus tard.' },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const createUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
};
createUploadsDir();

// Database configuration
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database connection check
let isDatabaseConnected = false;
const checkDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    isDatabaseConnected = true;
    console.log('✅ Profile server connected to database');
  } catch (error) {
    console.error('❌ Profile server database connection failed:', error.message);
    isDatabaseConnected = false;
  }
};

// Initialize database connection
checkDatabaseConnection();

// JWT token generation
const generateTokens = (user) => {
  const payload = {
    userId: user.uuid || user.id,
    email: user.email,
    name: user.name
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: '30d' });
  
  return { accessToken, refreshToken };
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    req.user = decoded;
    next();
  });
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for uploads
const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les images (JPG, PNG, GIF, WebP) et documents (PDF, DOC, DOCX, TXT) sont acceptés.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: fileFilter
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

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

// Profile validation rules
const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').optional().trim().matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/).withMessage('Numéro de téléphone invalide'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Localisation trop longue'),
  body('industry').optional().trim().isLength({ max: 50 }).withMessage('Secteur trop long'),
  body('company').optional().trim().isLength({ max: 100 }).withMessage('Nom d\'entreprise trop long'),
  body('position').optional().trim().isLength({ max: 100 }).withMessage('Poste trop long'),
  body('bio').optional().trim().isLength({ max: 1000 }).withMessage('Bio trop longue (max 1000 caractères)'),
  body('website').optional().isURL().withMessage('URL de site web invalide'),
  body('linkedin').optional().isURL().withMessage('URL LinkedIn invalide'),
  body('twitter').optional().trim().matches(/^@?[A-Za-z0-9_]{1,15}$/).withMessage('Nom d\'utilisateur Twitter invalide'),
  body('skills').optional().isArray().withMessage('Les compétences doivent être un tableau'),
  body('languages').optional().isArray().withMessage('Les langues doivent être un tableau'),
  body('availability').optional().isIn(['available', 'busy', 'unavailable']).withMessage('Statut de disponibilité invalide')
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PME2GO Profile Server is running',
    databaseConnected: isDatabaseConnected,
    mode: isDatabaseConnected ? 'database' : 'offline',
    features: ['profile_management', 'file_uploads', 'avatar_management'],
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const result = await pool.query(`
      SELECT uuid, name, email, type, industry, location, description, avatar, verified, 
             phone, company, position, bio, website, linkedin, twitter, skills, languages, 
             availability, profile_data, stats, created_at, updated_at
      FROM users 
      WHERE uuid = $1
    `, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    
    res.json({
      success: true,
      profile: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        type: user.type,
        industry: user.industry,
        location: user.location,
        description: user.description,
        avatar: user.avatar,
        verified: user.verified,
        phone: user.phone,
        company: user.company,
        position: user.position,
        bio: user.bio,
        website: user.website,
        linkedin: user.linkedin,
        twitter: user.twitter,
        skills: user.skills || [],
        languages: user.languages || [],
        availability: user.availability || 'available',
        profileData: user.profile_data || {},
        stats: user.stats || { connections: 0, projects: 0, rating: 0, reviews: 0 },
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, updateProfileValidation, handleValidationErrors, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const {
      name, email, phone, location, industry, company, position, bio,
      website, linkedin, twitter, skills, languages, availability, profileData
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND uuid != $2',
        [email, req.user.userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Cet email est déjà utilisé par un autre compte',
          code: 'EMAIL_EXISTS' 
        });
      }
    }

    // Update profile
    const result = await pool.query(`
      UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = $3,
        location = $4,
        industry = $5,
        company = $6,
        position = $7,
        bio = $8,
        website = $9,
        linkedin = $10,
        twitter = $11,
        skills = COALESCE($12, skills),
        languages = COALESCE($13, languages),
        availability = COALESCE($14, availability),
        profile_data = COALESCE($15, profile_data),
        updated_at = NOW()
      WHERE uuid = $16
      RETURNING uuid, name, email, type, industry, location, description, avatar, verified,
                phone, company, position, bio, website, linkedin, twitter, skills, languages,
                availability, profile_data, stats, created_at, updated_at
    `, [
      name, email, phone, location, industry, company, position, bio,
      website, linkedin, twitter, 
      skills ? JSON.stringify(skills) : null,
      languages ? JSON.stringify(languages) : null,
      availability,
      profileData ? JSON.stringify(profileData) : null,
      req.user.userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    
    console.log(`✅ Profile updated for user: ${user.name} (${user.uuid})`);
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        type: user.type,
        industry: user.industry,
        location: user.location,
        description: user.description,
        avatar: user.avatar,
        verified: user.verified,
        phone: user.phone,
        company: user.company,
        position: user.position,
        bio: user.bio,
        website: user.website,
        linkedin: user.linkedin,
        twitter: user.twitter,
        skills: user.skills || [],
        languages: user.languages || [],
        availability: user.availability || 'available',
        profileData: user.profile_data || {},
        stats: user.stats || { connections: 0, projects: 0, rating: 0, reviews: 0 },
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

// Upload avatar
app.post('/api/profile/avatar', authenticateToken, uploadLimiter, upload.single('avatar'), async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Generate avatar URL
    const avatarUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    // Update user avatar in database
    const result = await pool.query(`
      UPDATE users SET avatar = $1, updated_at = NOW()
      WHERE uuid = $2
      RETURNING uuid, name, avatar
    `, [avatarUrl, req.user.userId]);

    if (result.rows.length === 0) {
      // Clean up uploaded file if user not found
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    console.log(`📸 Avatar updated for user: ${user.name} (${user.uuid})`);

    res.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      avatar: user.avatar,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    console.error('❌ Avatar upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'avatar', code: 'UPLOAD_ERROR' });
  }
});

// Upload profile documents
app.post('/api/profile/documents', authenticateToken, uploadLimiter, upload.array('documents', 5), async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Process uploaded documents
    const documents = req.files.map(file => ({
      id: uuidv4(),
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `http://localhost:${PORT}/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    // Get current profile data
    const userResult = await pool.query('SELECT profile_data FROM users WHERE uuid = $1', [req.user.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const currentProfileData = userResult.rows[0].profile_data || {};
    const existingDocuments = currentProfileData.documents || [];

    // Add new documents to existing ones
    const updatedDocuments = [...existingDocuments, ...documents];
    const updatedProfileData = {
      ...currentProfileData,
      documents: updatedDocuments
    };

    // Update profile data in database
    await pool.query(`
      UPDATE users SET profile_data = $1, updated_at = NOW()
      WHERE uuid = $2
    `, [JSON.stringify(updatedProfileData), req.user.userId]);

    console.log(`📄 ${documents.length} document(s) uploaded for user: ${req.user.userId}`);

    res.json({
      success: true,
      message: `${documents.length} document(s) téléchargé(s) avec succès`,
      documents: documents,
      totalDocuments: updatedDocuments.length
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(async (file) => {
        await fs.unlink(file.path).catch(() => {});
      });
    }
    
    console.error('❌ Documents upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des documents', code: 'UPLOAD_ERROR' });
  }
});

// Delete profile document
app.delete('/api/profile/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const { documentId } = req.params;

    // Get current profile data
    const userResult = await pool.query('SELECT profile_data FROM users WHERE uuid = $1', [req.user.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const currentProfileData = userResult.rows[0].profile_data || {};
    const documents = currentProfileData.documents || [];

    // Find document to delete
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    const documentToDelete = documents[documentIndex];

    // Remove document from array
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    const updatedProfileData = {
      ...currentProfileData,
      documents: updatedDocuments
    };

    // Update database
    await pool.query(`
      UPDATE users SET profile_data = $1, updated_at = NOW()
      WHERE uuid = $2
    `, [JSON.stringify(updatedProfileData), req.user.userId]);

    // Delete physical file
    const filePath = path.join(uploadsDir, documentToDelete.filename);
    await fs.unlink(filePath).catch(() => {});

    console.log(`🗑️ Document deleted for user: ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Document supprimé avec succès',
      documentId: documentId,
      remainingDocuments: updatedDocuments.length
    });
  } catch (error) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du document', code: 'DELETE_ERROR' });
  }
});

// Get profile documents
app.get('/api/profile/documents', authenticateToken, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: 'DATABASE_OFFLINE' 
      });
    }

    const result = await pool.query('SELECT profile_data FROM users WHERE uuid = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const profileData = result.rows[0].profile_data || {};
    const documents = profileData.documents || [];

    res.json({
      success: true,
      documents: documents,
      totalDocuments: documents.length
    });
  } catch (error) {
    console.error('❌ Get documents error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Fichier trop volumineux. Taille maximale: 5MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Trop de fichiers. Maximum: 5 fichiers',
        code: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({ 
      error: 'Erreur d\'upload: ' + err.message,
      code: 'UPLOAD_ERROR'
    });
  }
  
  if (err.message && err.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({ 
      error: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  res.status(500).json({ 
    error: 'Erreur serveur interne',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PME2GO Profile Server running on http://localhost:${PORT}`);
  console.log(`📁 File uploads enabled with directory: ${uploadsDir}`);
  console.log(`🔒 Security Features: JWT Auth, rate limiting, file validation`);
  console.log(`📡 Available endpoints:`);
  console.log(`  GET    /api/health`);
  console.log(`  GET    /api/profile (protected)`);
  console.log(`  PUT    /api/profile (protected)`);
  console.log(`  POST   /api/profile/avatar (protected)`);
  console.log(`  POST   /api/profile/documents (protected)`);
  console.log(`  GET    /api/profile/documents (protected)`);
  console.log(`  DELETE /api/profile/documents/:id (protected)`);
});

module.exports = app;