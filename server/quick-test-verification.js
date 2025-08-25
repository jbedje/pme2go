const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function quickTest() {
  try {
    console.log('🔍 Getting verification token...');
    
    const result = await pool.query(`
      SELECT token, user_id, expires_at 
      FROM user_verification_tokens 
      WHERE token_type = 'email_verification' 
      AND used_at IS NULL
      ORDER BY created_at DESC LIMIT 1;
    `);
    
    if (result.rows.length > 0) {
      const token = result.rows[0].token;
      console.log(`Token: ${token.substring(0, 16)}...`);
      
      // Test the verification endpoint
      console.log('🧪 Testing verification endpoint...');
      
      const response = await fetch(`http://localhost:3004/api/auth/verify-email?token=${token}`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.text();
      console.log('Response body:', data);
      
    } else {
      console.log('❌ No verification tokens found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickTest();