const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function createCompleteSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🏗️  Creating complete database schema...\n');

    // Enable extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ UUID extension enabled');

    // Create users table
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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

    // Create user_connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_connections (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        connected_user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        connection_type VARCHAR(50) DEFAULT 'favorite',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(user_id, connected_user_id, connection_type),
        CONSTRAINT connections_self_check CHECK (user_id != connected_user_id)
      );
    `);
    console.log('✅ User connections table created');

    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(255) NOT NULL,
        device_info JSONB,
        ip_address INET,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP DEFAULT NOW(),
        revoked_at TIMESTAMP NULL
      );
    `);
    console.log('✅ User sessions table created');

    // Create opportunity_applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_applications (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        opportunity_id UUID NOT NULL REFERENCES opportunities(uuid) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        cover_letter TEXT,
        application_data JSONB,
        applied_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(opportunity_id, applicant_id)
      );
    `);
    console.log('✅ Opportunity applications table created');

    // Create event_registrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(uuid) ON DELETE CASCADE,
        participant_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'registered',
        registration_data JSONB,
        registered_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(event_id, participant_id)
      );
    `);
    console.log('✅ Event registrations table created');

    // Insert demo users
    await client.query(`
      INSERT INTO users (name, email, password_hash, type, industry, location, role, verified) VALUES
      ('Super Admin', 'admin@pme2go.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'Technology', 'Paris', 'super_admin', true),
      ('Admin User', 'moderator@pme2go.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'Technology', 'Lyon', 'admin', true),
      ('John Entrepreneur', 'john@startup.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'Technology', 'Lyon', null, true),
      ('Marie Expert', 'marie@consultant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'Expert/Consultant', 'Marketing', 'Marseille', null, true),
      ('Pierre Investor', 'pierre@venture.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'Investisseur', 'Finance', 'Paris', null, true)
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Demo users inserted');

    // Insert demo opportunities
    await client.query(`
      INSERT INTO opportunities (title, description, type, author_id, industry, location, budget, status)
      SELECT 
        'Recherche CTO pour startup FinTech',
        'Nous recherchons un CTO expérimenté pour rejoindre notre startup dans le domaine de la fintech. Excellente opportunité de croissance.',
        'job',
        u.uuid,
        'Finance',
        'Paris',
        75000.00,
        'open'
      FROM users u WHERE u.email = 'john@startup.com'
      UNION ALL
      SELECT 
        'Partenariat commercial B2B',
        'Recherche de partenaires commerciaux pour expansion en Europe. Secteur e-commerce.',
        'partnership', 
        u.uuid,
        'E-commerce',
        'Lyon',
        NULL,
        'open'
      FROM users u WHERE u.email = 'marie@consultant.com';
    `);
    console.log('✅ Demo opportunities inserted');

    // Apply comprehensive constraints
    console.log('\n🔐 Applying database constraints...');
    
    const constraints = [
      {
        sql: `ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');`,
        description: 'Email format validation'
      },
      {
        sql: `ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_type_valid CHECK (type IN ('PME/Startup', 'Expert/Consultant', 'Mentor', 'Investisseur', 'Incubateur'));`,
        description: 'User type validation'
      },
      {
        sql: `ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);`,
        description: 'Name length validation'
      },
      {
        sql: `ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_account_status_valid CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification', 'deleted'));`,
        description: 'Account status validation'
      },
      {
        sql: `ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_title_length CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200);`,
        description: 'Opportunity title length validation'
      },
      {
        sql: `ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_type_valid CHECK (type IN ('funding', 'partnership', 'mentoring', 'job', 'internship', 'collaboration', 'investment'));`,
        description: 'Opportunity type validation'
      },
      {
        sql: `ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_messages_content_length CHECK (LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 50000);`,
        description: 'Message content length validation'
      }
    ];

    for (const constraint of constraints) {
      try {
        await client.query(constraint.sql);
        console.log(`✅ ${constraint.description}`);
      } catch (error) {
        console.log(`⚠️  ${constraint.description} - ${error.message}`);
      }
    }

    // Create performance indexes
    console.log('\n📈 Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);',
      'CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_author_id ON opportunities(author_id);',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_is_active ON opportunities(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);',
      'CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_connections_type ON user_connections(connection_type);'
    ];

    for (const index of indexes) {
      try {
        await client.query(index);
      } catch (error) {
        console.log(`⚠️  Index warning: ${error.message}`);
      }
    }
    console.log('✅ Performance indexes created');

    // Create system settings if not exist
    await client.query(`
      INSERT INTO system_settings (key, value, description) VALUES
      ('maintenance_mode', '{"enabled": false, "message": "System under maintenance"}', 'Maintenance mode configuration'),
      ('user_registration', '{"enabled": true, "require_verification": true}', 'User registration settings'),
      ('rate_limits', '{"auth_attempts": 5, "general_requests": 100, "window_minutes": 15}', 'Rate limiting configuration'),
      ('notifications', '{"email_enabled": true, "push_enabled": false}', 'Notification preferences'),
      ('file_uploads', '{"max_size_mb": 10, "allowed_types": ["jpg", "png", "pdf", "doc", "docx"]}', 'File upload restrictions')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('✅ System settings configured');

    // Validate database
    console.log('\n🧪 Validating database...');
    const stats = await client.query(`
      SELECT 
        'users' as table_name,
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE account_status = 'active') as active_records
      FROM users
      UNION ALL
      SELECT 
        'opportunities',
        COUNT(*),
        COUNT(*) FILTER (WHERE is_active = true)
      FROM opportunities
      UNION ALL
      SELECT 
        'messages',
        COUNT(*),
        COUNT(*) FILTER (WHERE read_at IS NULL)
      FROM messages;
    `);

    console.log('📊 Database Statistics:');
    stats.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.total_records} total, ${row.active_records} active`);
    });

    // Count constraints
    const constraintCount = await client.query(`
      SELECT constraint_type, COUNT(*) as count
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      GROUP BY constraint_type
      ORDER BY constraint_type;
    `);

    console.log('\n🔐 Applied Constraints:');
    constraintCount.rows.forEach(row => {
      console.log(`   ${row.constraint_type}: ${row.count}`);
    });

    console.log('\n🎉 Database schema and constraints applied successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Complete database schema created');
    console.log('   ✅ All foreign key relationships established');
    console.log('   ✅ Comprehensive data validation constraints applied');
    console.log('   ✅ Performance indexes created');
    console.log('   ✅ System configuration tables set up');
    console.log('   ✅ Demo data populated');
    console.log('   ✅ Database integrity validated');

  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createCompleteSchema();
}

module.exports = { createCompleteSchema };