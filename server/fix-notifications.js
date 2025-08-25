const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || 'pme-360-db',
  password: process.env.PGPASSWORD || 'Postgres2024!',
  port: process.env.PGPORT || 5432,
});

async function fixNotificationsTable() {
  try {
    console.log('🔄 Fixing notifications table...');
    
    // Drop existing table if it has issues
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    console.log('🗑️ Dropped existing notifications table');
    
    // Create notifications table with proper structure
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
    
    console.log('✅ Notifications table created successfully');
    
    // Create indexes
    await pool.query(`CREATE INDEX idx_notifications_user_id ON notifications(user_id)`);
    await pool.query(`CREATE INDEX idx_notifications_created_at ON notifications(created_at)`);
    await pool.query(`CREATE INDEX idx_notifications_read_status ON notifications(read_status)`);
    await pool.query(`CREATE INDEX idx_notifications_type ON notifications(type)`);
    await pool.query(`CREATE INDEX idx_notifications_from_user_id ON notifications(from_user_id)`);
    console.log('✅ Indexes created successfully');
    
    // Add sample notifications
    console.log('📝 Adding sample notifications...');
    
    // Get first user for testing
    const userResult = await pool.query('SELECT uuid FROM users WHERE uuid IS NOT NULL LIMIT 1');
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].uuid;
      
      const sampleNotifications = [
        {
          title: 'Bienvenue sur PME2GO !',
          message: 'Votre compte a été créé avec succès. Explorez la plateforme pour découvrir des opportunités.',
          type: 'welcome'
        },
        {
          title: 'Nouveau message',
          message: 'Vous avez reçu un nouveau message de Marie Dubois.',
          type: 'message'
        },
        {
          title: 'Opportunité recommandée',
          message: 'Une nouvelle opportunité correspond à votre profil : "Développeur Full-Stack"',
          type: 'opportunity'
        }
      ];
      
      for (const notification of sampleNotifications) {
        await pool.query(`
          INSERT INTO notifications (user_id, title, message, type, data)
          VALUES ($1, $2, $3, $4, $5)
        `, [userId, notification.title, notification.message, notification.type, JSON.stringify({})]);
      }
      
      console.log('✅ Sample notifications added');
    }
    
    // Show table info
    const countResult = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`📊 Notifications table now has ${countResult.rows[0].count} entries`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run fix
fixNotificationsTable()
  .then(() => {
    console.log('🎉 Notifications table fixed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });