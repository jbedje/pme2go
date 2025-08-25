const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseData() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'pme-360-db',
    user: 'postgres',
    password: 'Postgres2024!'
  });

  try {
    console.log('🔍 Checking database data...\n');
    
    // Check users table
    console.log('👥 USERS TABLE:');
    const users = await pool.query('SELECT id, uuid, name, email, type FROM users LIMIT 10');
    console.log(`Found ${users.rows.length} users:`);
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) [ID: ${user.id}, UUID: ${user.uuid}]`);
    });
    
    console.log('\n📊 OPPORTUNITIES TABLE:');
    const opportunities = await pool.query('SELECT id, uuid, title, company FROM opportunities LIMIT 5');
    console.log(`Found ${opportunities.rows.length} opportunities:`);
    opportunities.rows.forEach(opp => {
      console.log(`  - ${opp.title} @ ${opp.company} [ID: ${opp.id}, UUID: ${opp.uuid}]`);
    });
    
    console.log('\n📅 EVENTS TABLE:');
    const events = await pool.query('SELECT id, uuid, title, organizer FROM events LIMIT 5');
    console.log(`Found ${events.rows.length} events:`);
    events.rows.forEach(event => {
      console.log(`  - ${event.title} by ${event.organizer} [ID: ${event.id}, UUID: ${event.uuid}]`);
    });
    
    console.log('\n💬 MESSAGES TABLE:');
    const messages = await pool.query('SELECT id, uuid, sender_id, receiver_id, content FROM messages LIMIT 5');
    console.log(`Found ${messages.rows.length} messages:`);
    messages.rows.forEach(msg => {
      console.log(`  - From ${msg.sender_id} to ${msg.receiver_id}: "${msg.content.substring(0, 50)}..."`);
    });
    
    // Test the exact query used by the API
    console.log('\n🔍 TESTING API QUERY:');
    const apiQuery = 'SELECT uuid as id, name, type, industry, location, description, avatar, verified, stats, profile_data FROM users WHERE 1=1 ORDER BY created_at DESC';
    const apiResult = await pool.query(apiQuery);
    console.log(`API query returned ${apiResult.rows.length} users:`);
    apiResult.rows.forEach(user => {
      console.log(`  - ${user.name} (UUID: ${user.id})`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseData();