const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

require('dotenv').config({ path: '.env.production' });

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('🔄 Starting database migration...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found: ' + schemaPath);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    logger.info('✅ Schema created successfully');
    
    // Check if we need to populate with sample data
    const userCountResult = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    
    if (userCount === 0) {
      logger.info('📝 Populating with sample data...');
      
      // Insert sample admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await client.query(`
        INSERT INTO users (uuid, name, email, password_hash, type, verified, role) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'admin-001',
        'Administrator',
        'admin@pme2go.com',
        hashedPassword,
        'Admin',
        true,
        'super_admin'
      ]);
      
      // Insert demo users
      const demoUsers = [
        {
          uuid: 'demo-001',
          name: 'TechStart Solutions',
          email: 'contact@techstart.fr',
          type: 'PME/Startup',
          industry: 'Technologie',
          location: 'Paris, France',
          description: 'Startup innovante dans le développement d\'applications mobiles',
          verified: true
        },
        {
          uuid: 'demo-002',
          name: 'Marie Dubois',
          email: 'marie.dubois@consulting.fr',
          type: 'Expert/Consultant',
          industry: 'Marketing Digital',
          location: 'Lyon, France',
          description: 'Consultante senior en transformation digitale',
          verified: true
        }
      ];
      
      const demoPassword = await bcrypt.hash('demo123', 12);
      
      for (const user of demoUsers) {
        await client.query(`
          INSERT INTO users (uuid, name, email, password_hash, type, industry, location, description, verified, avatar) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          user.uuid,
          user.name,
          user.email,
          demoPassword,
          user.type,
          user.industry,
          user.location,
          user.description,
          user.verified,
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`
        ]);
      }
      
      logger.info('✅ Sample data inserted successfully');
    } else {
      logger.info(`📊 Database already contains ${userCount} users, skipping sample data insertion`);
    }
    
    logger.info('🎉 Migration completed successfully!');
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };