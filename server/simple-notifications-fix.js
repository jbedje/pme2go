const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

async function createNotificationsTable() {
  try {
    console.log('🔄 Creating notifications table...');
    
    // Drop existing table
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    
    // Create notifications table
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        data JSONB DEFAULT '{}',
        read_status BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        from_user_id UUID
      )
    `);
    
    // Create indexes
    await pool.query(`CREATE INDEX idx_notifications_user_id ON notifications(user_id)`);
    await pool.query(`CREATE INDEX idx_notifications_created_at ON notifications(created_at)`);
    await pool.query(`CREATE INDEX idx_notifications_read_status ON notifications(read_status)`);
    
    console.log('✅ Notifications table created with indexes');
    
    // Show structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createNotificationsTable()
  .then(() => {
    console.log('🎉 Notifications table ready');
    process.exit(0);
  })
  .catch(() => process.exit(1));