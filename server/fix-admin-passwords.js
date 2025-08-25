const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function fixAdminPasswords() {
  try {
    console.log('🔍 Checking current admin password hashes...\n');

    // Check current admin users
    const currentAdmins = await pool.query(`
      SELECT name, email, role, password_hash 
      FROM users 
      WHERE role IN ('admin', 'super_admin')
      ORDER BY role DESC;
    `);

    console.log('Current admin users:');
    currentAdmins.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password_hash.substring(0, 20)}...`);
    });

    console.log('\n🔐 Generating new password hash for "password123"...');
    
    // Generate correct bcrypt hash for "password123"
    const correctPasswordHash = await bcrypt.hash('password123', 12);
    console.log(`New hash: ${correctPasswordHash.substring(0, 20)}...`);

    // Test the hash
    const testResult = await bcrypt.compare('password123', correctPasswordHash);
    console.log(`✅ Hash test result: ${testResult}`);

    console.log('\n🔧 Updating admin passwords...');

    // Update admin users with correct password hash
    const updateResult = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE role IN ('admin', 'super_admin');
    `, [correctPasswordHash]);

    console.log(`✅ Updated ${updateResult.rowCount} admin users`);

    // Verify the update
    console.log('\n🧪 Testing login with updated credentials...');
    
    const testAdmin = await pool.query(`
      SELECT name, email, role, password_hash 
      FROM users 
      WHERE email = 'admin@pme2go.com';
    `);

    if (testAdmin.rows.length > 0) {
      const user = testAdmin.rows[0];
      const passwordMatch = await bcrypt.compare('password123', user.password_hash);
      
      console.log(`Admin user: ${user.name} (${user.email})`);
      console.log(`Password "password123" matches: ${passwordMatch ? '✅ YES' : '❌ NO'}`);
      
      if (passwordMatch) {
        console.log('\n🎉 Admin passwords fixed successfully!');
        console.log('\n👑 Updated Admin Credentials:');
        console.log('==========================================');
        console.log('1. Super Admin:');
        console.log('   📧 Email: admin@pme2go.com');
        console.log('   🔑 Password: password123');
        console.log('\n2. Regular Admin:');
        console.log('   📧 Email: moderator@pme2go.com');
        console.log('   🔑 Password: password123');
        console.log('\n🌐 You can now login at: http://localhost:3001');
      }
    }

  } catch (error) {
    console.error('❌ Error fixing admin passwords:', error.message);
  } finally {
    await pool.end();
  }
}

fixAdminPasswords();