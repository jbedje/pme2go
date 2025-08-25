const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...\n');

    // Check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found - need to create basic schema');
      await createBasicSchema();
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // Apply constraints
    await applyConstraints();

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

async function createBasicSchema() {
  try {
    console.log('\n🏗️  Creating basic database schema...');

    // Create users table
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'PME/Startup',
        industry VARCHAR(100),
        location VARCHAR(100),
        bio TEXT,
        phone VARCHAR(20),
        website VARCHAR(255),
        linkedin VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        role VARCHAR(20),
        account_status VARCHAR(20) DEFAULT 'active',
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created');

    // Create opportunities table  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        author_id UUID REFERENCES users(uuid) ON DELETE CASCADE,
        industry VARCHAR(100),
        location VARCHAR(100),
        budget DECIMAL(12,2),
        status VARCHAR(20) DEFAULT 'open',
        requirements TEXT,
        tags TEXT[],
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Opportunities table created');

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        type VARCHAR(50),
        event_date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        organizer_id UUID REFERENCES users(uuid) ON DELETE CASCADE,
        max_attendees INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Events table created');

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP NULL,
        
        CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
      );
    `);
    console.log('✅ Messages table created');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        action_url VARCHAR(500),
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NULL
      );
    `);
    console.log('✅ Notifications table created');

    // Insert demo data
    await pool.query(`
      INSERT INTO users (name, email, password_hash, type, industry, location) VALUES
      ('Admin User', 'admin@pme2go.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'Technology', 'Paris'),
      ('John Entrepreneur', 'john@startup.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'Technology', 'Lyon'),
      ('Marie Expert', 'marie@consultant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'Expert/Consultant', 'Marketing', 'Marseille')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Set admin role for first user
    await pool.query(`
      UPDATE users SET role = 'super_admin' WHERE email = 'admin@pme2go.com';
    `);

    console.log('✅ Demo data inserted');
    console.log('✅ Basic schema created successfully');

  } catch (error) {
    console.error('❌ Failed to create basic schema:', error.message);
    throw error;
  }
}

async function applyConstraints() {
  try {
    console.log('\n🔐 Applying database constraints...');

    // Add check constraints for users table
    const constraints = [
      {
        name: 'chk_users_email_format',
        sql: `ALTER TABLE users ADD CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');`,
        description: 'Email format validation'
      },
      {
        name: 'chk_users_type_valid',
        sql: `ALTER TABLE users ADD CONSTRAINT chk_users_type_valid CHECK (type IN ('PME/Startup', 'Expert/Consultant', 'Mentor', 'Investisseur', 'Incubateur'));`,
        description: 'User type validation'
      },
      {
        name: 'chk_users_name_length',
        sql: `ALTER TABLE users ADD CONSTRAINT chk_users_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);`,
        description: 'Name length validation'
      },
      {
        name: 'chk_users_account_status_valid',
        sql: `ALTER TABLE users ADD CONSTRAINT chk_users_account_status_valid CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification', 'deleted'));`,
        description: 'Account status validation'
      }
    ];

    for (const constraint of constraints) {
      try {
        // Check if constraint already exists
        const existsResult = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.table_constraints 
          WHERE constraint_name = $1 AND table_name = 'users';
        `, [constraint.name]);

        if (existsResult.rows[0].count === '0') {
          await pool.query(constraint.sql);
          console.log(`✅ ${constraint.description} applied`);
        } else {
          console.log(`⏭️  ${constraint.description} already exists`);
        }
      } catch (error) {
        console.log(`⚠️  ${constraint.description} failed: ${error.message}`);
      }
    }

    // Create system settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL DEFAULT '{}',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default system settings
    await pool.query(`
      INSERT INTO system_settings (key, value, description) VALUES
      ('maintenance_mode', '{"enabled": false, "message": "System under maintenance"}', 'Maintenance mode configuration'),
      ('user_registration', '{"enabled": true, "require_verification": true}', 'User registration settings'),
      ('rate_limits', '{"auth_attempts": 5, "general_requests": 100, "window_minutes": 15}', 'Rate limiting configuration'),
      ('notifications', '{"email_enabled": true, "push_enabled": false}', 'Notification preferences')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('✅ System settings configured');

    // Create audit log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        table_name VARCHAR(50) NOT NULL,
        record_id UUID NOT NULL,
        operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
        old_values JSONB,
        new_values JSONB,
        changed_by UUID,
        changed_at TIMESTAMP DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      );
    `);

    console.log('✅ Audit log table created');

    // Create performance indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);',
      'CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_author_id ON opportunities(author_id);',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);'
    ];

    for (const index of indexes) {
      try {
        await pool.query(index);
      } catch (error) {
        console.log(`⚠️  Index creation warning: ${error.message}`);
      }
    }

    console.log('✅ Performance indexes created');

  } catch (error) {
    console.error('❌ Failed to apply constraints:', error.message);
    throw error;
  }
}

async function validateDatabase() {
  try {
    console.log('\n🧪 Validating database integrity...');

    // Check user data
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE account_status = 'active') as active_users,
        COUNT(*) FILTER (WHERE role IS NOT NULL) as admin_users
      FROM users;
    `);

    console.log('📊 Database Statistics:');
    console.log(`   👥 Total users: ${userStats.rows[0].total_users}`);
    console.log(`   ✅ Active users: ${userStats.rows[0].active_users}`);
    console.log(`   👑 Admin users: ${userStats.rows[0].admin_users}`);

    // Check constraints
    const constraintsResult = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND constraint_type = 'CHECK'
      ORDER BY constraint_name;
    `);

    console.log(`\n🔐 Applied constraints: ${constraintsResult.rows.length}`);
    constraintsResult.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}`);
    });

    console.log('\n✅ Database validation completed successfully!');

  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
  }
}

// Run the script
if (require.main === module) {
  checkDatabase().then(() => validateDatabase());
}

module.exports = { checkDatabase, createBasicSchema, applyConstraints, validateDatabase };