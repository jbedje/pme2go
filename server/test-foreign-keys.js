const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

async function testForeignKeys() {
  try {
    console.log('🧪 Testing Foreign Key Constraints...\n');
    
    // Test 1: Try to insert a message with invalid sender_id
    console.log('📋 Test 1: Invalid sender_id in messages table');
    console.log('─'.repeat(50));
    try {
      await pool.query(`
        INSERT INTO messages (uuid, sender_id, receiver_id, content) 
        VALUES ('test-invalid-sender', 99999, 1, 'Test message')
      `);
      console.log('❌ ERROR: Should have failed with foreign key constraint violation');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('✅ SUCCESS: Foreign key constraint prevented invalid sender_id');
      } else {
        console.log('❌ UNEXPECTED ERROR:', error.message);
      }
    }
    
    // Test 2: Try to insert a notification with invalid user_id (UUID)
    console.log('\n📋 Test 2: Invalid user_id in notifications table');
    console.log('─'.repeat(50));
    try {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type) 
        VALUES ('invalid-uuid-123', 'Test Notification', 'Test message', 'info')
      `);
      console.log('❌ ERROR: Should have failed with foreign key constraint violation');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('✅ SUCCESS: Foreign key constraint prevented invalid user_id (UUID)');
      } else {
        console.log('❌ UNEXPECTED ERROR:', error.message);
      }
    }
    
    // Test 3: Try to delete a user who has messages (should cascade delete)
    console.log('\n📋 Test 3: Cascade delete test');
    console.log('─'.repeat(50));
    
    // First, create a test user
    const testUserResult = await pool.query(`
      INSERT INTO users (uuid, name, email, password_hash, type, industry) 
      VALUES ('test-user-cascade', 'Test Cascade User', 'test-cascade@example.com', 'hashed_password', 'PME/Startup', 'Test')
      RETURNING id, uuid
    `);
    const testUserId = testUserResult.rows[0].id;
    const testUserUuid = testUserResult.rows[0].uuid;
    
    console.log(`Created test user: ID=${testUserId}, UUID=${testUserUuid}`);
    
    // Create a test message from this user
    await pool.query(`
      INSERT INTO messages (uuid, sender_id, receiver_id, content) 
      VALUES ('test-cascade-message', $1, 1, 'Test cascade message')
    `, [testUserId]);
    
    // Create a test notification for this user
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type) 
      VALUES ($1, 'Test Cascade Notification', 'Test cascade notification', 'info')
    `, [testUserUuid]);
    
    console.log('Created test message and notification for user');
    
    // Check that the records exist
    const messageCountBefore = await pool.query(`
      SELECT COUNT(*) as count FROM messages WHERE sender_id = $1
    `, [testUserId]);
    
    const notificationCountBefore = await pool.query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = $1
    `, [testUserUuid]);
    
    console.log(`Messages before delete: ${messageCountBefore.rows[0].count}`);
    console.log(`Notifications before delete: ${notificationCountBefore.rows[0].count}`);
    
    // Now delete the user - should cascade delete messages and notifications
    await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
    console.log('Deleted test user');
    
    // Check that the related records were deleted
    const messageCountAfter = await pool.query(`
      SELECT COUNT(*) as count FROM messages WHERE sender_id = $1
    `, [testUserId]);
    
    const notificationCountAfter = await pool.query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = $1
    `, [testUserUuid]);
    
    console.log(`Messages after delete: ${messageCountAfter.rows[0].count}`);
    console.log(`Notifications after delete: ${notificationCountAfter.rows[0].count}`);
    
    if (messageCountAfter.rows[0].count === '0' && notificationCountAfter.rows[0].count === '0') {
      console.log('✅ SUCCESS: Cascade delete worked correctly');
    } else {
      console.log('❌ ERROR: Cascade delete did not work as expected');
    }
    
    // Test 4: Test user_connections table constraints
    console.log('\n📋 Test 4: User connections table constraints');
    console.log('─'.repeat(50));
    
    // Test self-connection prevention
    try {
      await pool.query(`
        INSERT INTO user_connections (requester_id, addressee_id, status) 
        VALUES (1, 1, 'pending')
      `);
      console.log('❌ ERROR: Should have prevented self-connection');
    } catch (error) {
      if (error.message.includes('no_self_connection') || error.message.includes('violates check constraint')) {
        console.log('✅ SUCCESS: Self-connection check constraint working');
      } else {
        console.log('❌ UNEXPECTED ERROR:', error.message);
      }
    }
    
    // Test valid connection creation
    try {
      const result = await pool.query(`
        INSERT INTO user_connections (requester_id, addressee_id, status) 
        VALUES (1, 2, 'pending') 
        ON CONFLICT (requester_id, addressee_id) DO NOTHING
        RETURNING id
      `);
      
      if (result.rows.length > 0) {
        console.log('✅ SUCCESS: Valid user connection created');
        
        // Clean up
        await pool.query(`DELETE FROM user_connections WHERE id = $1`, [result.rows[0].id]);
      } else {
        console.log('⚠️ Connection already exists (expected if running multiple times)');
      }
    } catch (error) {
      console.log('❌ ERROR creating valid connection:', error.message);
    }
    
    // Test 5: Test user_documents table
    console.log('\n📋 Test 5: User documents table constraints');
    console.log('─'.repeat(50));
    
    try {
      const result = await pool.query(`
        INSERT INTO user_documents (user_id, filename, original_filename, file_path, file_size, mime_type, document_type) 
        VALUES (1, 'test_doc.pdf', 'Original Test.pdf', '/uploads/test_doc.pdf', 1024, 'application/pdf', 'document')
        RETURNING id
      `);
      
      console.log('✅ SUCCESS: Document record created');
      
      // Clean up
      await pool.query(`DELETE FROM user_documents WHERE id = $1`, [result.rows[0].id]);
    } catch (error) {
      console.log('❌ ERROR creating document record:', error.message);
    }
    
    // Test invalid document type
    try {
      await pool.query(`
        INSERT INTO user_documents (user_id, filename, original_filename, file_path, file_size, mime_type, document_type) 
        VALUES (1, 'test_doc.pdf', 'Original Test.pdf', '/uploads/test_doc.pdf', 1024, 'application/pdf', 'invalid_type')
      `);
      console.log('❌ ERROR: Should have rejected invalid document type');
    } catch (error) {
      if (error.message.includes('violates check constraint')) {
        console.log('✅ SUCCESS: Document type check constraint working');
      } else {
        console.log('❌ UNEXPECTED ERROR:', error.message);
      }
    }
    
    console.log('\n🎉 Foreign Key Constraint Testing Completed!');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run tests
testForeignKeys()
  .then(() => {
    console.log('\n✅ All foreign key tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Foreign key testing failed:', error);
    process.exit(1);
  });