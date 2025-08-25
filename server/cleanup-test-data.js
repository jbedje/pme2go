const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', 
  password: 'Postgres2024!',
  port: 5432,
});

async function cleanup() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Delete test user and related data
    const result = await pool.query(`
      DELETE FROM user_verification_tokens 
      WHERE user_id IN (
        SELECT uuid FROM users WHERE email = 'test.verification@example.com'
      );
    `);
    
    console.log(`Deleted ${result.rowCount} verification tokens`);
    
    const userResult = await pool.query(`
      DELETE FROM users WHERE email = 'test.verification@example.com';
    `);
    
    console.log(`Deleted ${userResult.rowCount} users`);
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

cleanup();