const pool = require('./db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Connection params:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: '***hidden***'
    });
    
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test if database exists
    const dbTest = await client.query('SELECT current_database()');
    console.log('Current database:', dbTest.rows[0].current_database);
    
    client.release();
    console.log('✓ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === '28P01') {
      console.error('\n🔑 Authentication failed. Please check:');
      console.error('1. Username and password are correct');
      console.error('2. PostgreSQL is running');
      console.error('3. Database "pme-360-db" exists');
      console.error('4. User "postgres" has access to the database');
    }
    
    if (error.code === '3D000') {
      console.error('\n📁 Database does not exist. Please create it first:');
      console.error('CREATE DATABASE "pme-360-db";');
    }
  } finally {
    await pool.end();
  }
}

testConnection();