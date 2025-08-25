const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pme-360-db',
  user: 'postgres',
  password: 'Postgres2024!'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting database migration...');
    
    // Add new columns to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
    `);
    console.log('✅ Added new columns to users table');

    // Update password_hash column size
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN password_hash TYPE VARCHAR(255)
    `);
    console.log('✅ Updated password_hash column size');

    // Add indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_type ON users(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_industry ON users(industry)`);
    console.log('✅ Added database indexes');

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL,
        receiver_id UUID NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP NULL
      )
    `);
    console.log('✅ Created messages table');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        action_url VARCHAR(500),
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NULL
      )
    `);
    console.log('✅ Created notifications table');

    // Add indexes for new tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    console.log('✅ Added indexes for new tables');

    // Update existing password hashes for demo
    await client.query(`
      UPDATE users 
      SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu' 
      WHERE password_hash = 'demo_password_hash' OR password_hash IS NULL OR LENGTH(password_hash) < 20
    `);
    console.log('✅ Updated demo password hashes');

    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);