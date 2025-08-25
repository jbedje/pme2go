const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function createVerificationTable() {
  const client = await pool.connect();
  
  try {
    console.log('🗃️  Creating user verification tokens table...');

    // Create user_verification_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_verification_tokens (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL DEFAULT 'email_verification',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        used_at TIMESTAMP NULL,
        
        CONSTRAINT chk_token_type_valid CHECK (token_type IN ('email_verification', 'password_reset')),
        CONSTRAINT chk_token_length CHECK (LENGTH(token) >= 32)
      );
    `);
    
    console.log('✅ User verification tokens table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON user_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON user_verification_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON user_verification_tokens(token_type);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON user_verification_tokens(expires_at);
    `);
    
    console.log('✅ Verification tokens indexes created');

    // Add email_verified column to users table if not exists
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;
    `);
    
    console.log('✅ Email verification columns added to users table');

    // Update existing users to be verified (for demo purposes)
    await client.query(`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW() 
      WHERE email_verified IS NULL OR email_verified = false;
    `);
    
    console.log('✅ Existing users marked as email verified');

    // Test the table
    const result = await client.query(`
      SELECT COUNT(*) as count FROM user_verification_tokens;
    `);
    
    console.log(`📊 Verification tokens table ready (${result.rows[0].count} tokens)`);

    console.log('\n🎉 Email verification system database setup completed!');

  } catch (error) {
    console.error('❌ Failed to create verification table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createVerificationTable();
}

module.exports = { createVerificationTable };