const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function checkAndFixAdminEmails() {
  try {
    console.log('🔍 Checking all admin user emails in database...\n');

    // Get all admin users
    const adminUsers = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users 
      WHERE role IN ('admin', 'super_admin') OR email LIKE '%admin%' OR email LIKE '%pme%'
      ORDER BY created_at;
    `);

    console.log('📧 Found admin-related users:');
    adminUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👑 Role: ${user.role || 'regular user'}`);
      console.log(`   📅 Created: ${user.created_at}`);
      console.log('');
    });

    console.log('🔧 Based on the frontend trying to use admin@pme360.com, I need to add this email...\n');

    // Add the admin@pme360.com user that the frontend expects
    const bcrypt = require('bcrypt');
    const correctPasswordHash = await bcrypt.hash('password123', 12);

    await pool.query(`
      INSERT INTO users (name, email, password_hash, type, role, verified, email_verified, created_at)
      VALUES 
      ('PME360 Super Admin', 'admin@pme360.com', $1, 'PME/Startup', 'super_admin', true, true, NOW()),
      ('PME360 Admin', 'moderator@pme360.com', $1, 'PME/Startup', 'admin', true, true, NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        verified = EXCLUDED.verified,
        email_verified = EXCLUDED.email_verified;
    `, [correctPasswordHash]);

    console.log('✅ Added/Updated PME360 admin accounts');

    // Verify the new accounts
    const newAdmins = await pool.query(`
      SELECT name, email, role
      FROM users 
      WHERE email IN ('admin@pme360.com', 'moderator@pme360.com');
    `);

    console.log('\n🎉 Frontend-Compatible Admin Credentials:');
    console.log('==========================================');
    newAdmins.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: password123`);
      console.log(`   👑 Role: ${user.role}`);
      console.log('');
    });

    console.log('🌐 You can now login at: http://localhost:3001');
    console.log('Use: admin@pme360.com with password: password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndFixAdminEmails();