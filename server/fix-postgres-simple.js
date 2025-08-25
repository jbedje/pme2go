const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const PG_HBA_PATH = 'C:\\Postgresql\\17\\data\\pg_hba.conf';
const PG_HBA_BACKUP = 'C:\\Postgresql\\17\\data\\pg_hba.conf.backup';
const NEW_PASSWORD = 'Postgres2025!';

console.log('🔧 PostgreSQL Quick Fix for PME2GO');
console.log('===================================\n');

async function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
}

async function fixPostgresAuth() {
  try {
    console.log('📋 Step 1: Backing up pg_hba.conf...');
    
    // Backup current pg_hba.conf
    if (fs.existsSync(PG_HBA_PATH)) {
      fs.copyFileSync(PG_HBA_PATH, PG_HBA_BACKUP);
      console.log('✅ Backup created');
    } else {
      console.log('❌ pg_hba.conf not found at expected location');
      return;
    }

    console.log('\n📋 Step 2: Modifying pg_hba.conf for temporary trust auth...');
    
    // Read current config
    let config = fs.readFileSync(PG_HBA_PATH, 'utf8');
    
    // Replace scram-sha-256 with trust temporarily
    const modifiedConfig = config.replace(/scram-sha-256/g, 'trust');
    
    // Write modified config
    fs.writeFileSync(PG_HBA_PATH, modifiedConfig);
    console.log('✅ pg_hba.conf modified for trust authentication');

    console.log('\n📋 Step 3: Reloading PostgreSQL configuration...');
    
    try {
      // Try to reload config without restart
      await executeCommand('C:\\Postgresql\\17\\bin\\pg_ctl.exe reload -D "C:\\Postgresql\\17\\data"');
      console.log('✅ Configuration reloaded');
    } catch (error) {
      console.log('⚠️  Config reload failed, continuing...');
    }

    // Wait a moment for config to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📋 Step 4: Setting new password...');
    
    // Now try to set the password using trust auth
    const sqlCommand = `ALTER USER postgres PASSWORD '${NEW_PASSWORD}';`;
    
    try {
      await executeCommand(`C:\\Postgresql\\17\\bin\\psql.exe -U postgres -d postgres -h localhost -c "${sqlCommand}"`);
      console.log('✅ Password set successfully!');
    } catch (error) {
      console.log('❌ Failed to set password:', error.stderr);
      throw error;
    }

    console.log('\n📋 Step 5: Restoring original pg_hba.conf...');
    
    // Restore original config
    fs.copyFileSync(PG_HBA_BACKUP, PG_HBA_PATH);
    fs.unlinkSync(PG_HBA_BACKUP);
    console.log('✅ Original configuration restored');

    console.log('\n📋 Step 6: Reloading PostgreSQL configuration...');
    
    try {
      await executeCommand('C:\\Postgresql\\17\\bin\\pg_ctl.exe reload -D "C:\\Postgresql\\17\\data"');
      console.log('✅ Configuration reloaded');
    } catch (error) {
      console.log('⚠️  Config reload failed, you may need to restart PostgreSQL service');
    }

    // Wait for config to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📋 Step 7: Testing new connection...');
    
    // Test the connection with new password
    process.env.PGPASSWORD = NEW_PASSWORD;
    
    try {
      const result = await executeCommand(`C:\\Postgresql\\17\\bin\\psql.exe -U postgres -d postgres -h localhost -c "SELECT version();"`);
      console.log('✅ Connection test successful!');
      console.log(result.split('\\n')[0]); // Show just the version line
    } catch (error) {
      console.log('❌ Connection test failed:', error.stderr);
      throw error;
    }

    console.log('\n🎉 SUCCESS!');
    console.log('============');
    console.log(`✅ PostgreSQL password has been set to: ${NEW_PASSWORD}`);
    console.log('✅ Your .env file is already configured with this password');
    console.log('✅ You can now run: npm run migrate');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run migrate');
    console.log('   2. Restart your API server if it\'s running');
    console.log('   3. The app will automatically connect to the database');

  } catch (error) {
    console.log('\n❌ FAILED TO FIX AUTHENTICATION');
    console.log('================================');
    console.log('Error:', error.message || error.stderr || error);
    
    // Restore backup if something went wrong
    if (fs.existsSync(PG_HBA_BACKUP)) {
      console.log('\n🔄 Restoring backup configuration...');
      fs.copyFileSync(PG_HBA_BACKUP, PG_HBA_PATH);
      fs.unlinkSync(PG_HBA_BACKUP);
      console.log('✅ Backup restored');
    }

    console.log('\n💡 Manual alternatives:');
    console.log('1. Use pgAdmin to reset the postgres user password');
    console.log('2. Or continue using the app in Demo Mode (it works perfectly!)');
    console.log('3. Or contact your system administrator for help');
  }
}

fixPostgresAuth();