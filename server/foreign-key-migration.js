const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

async function migrateForeignKeys() {
  try {
    console.log('🔗 Starting Foreign Key Relationships Migration...\n');
    
    // Step 1: Fix notifications table data type inconsistency
    console.log('📋 Step 1: Fixing notifications table data type consistency');
    console.log('─'.repeat(60));
    
    // Check current notifications table structure
    const notifColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name IN ('user_id', 'from_user_id')
      ORDER BY column_name
    `);
    
    console.log('Current notifications table UUID columns:');
    notifColumnsResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check users table UUID column
    const usersUuidResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'uuid'
    `);
    
    console.log('Users table UUID column:');
    usersUuidResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}(${col.character_maximum_length})`);
    });
    
    // Fix the data type inconsistency
    console.log('\n🔧 Converting notifications UUID columns to VARCHAR(50) to match users table...');
    
    // Drop existing foreign key constraint if exists
    try {
      await pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_user_id`);
      await pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_from_user_id`);
      console.log('✅ Dropped existing foreign key constraints');
    } catch (error) {
      console.log('⚠️ No existing foreign key constraints to drop');
    }
    
    // Convert UUID columns to VARCHAR(50)
    await pool.query(`ALTER TABLE notifications ALTER COLUMN user_id TYPE VARCHAR(50)`);
    await pool.query(`ALTER TABLE notifications ALTER COLUMN from_user_id TYPE VARCHAR(50)`);
    console.log('✅ Converted notifications UUID columns to VARCHAR(50)');
    
    // Step 2: Add missing foreign key constraints
    console.log('\n📋 Step 2: Adding Foreign Key Constraints');
    console.log('─'.repeat(60));
    
    const foreignKeyConstraints = [
      {
        table: 'notifications',
        constraint: 'fk_notifications_user_id',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'uuid',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'notifications',
        constraint: 'fk_notifications_from_user_id',
        column: 'from_user_id',
        refTable: 'users',
        refColumn: 'uuid',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    ];
    
    for (const fk of foreignKeyConstraints) {
      try {
        // Check if constraint already exists
        const existsResult = await pool.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = $1 AND constraint_name = $2 AND constraint_type = 'FOREIGN KEY'
        `, [fk.table, fk.constraint]);
        
        if (existsResult.rows.length > 0) {
          console.log(`⚠️ Foreign key ${fk.constraint} already exists`);
          continue;
        }
        
        // Create the foreign key constraint
        const sql = `
          ALTER TABLE ${fk.table} 
          ADD CONSTRAINT ${fk.constraint} 
          FOREIGN KEY (${fk.column}) 
          REFERENCES ${fk.refTable}(${fk.refColumn}) 
          ON DELETE ${fk.onDelete} 
          ON UPDATE ${fk.onUpdate}
        `;
        
        await pool.query(sql);
        console.log(`✅ Added foreign key: ${fk.table}.${fk.column} -> ${fk.refTable}.${fk.refColumn}`);
        
      } catch (error) {
        console.error(`❌ Error adding foreign key ${fk.constraint}:`, error.message);
      }
    }
    
    // Step 3: Create additional relationship tables for many-to-many relationships
    console.log('\n📋 Step 3: Creating Additional Relationship Tables');
    console.log('─'.repeat(60));
    
    // Create user_connections table for user-to-user relationships
    const userConnectionsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_connections (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(50) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
        requester_id INTEGER NOT NULL,
        addressee_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_connections_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_connections_addressee FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id),
        CONSTRAINT no_self_connection CHECK (requester_id != addressee_id)
      )
    `;
    
    try {
      await pool.query(userConnectionsTableSQL);
      console.log('✅ Created user_connections table');
      
      // Create indexes for user_connections
      await pool.query('CREATE INDEX IF NOT EXISTS idx_connections_requester ON user_connections(requester_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_connections_addressee ON user_connections(addressee_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status)');
      console.log('✅ Created indexes for user_connections table');
      
    } catch (error) {
      console.log('⚠️ user_connections table already exists or error:', error.message);
    }
    
    // Create user_documents table for file uploads
    const userDocumentsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_documents (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(50) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('avatar', 'document', 'certificate', 'portfolio')),
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    try {
      await pool.query(userDocumentsTableSQL);
      console.log('✅ Created user_documents table');
      
      // Create indexes for user_documents
      await pool.query('CREATE INDEX IF NOT EXISTS idx_documents_user ON user_documents(user_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_documents_type ON user_documents(document_type)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_documents_public ON user_documents(is_public)');
      console.log('✅ Created indexes for user_documents table');
      
    } catch (error) {
      console.log('⚠️ user_documents table already exists or error:', error.message);
    }
    
    // Step 4: Add additional constraints and indexes for existing tables
    console.log('\n📋 Step 4: Adding Additional Constraints and Indexes');
    console.log('─'.repeat(60));
    
    // Add NOT NULL constraints where appropriate
    const notNullConstraints = [
      { table: 'users', column: 'email' },
      { table: 'users', column: 'uuid' },
      { table: 'messages', column: 'sender_id' },
      { table: 'messages', column: 'receiver_id' },
      { table: 'notifications', column: 'user_id' }
    ];
    
    for (const constraint of notNullConstraints) {
      try {
        // Check if column is already NOT NULL
        const columnInfo = await pool.query(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [constraint.table, constraint.column]);
        
        if (columnInfo.rows[0]?.is_nullable === 'NO') {
          console.log(`⚠️ ${constraint.table}.${constraint.column} is already NOT NULL`);
          continue;
        }
        
        // Set column to NOT NULL
        await pool.query(`ALTER TABLE ${constraint.table} ALTER COLUMN ${constraint.column} SET NOT NULL`);
        console.log(`✅ Set ${constraint.table}.${constraint.column} to NOT NULL`);
        
      } catch (error) {
        console.error(`❌ Error setting NOT NULL for ${constraint.table}.${constraint.column}:`, error.message);
      }
    }
    
    // Step 5: Validate all foreign key relationships
    console.log('\n📋 Step 5: Validating Foreign Key Relationships');
    console.log('─'.repeat(60));
    
    const validationQueries = [
      {
        name: 'Orphaned messages (sender)',
        query: `
          SELECT COUNT(*) as count 
          FROM messages m 
          LEFT JOIN users u ON m.sender_id = u.id 
          WHERE u.id IS NULL
        `
      },
      {
        name: 'Orphaned messages (receiver)',
        query: `
          SELECT COUNT(*) as count 
          FROM messages m 
          LEFT JOIN users u ON m.receiver_id = u.id 
          WHERE u.id IS NULL
        `
      },
      {
        name: 'Orphaned notifications',
        query: `
          SELECT COUNT(*) as count 
          FROM notifications n 
          LEFT JOIN users u ON n.user_id = u.uuid 
          WHERE u.uuid IS NULL AND n.user_id IS NOT NULL
        `
      },
      {
        name: 'Orphaned applications',
        query: `
          SELECT COUNT(*) as count 
          FROM applications a 
          LEFT JOIN users u ON a.user_id = u.id 
          WHERE u.id IS NULL
        `
      }
    ];
    
    for (const validation of validationQueries) {
      try {
        const result = await pool.query(validation.query);
        const count = parseInt(result.rows[0].count);
        
        if (count === 0) {
          console.log(`✅ ${validation.name}: No orphaned records found`);
        } else {
          console.log(`⚠️ ${validation.name}: Found ${count} orphaned records`);
        }
      } catch (error) {
        console.error(`❌ Error validating ${validation.name}:`, error.message);
      }
    }
    
    // Step 6: Display final foreign key relationships summary
    console.log('\n📋 Step 6: Final Foreign Key Relationships Summary');
    console.log('─'.repeat(60));
    
    const finalFkResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    console.log('All Foreign Key Relationships:');
    finalFkResult.rows.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (DELETE: ${fk.delete_rule}, UPDATE: ${fk.update_rule})`);
    });
    
    console.log('\n🎉 Foreign Key Migration completed successfully!');
    console.log(`📊 Total Foreign Key constraints: ${finalFkResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateForeignKeys()
  .then(() => {
    console.log('\n✅ Foreign Key migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Foreign Key migration failed:', error);
    process.exit(1);
  });