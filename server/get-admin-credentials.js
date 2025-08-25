const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function getAdminCredentials() {
  try {
    console.log('🔍 Looking for admin users in the database...\n');

    const result = await pool.query(`
      SELECT name, email, role, verified, email_verified, created_at
      FROM users 
      WHERE role IN ('admin', 'super_admin')
      ORDER BY role DESC, created_at ASC;
    `);

    if (result.rows.length > 0) {
      console.log('👑 Admin Users Found:');
      console.log('==========================================');
      
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.role.toUpperCase()}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.name}`);
        console.log(`   ✅ Verified: ${user.verified ? 'Yes' : 'No'}`);
        console.log(`   📬 Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${user.created_at}`);
      });

      console.log('\n🔑 Login Credentials:');
      console.log('==========================================');
      console.log('For ALL admin accounts, the password is: password123');
      console.log('(This is the demo password set during database setup)');
      
      console.log('\n📋 Quick Login Info:');
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email} | Password: password123 | Role: ${user.role}`);
      });

    } else {
      console.log('❌ No admin users found in the database');
      
      console.log('\n🔧 Creating admin users...');
      
      // Create admin users if none exist
      await pool.query(`
        INSERT INTO users (name, email, password_hash, type, role, verified, email_verified, created_at)
        VALUES 
        ('Super Admin', 'admin@pme2go.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'super_admin', true, true, NOW()),
        ('Admin User', 'moderator@pme2go.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu', 'PME/Startup', 'admin', true, true, NOW())
        ON CONFLICT (email) DO UPDATE SET
          role = EXCLUDED.role,
          verified = EXCLUDED.verified,
          email_verified = EXCLUDED.email_verified;
      `);
      
      console.log('✅ Admin users created!');
      console.log('\n👑 Default Admin Credentials:');
      console.log('==========================================');
      console.log('1. Super Admin:');
      console.log('   📧 Email: admin@pme2go.com');
      console.log('   🔑 Password: password123');
      console.log('\n2. Regular Admin:');
      console.log('   📧 Email: moderator@pme2go.com');
      console.log('   🔑 Password: password123');
    }

    console.log('\n🌐 Access URLs:');
    console.log('==========================================');
    console.log('Frontend: http://localhost:3001');
    console.log('Backend API: http://localhost:3004');
    console.log('Admin Dashboard: Login with admin credentials to access admin panel');

    console.log('\n⚠️  Security Note:');
    console.log('==========================================');
    console.log('These are demo credentials for development only.');
    console.log('In production, please change the passwords and use secure credentials.');

  } catch (error) {
    console.error('❌ Error getting admin credentials:', error.message);
  } finally {
    await pool.end();
  }
}

getAdminCredentials();