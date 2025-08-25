const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

async function migrateProfileFields() {
  try {
    console.log('👤 Migrating user profile fields...');
    
    // Add new profile columns to users table
    const profileColumns = [
      'phone VARCHAR(20)',
      'company VARCHAR(100)',
      'position VARCHAR(100)', 
      'bio TEXT',
      'website VARCHAR(255)',
      'linkedin VARCHAR(255)',
      'twitter VARCHAR(50)',
      'skills JSONB DEFAULT \'[]\'',
      'languages JSONB DEFAULT \'[]\'',
      'availability VARCHAR(20) DEFAULT \'available\'',
      'updated_at TIMESTAMP DEFAULT NOW()'
    ];

    for (const column of profileColumns) {
      try {
        const columnName = column.split(' ')[0];
        
        // Check if column already exists
        const checkResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = $1
        `, [columnName]);

        if (checkResult.rows.length === 0) {
          await pool.query(`ALTER TABLE users ADD COLUMN ${column}`);
          console.log(`✅ Added column: ${columnName}`);
        } else {
          console.log(`⚠️ Column already exists: ${columnName}`);
        }
      } catch (error) {
        console.error(`❌ Error adding column ${column}:`, error.message);
      }
    }

    // Update existing profile_data column to be more flexible
    try {
      await pool.query(`ALTER TABLE users ALTER COLUMN profile_data SET DEFAULT '{}'`);
      console.log('✅ Updated profile_data default');
    } catch (error) {
      console.warn('⚠️ Profile_data column update failed:', error.message);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company ON users(company)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_position ON users(position)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_availability ON users(availability)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_updated_at ON users(updated_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_skills ON users USING GIN(skills)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_languages ON users USING GIN(languages)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log(`✅ Created index`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Index already exists');
        } else {
          console.error('❌ Index creation failed:', error.message);
        }
      }
    }

    // Update existing users to have updated_at timestamp
    await pool.query(`
      UPDATE users 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `);
    console.log('✅ Set updated_at for existing users');

    // Show table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Updated users table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Show row count
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Users table now has ${countResult.rows[0].count} users`);

    console.log('\n🎉 Profile migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateProfileFields()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });