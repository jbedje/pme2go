const pool = require('./db');

async function testServerDatabase() {
  console.log('🔍 Testing database connection through server db.js module...');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`✅ Found ${result.rows[0].user_count} users in database`);
    
    // Test users query (same as API)
    const usersQuery = 'SELECT uuid as id, name, type, industry, location, description, avatar, verified, stats, profile_data FROM users WHERE 1=1 ORDER BY created_at DESC';
    const users = await pool.query(usersQuery);
    console.log(`📊 Users API query returned ${users.rows.length} users:`);
    users.rows.forEach(user => console.log(`  - ${user.name} (${user.type})`));
    
    // Test login query
    const loginQuery = 'SELECT * FROM users WHERE email = $1';
    const loginTest = await pool.query(loginQuery, ['contact@techstart.fr']);
    console.log(`🔐 Login test for contact@techstart.fr: ${loginTest.rows.length > 0 ? 'User found' : 'User not found'}`);
    if (loginTest.rows.length > 0) {
      console.log(`   Name: ${loginTest.rows[0].name}, UUID: ${loginTest.rows[0].uuid}`);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testServerDatabase();