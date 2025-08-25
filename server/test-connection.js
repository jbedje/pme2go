const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection with current .env settings...');
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`Password: ${process.env.DB_PASSWORD ? 'Set' : 'Not set'}`);
  
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
    query_timeout: 5000
  };
  
  try {
    console.log('\n🔄 Creating connection pool...');
    const pool = new Pool(config);
    
    console.log('🔄 Attempting to connect...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    const versionResult = await client.query('SELECT version()');
    console.log(`📋 PostgreSQL Version: ${versionResult.rows[0].version}`);
    
    const dbResult = await client.query('SELECT current_database()');
    console.log(`📋 Current Database: ${dbResult.rows[0].current_database}`);
    
    client.release();
    await pool.end();
    
    console.log('🎉 All tests passed! Database is ready.');
    
  } catch (error) {
    console.log('\n❌ Connection failed:');
    console.log(`Error Code: ${error.code}`);
    console.log(`Error Message: ${error.message}`);
    
    if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Possible solutions:');
      console.log('1. Double-check the password');
      console.log('2. Reset postgres user password');
      console.log('3. Check pg_hba.conf authentication method');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Will create it during migration.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL server not running or not accepting connections.');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Host not found. Check DB_HOST setting.');
    } else {
      console.log('\n💡 Unexpected error. Check PostgreSQL logs.');
    }
  }
}

testConnection();