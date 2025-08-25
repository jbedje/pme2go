const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',  
  database: 'pme-360-db',
  password: 'Postgres2024!',
  port: 5432,
});

async function checkUsers() {
  try {
    // First check the table structure
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Users table structure:');
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Then get some users
    const result = await pool.query('SELECT * FROM users LIMIT 3');
    console.log('\n👥 Sample users:');
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name || 'N/A'}`);
      if (user.company) console.log(`  Company: ${user.company}`);
      if (user.position) console.log(`  Position: ${user.position}`);
      if (user.skills) console.log(`  Skills: ${JSON.stringify(user.skills)}`);
      console.log('');
    });
    
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Total users in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();