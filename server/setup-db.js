const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔍 PostgreSQL Database Setup Wizard');
  console.log('=====================================\n');

  // Test different connection methods
  const configs = [
    {
      name: 'Standard connection with password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'pme-360-db',
        user: 'postgres',
        password: 'Postgres'
      }
    },
    {
      name: 'Connection without password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'pme-360-db',
        user: 'postgres'
      }
    },
    {
      name: 'Connection to default postgres database',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Postgres'
      }
    },
    {
      name: 'Connection to default postgres database (no password)',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres'
      }
    }
  ];

  let workingConfig = null;

  for (const { name, config } of configs) {
    console.log(`🔄 Testing: ${name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? '***' : 'none'}`);

    try {
      const pool = new Pool(config);
      const client = await pool.connect();
      
      // Test query
      const result = await client.query('SELECT version()');
      console.log(`   ✅ SUCCESS! PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      
      client.release();
      await pool.end();
      
      workingConfig = { name, config };
      break;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      if (error.code === '28P01') {
        console.log('      → Authentication failed - check username/password');
      } else if (error.code === '3D000') {
        console.log('      → Database does not exist');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('      → PostgreSQL server is not running');
      }
    }
    console.log('');
  }

  if (!workingConfig) {
    console.log('❌ No working configuration found!');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if you can connect manually:');
    console.log('   psql -U postgres -h localhost');
    console.log('3. Try creating the database:');
    console.log('   CREATE DATABASE "pme-360-db";');
    console.log('4. Check pg_hba.conf for authentication settings');
    return;
  }

  console.log(`🎉 Found working configuration: ${workingConfig.name}`);
  
  // Now try to create the target database if we're connected to postgres
  if (workingConfig.config.database === 'postgres') {
    console.log('\n🔄 Creating target database...');
    try {
      const pool = new Pool(workingConfig.config);
      await pool.query('CREATE DATABASE "pme-360-db"');
      console.log('✅ Database "pme-360-db" created successfully');
      await pool.end();
      
      // Update config to target database
      workingConfig.config.database = 'pme-360-db';
      
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Database "pme-360-db" already exists');
        workingConfig.config.database = 'pme-360-db';
      } else {
        console.log(`❌ Failed to create database: ${error.message}`);
        return;
      }
    }
  }

  // Update .env file with working configuration
  console.log('\n🔄 Updating .env file...');
  const envContent = `DB_HOST=${workingConfig.config.host}
DB_PORT=${workingConfig.config.port}
DB_NAME=${workingConfig.config.database}
DB_USER=${workingConfig.config.user}
DB_PASSWORD=${workingConfig.config.password || ''}
PORT=3001
SERVER_PORT=3002
`;

  const fs = require('fs');
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file updated');

  console.log('\n✨ Database setup complete!');
  console.log('📋 Working configuration:');
  console.log(`   Database: ${workingConfig.config.database}`);
  console.log(`   User: ${workingConfig.config.user}`);
  console.log(`   Password: ${workingConfig.config.password ? 'Yes' : 'No'}`);
  console.log('\n🚀 Now you can run: npm run migrate');
}

setupDatabase().catch(console.error);