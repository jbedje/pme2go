const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pme-360-db',
  password: 'Postgres2024!',
  port: 5432,
});

async function analyzeSchema() {
  try {
    console.log('🔍 Analyzing current database schema for foreign key relationships...\n');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Current Tables:');
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Analyze each table structure
    for (const table of tablesResult.rows) {
      console.log(`\n📊 Table: ${table.table_name}`);
      console.log('─'.repeat(50));
      
      const columnsResult = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columnsResult.rows.forEach(col => {
        const nullableStr = col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)';
        const lengthStr = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultStr = col.column_default ? `DEFAULT ${col.column_default}` : '';
        
        console.log(`  ${col.column_name}: ${col.data_type}${lengthStr} ${nullableStr} ${defaultStr}`);
      });
    }
    
    // Check existing foreign keys
    console.log('\n🔗 Existing Foreign Key Constraints:');
    console.log('─'.repeat(50));
    
    const fkResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    if (fkResult.rows.length === 0) {
      console.log('  No foreign key constraints found');
    } else {
      fkResult.rows.forEach(fk => {
        console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // Check existing indexes
    console.log('\n📇 Existing Indexes:');
    console.log('─'.repeat(50));
    
    const indexResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    indexResult.rows.forEach(idx => {
      console.log(`  ${idx.tablename}: ${idx.indexname}`);
    });
    
    // Sample data analysis
    console.log('\n📊 Sample Data Analysis:');
    console.log('─'.repeat(50));
    
    // Check if we have messages table
    const messageCheck = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'messages'
    `);
    
    if (parseInt(messageCheck.rows[0].count) > 0) {
      const messagesResult = await pool.query(`
        SELECT sender_id, receiver_id, COUNT(*) as message_count 
        FROM messages 
        GROUP BY sender_id, receiver_id 
        LIMIT 5
      `);
      
      console.log('  Messages sample:');
      messagesResult.rows.forEach(msg => {
        console.log(`    Sender: ${msg.sender_id}, Receiver: ${msg.receiver_id}, Count: ${msg.message_count}`);
      });
    }
    
    // Check if we have notifications table
    const notifCheck = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'notifications'
    `);
    
    if (parseInt(notifCheck.rows[0].count) > 0) {
      const notificationsResult = await pool.query(`
        SELECT user_id, type, COUNT(*) as notif_count 
        FROM notifications 
        GROUP BY user_id, type 
        LIMIT 5
      `);
      
      console.log('  Notifications sample:');
      notificationsResult.rows.forEach(notif => {
        console.log(`    User: ${notif.user_id}, Type: ${notif.type}, Count: ${notif.notif_count}`);
      });
    }
    
    console.log('\n✅ Schema analysis complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing schema:', error);
  } finally {
    await pool.end();
  }
}

analyzeSchema();