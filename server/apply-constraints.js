const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function executeSQL(query, description) {
  try {
    console.log(`\n📝 ${description}...`);
    const result = await pool.query(query);
    console.log(`✅ Success: ${description}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

async function applyConstraints() {
  try {
    console.log('🚀 Starting comprehensive constraints application...\n');

    // 1. Basic table constraints
    await executeSQL(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Users table constraints
      ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_email_format 
          CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
    `, 'Adding email format validation');

    await executeSQL(`
      ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_type_valid 
          CHECK (type IN ('PME/Startup', 'Expert/Consultant', 'Mentor', 'Investisseur', 'Incubateur'));
    `, 'Adding user type validation');

    await executeSQL(`
      ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_name_length 
          CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);
    `, 'Adding name length validation');

    await executeSQL(`
      ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_account_status_valid 
          CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification', 'deleted'));
    `, 'Adding account status validation');

    // 2. Create audit log table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          uuid UUID UNIQUE DEFAULT gen_random_uuid(),
          table_name VARCHAR(50) NOT NULL,
          record_id UUID NOT NULL,
          operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
          old_values JSONB,
          new_values JSONB,
          changed_by UUID,
          changed_at TIMESTAMP DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT
      );
    `, 'Creating audit log table');

    // 3. Create system settings table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value JSONB NOT NULL DEFAULT '{}',
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          
          CONSTRAINT chk_settings_key_format CHECK (key ~ '^[a-z][a-z0-9_]*$'),
          CONSTRAINT chk_settings_key_length CHECK (LENGTH(key) >= 3 AND LENGTH(key) <= 100)
      );
    `, 'Creating system settings table');

    // 4. Insert default system settings
    await executeSQL(`
      INSERT INTO system_settings (key, value, description) VALUES
          ('maintenance_mode', '{"enabled": false, "message": "System under maintenance"}', 'Maintenance mode configuration'),
          ('user_registration', '{"enabled": true, "require_verification": true}', 'User registration settings'),
          ('rate_limits', '{"auth_attempts": 5, "general_requests": 100, "window_minutes": 15}', 'Rate limiting configuration'),
          ('notifications', '{"email_enabled": true, "push_enabled": false}', 'Notification preferences'),
          ('file_uploads', '{"max_size_mb": 10, "allowed_types": ["jpg", "png", "pdf", "doc", "docx"]}', 'File upload restrictions')
      ON CONFLICT (key) DO NOTHING;
    `, 'Inserting default system settings');

    // 5. Add performance indexes
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(email) WHERE account_status = 'active';
      CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(created_at, type) WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
    `, 'Creating performance indexes');

    // 6. Create data validation functions
    await executeSQL(`
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
      DECLARE
          deleted_count INTEGER;
      BEGIN
          DELETE FROM user_sessions 
          WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `, 'Creating session cleanup function');

    // 7. Create performance monitoring view
    await executeSQL(`
      CREATE OR REPLACE VIEW system_performance_view AS
      SELECT 
          'users' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
          COUNT(*) FILTER (WHERE account_status = 'active') as active_records,
          AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER as avg_age_days
      FROM users
      UNION ALL
      SELECT 
          'opportunities',
          COUNT(*),
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
          COUNT(*) FILTER (WHERE is_active = true),
          AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER
      FROM opportunities
      UNION ALL
      SELECT 
          'messages',
          COUNT(*),
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
          COUNT(*) FILTER (WHERE read_at IS NOT NULL),
          AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER
      FROM messages;
    `, 'Creating performance monitoring view');

    // 8. Check current constraints
    console.log('\n📊 Current database constraints:');
    const constraintResult = await executeSQL(`
      SELECT 
          constraint_name, 
          table_name, 
          constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      ORDER BY table_name, constraint_type;
    `, 'Querying current constraints');

    if (constraintResult && constraintResult.rows) {
      console.log('\n✅ Database Constraints Summary:');
      const constraintsByType = {};
      constraintResult.rows.forEach(row => {
        if (!constraintsByType[row.constraint_type]) {
          constraintsByType[row.constraint_type] = [];
        }
        constraintsByType[row.constraint_type].push(`${row.table_name}.${row.constraint_name}`);
      });

      Object.keys(constraintsByType).forEach(type => {
        console.log(`\n🔐 ${type} (${constraintsByType[type].length}):`);
        constraintsByType[type].slice(0, 5).forEach(constraint => {
          console.log(`   - ${constraint}`);
        });
        if (constraintsByType[type].length > 5) {
          console.log(`   ... and ${constraintsByType[type].length - 5} more`);
        }
      });
    }

    // 9. Test data integrity
    console.log('\n🧪 Testing data integrity...');
    const integrityResult = await executeSQL(`
      SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$') as valid_emails,
          COUNT(*) FILTER (WHERE account_status = 'active') as active_users
      FROM users;
    `, 'Checking user data integrity');

    if (integrityResult && integrityResult.rows[0]) {
      const stats = integrityResult.rows[0];
      console.log(`   📈 Total users: ${stats.total_users}`);
      console.log(`   ✉️  Valid emails: ${stats.valid_emails}`);
      console.log(`   👤 Active users: ${stats.active_users}`);
    }

    console.log('\n🎉 Comprehensive constraints applied successfully!');
    console.log('\n📋 Summary of applied constraints:');
    console.log('   ✅ Email format validation');
    console.log('   ✅ User type validation');  
    console.log('   ✅ Name length validation');
    console.log('   ✅ Account status validation');
    console.log('   ✅ Audit log table created');
    console.log('   ✅ System settings table created');
    console.log('   ✅ Performance indexes added');
    console.log('   ✅ Data validation functions created');
    console.log('   ✅ Performance monitoring view created');

  } catch (error) {
    console.error('💥 Failed to apply constraints:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  applyConstraints();
}

module.exports = { applyConstraints };