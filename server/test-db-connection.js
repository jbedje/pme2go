const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing different PostgreSQL connection configurations...');
  
  const configs = [
    // Config 1: From .env file
    {
      name: 'Environment config',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'postgres', // Try default database first
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    },
    // Config 1b: Hardcoded from .env
    {
      name: 'Hardcoded from .env',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Postgres2024!'
    },
    // Config 2: Alternative password
    {
      name: 'Alternative password',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres'
    },
    // Config 3: No password (trust auth)
    {
      name: 'No password',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres'
    },
    // Config 4: Different user
    {
      name: 'Different user',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'pme2go',
      password: 'pme2go'
    }
  ];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`\n🔧 Testing ${config.name}...`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Password: ${config.password ? '***masked***' : 'none'}`);
    
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      console.log('✅ Connection successful!');
      
      // Test basic query
      const result = await client.query('SELECT version(), current_database(), current_user');
      console.log('📊 Database info:', {
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
        database: result.rows[0].current_database,
        user: result.rows[0].current_user
      });
      
      // Test if our target database exists
      const dbCheck = await client.query("SELECT datname FROM pg_database WHERE datname = 'pme-360-db'");
      console.log(`🗃️  Target database 'pme-360-db' exists: ${dbCheck.rows.length > 0 ? 'Yes' : 'No'}`);
      
      client.release();
      await pool.end();
      
      console.log('🎯 This configuration works! Use it for the main application.');
      return config;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      await pool.end().catch(() => {}); // Ignore cleanup errors
    }
  }
  
  console.log('\n🚨 All connection attempts failed. PostgreSQL might not be running or configured incorrectly.');
  return null;
}

testConnection()
  .then(workingConfig => {
    if (workingConfig) {
      console.log('\n✨ Success! Working configuration found.');
      process.exit(0);
    } else {
      console.log('\n💥 No working configuration found.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('🚨 Unexpected error:', error);
    process.exit(1);
  });