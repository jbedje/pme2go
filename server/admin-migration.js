const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

async function migrateAdminFeatures() {
  try {
    console.log('👨‍💼 Starting Admin Features Migration...\n');
    
    // Step 1: Add admin role column to users table
    console.log('📋 Step 1: Adding admin role column to users table');
    console.log('─'.repeat(60));
    
    // Check if role column already exists
    const roleColumnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (roleColumnCheck.rows.length === 0) {
      // Add role column with default 'user' value
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin', 'super_admin'))
      `);
      console.log('✅ Added role column to users table');
    } else {
      console.log('⚠️ Role column already exists');
    }
    
    // Step 2: Add admin-specific columns
    console.log('\n📋 Step 2: Adding admin-specific tracking columns');
    console.log('─'.repeat(60));
    
    const adminColumns = [
      { name: 'is_banned', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'ban_reason', type: 'TEXT' },
      { name: 'banned_at', type: 'TIMESTAMP' },
      { name: 'banned_by', type: 'INTEGER REFERENCES users(id) ON DELETE SET NULL' },
      { name: 'login_attempts', type: 'INTEGER DEFAULT 0' },
      { name: 'last_failed_login', type: 'TIMESTAMP' },
      { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'email_verification_token', type: 'VARCHAR(255)' },
      { name: 'password_reset_token', type: 'VARCHAR(255)' },
      { name: 'password_reset_expires', type: 'TIMESTAMP' }
    ];
    
    for (const column of adminColumns) {
      try {
        // Check if column exists
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = $1
        `, [column.name]);
        
        if (columnCheck.rows.length === 0) {
          await pool.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added column: ${column.name}`);
        } else {
          console.log(`⚠️ Column ${column.name} already exists`);
        }
      } catch (error) {
        console.error(`❌ Error adding column ${column.name}:`, error.message);
      }
    }
    
    // Step 3: Create admin activity log table
    console.log('\n📋 Step 3: Creating admin activity log table');
    console.log('─'.repeat(60));
    
    const adminLogTableSQL = `
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(50) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
        admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(50),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await pool.query(adminLogTableSQL);
      console.log('✅ Created admin_activity_logs table');
      
      // Create indexes for admin logs
      await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_activity_logs(admin_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_activity_logs(created_at)');
      console.log('✅ Created indexes for admin_activity_logs table');
      
    } catch (error) {
      console.log('⚠️ admin_activity_logs table already exists or error:', error.message);
    }
    
    // Step 4: Create system settings table
    console.log('\n📋 Step 4: Creating system settings table');
    console.log('─'.repeat(60));
    
    const settingsTableSQL = `
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await pool.query(settingsTableSQL);
      console.log('✅ Created system_settings table');
      
      // Insert default system settings
      const defaultSettings = [
        {
          key: 'maintenance_mode',
          value: { enabled: false, message: 'System maintenance in progress' },
          description: 'Controls system-wide maintenance mode'
        },
        {
          key: 'user_registration',
          value: { enabled: true, require_verification: false },
          description: 'Controls user registration settings'
        },
        {
          key: 'rate_limits',
          value: { auth_attempts: 5, general_requests: 100, window_minutes: 15 },
          description: 'Rate limiting configuration'
        },
        {
          key: 'notifications',
          value: { email_enabled: true, push_enabled: true },
          description: 'System notification settings'
        }
      ];
      
      for (const setting of defaultSettings) {
        await pool.query(`
          INSERT INTO system_settings (key, value, description) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (key) DO NOTHING
        `, [setting.key, JSON.stringify(setting.value), setting.description]);
      }
      
      console.log('✅ Inserted default system settings');
      
    } catch (error) {
      console.log('⚠️ system_settings table already exists or error:', error.message);
    }
    
    // Step 5: Create the first admin user
    console.log('\n📋 Step 5: Creating admin user if none exists');
    console.log('─'.repeat(60));
    
    const adminCheck = await pool.query(`
      SELECT COUNT(*) as admin_count 
      FROM users 
      WHERE role IN ('admin', 'super_admin')
    `);
    
    if (parseInt(adminCheck.rows[0].admin_count) === 0) {
      // Create first admin user
      const bcrypt = require('bcrypt');
      const { v4: uuidv4 } = require('uuid');
      
      const adminPassword = 'Admin@2024!';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await pool.query(`
        INSERT INTO users (
          uuid, name, email, password_hash, type, role, verified, 
          email_verified, account_status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP
        )
      `, [
        uuidv4(),
        'System Admin',
        'admin@pme2go.com',
        hashedPassword,
        'Administrator',
        'super_admin',
        true,
        true,
        'active'
      ]);
      
      console.log('✅ Created first admin user');
      console.log('📧 Email: admin@pme2go.com');
      console.log('🔑 Password: Admin@2024!');
      console.log('⚠️  Please change the default password after first login!');
      
    } else {
      console.log(`⚠️ Found ${adminCheck.rows[0].admin_count} existing admin(s)`);
    }
    
    // Step 6: Display final summary
    console.log('\n📋 Step 6: Migration Summary');
    console.log('─'.repeat(60));
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name IN ('users', 'admin_activity_logs', 'system_settings')
      ORDER BY table_name
    `);
    
    console.log('Admin-related tables:');
    tablesResult.rows.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    const userStats = await pool.query(`
      SELECT 
        role, 
        COUNT(*) as count 
      FROM users 
      WHERE role IS NOT NULL 
      GROUP BY role 
      ORDER BY role
    `);
    
    console.log('\nUser roles distribution:');
    userStats.rows.forEach(stat => {
      console.log(`  ${stat.role}: ${stat.count} user(s)`);
    });
    
    console.log('\n🎉 Admin Features Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Admin migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateAdminFeatures()
  .then(() => {
    console.log('\n✅ Admin migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Admin migration failed:', error);
    process.exit(1);
  });