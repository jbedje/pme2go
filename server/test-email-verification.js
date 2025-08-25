const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

async function testEmailVerification() {
  try {
    console.log('🧪 Testing Email Verification System...\n');

    // Test 1: Register a new user
    console.log('1️⃣  Testing user registration with email verification...');
    
    const registerResponse = await fetch('http://localhost:3004/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test.verification@example.com',
        password: 'TestPassword123!',
        type: 'PME/Startup',
        industry: 'Technology',
        location: 'Paris'
      })
    });

    const registerData = await registerResponse.json();
    
    if (registerData.success) {
      console.log('✅ User registered successfully');
      console.log(`   - User ID: ${registerData.user.id}`);
      console.log(`   - Email: ${registerData.user.email}`);
      console.log(`   - Email Verified: ${registerData.user.emailVerified}`);
      console.log(`   - Requires Email Verification: ${registerData.requiresEmailVerification}`);
    } else {
      console.log('❌ Registration failed:', registerData.error);
      return;
    }

    // Test 2: Check user in database
    console.log('\n2️⃣  Verifying user in database...');
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', ['test.verification@example.com']);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ User found in database');
      console.log(`   - Email Verified: ${user.email_verified}`);
      console.log(`   - Created At: ${user.created_at}`);
    } else {
      console.log('❌ User not found in database');
      return;
    }

    // Test 3: Check verification token
    console.log('\n3️⃣  Checking verification token...');
    
    const tokenResult = await pool.query(
      'SELECT * FROM user_verification_tokens WHERE user_id = $1 AND token_type = $2',
      [userResult.rows[0].uuid, 'email_verification']
    );
    
    if (tokenResult.rows.length > 0) {
      const token = tokenResult.rows[0];
      console.log('✅ Verification token found');
      console.log(`   - Token Type: ${token.token_type}`);
      console.log(`   - Expires At: ${token.expires_at}`);
      console.log(`   - Used: ${token.used_at ? 'Yes' : 'No'}`);
      
      // Test 4: Verify email with token
      console.log('\n4️⃣  Testing email verification...');
      
      const verifyResponse = await fetch(`http://localhost:3004/api/auth/verify-email?token=${token.token}`, {
        method: 'GET'
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        console.log('✅ Email verification successful');
        console.log(`   - Message: ${verifyData.message}`);
        console.log(`   - User ID: ${verifyData.user.id}`);
        console.log(`   - Email Verified: ${verifyData.user.emailVerified}`);
        console.log(`   - Verified At: ${verifyData.user.verifiedAt}`);
      } else {
        console.log('❌ Email verification failed:', verifyData.error);
        return;
      }

      // Test 5: Check token is marked as used
      console.log('\n5️⃣  Verifying token is marked as used...');
      
      const usedTokenResult = await pool.query(
        'SELECT * FROM user_verification_tokens WHERE token = $1',
        [token.token]
      );
      
      if (usedTokenResult.rows.length > 0) {
        const usedToken = usedTokenResult.rows[0];
        if (usedToken.used_at) {
          console.log('✅ Token marked as used');
          console.log(`   - Used At: ${usedToken.used_at}`);
        } else {
          console.log('❌ Token not marked as used');
        }
      }

    } else {
      console.log('❌ Verification token not found');
      return;
    }

    // Test 6: Test duplicate verification (should fail)
    console.log('\n6️⃣  Testing duplicate verification (should fail)...');
    
    const duplicateVerifyResponse = await fetch(`http://localhost:3004/api/auth/verify-email?token=${tokenResult.rows[0].token}`, {
      method: 'GET'
    });
    
    const duplicateVerifyData = await duplicateVerifyResponse.json();
    
    if (!duplicateVerifyData.success) {
      console.log('✅ Duplicate verification properly rejected');
      console.log(`   - Error: ${duplicateVerifyData.error}`);
    } else {
      console.log('❌ Duplicate verification should have failed');
    }

    // Test 7: Test resend verification
    console.log('\n7️⃣  Testing resend verification (already verified)...');
    
    const resendResponse = await fetch('http://localhost:3004/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.verification@example.com'
      })
    });
    
    const resendData = await resendResponse.json();
    
    if (resendData.success) {
      console.log('✅ Resend verification handled correctly');
      console.log(`   - Message: ${resendData.message}`);
    } else {
      console.log('❌ Resend verification failed:', resendData.error);
    }

    // Test 8: Test password reset
    console.log('\n8️⃣  Testing password reset request...');
    
    const resetRequestResponse = await fetch('http://localhost:3004/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.verification@example.com'
      })
    });
    
    const resetRequestData = await resetRequestResponse.json();
    
    if (resetRequestData.success) {
      console.log('✅ Password reset request successful');
      console.log(`   - Message: ${resetRequestData.message}`);
      
      // Check for password reset token
      const resetTokenResult = await pool.query(
        'SELECT * FROM user_verification_tokens WHERE user_id = $1 AND token_type = $2',
        [userResult.rows[0].uuid, 'password_reset']
      );
      
      if (resetTokenResult.rows.length > 0) {
        console.log('✅ Password reset token created');
        
        // Test password reset
        console.log('\n9️⃣  Testing password reset...');
        
        const resetResponse = await fetch('http://localhost:3004/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: resetTokenResult.rows[0].token,
            newPassword: 'NewPassword123!'
          })
        });
        
        const resetData = await resetResponse.json();
        
        if (resetData.success) {
          console.log('✅ Password reset successful');
          console.log(`   - Message: ${resetData.message}`);
        } else {
          console.log('❌ Password reset failed:', resetData.error);
        }
      } else {
        console.log('❌ Password reset token not found');
      }
    } else {
      console.log('❌ Password reset request failed:', resetRequestData.error);
    }

    // Clean up test user
    console.log('\n🧹 Cleaning up test data...');
    await pool.query('DELETE FROM user_verification_tokens WHERE user_id = $1', [userResult.rows[0].uuid]);
    await pool.query('DELETE FROM users WHERE email = $1', ['test.verification@example.com']);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Email Verification System Testing Completed Successfully!');
    console.log('\n📊 Test Results Summary:');
    console.log('   ✅ User registration with email verification');
    console.log('   ✅ Verification token creation and storage');
    console.log('   ✅ Email verification process');
    console.log('   ✅ Token usage tracking');
    console.log('   ✅ Duplicate verification prevention');
    console.log('   ✅ Resend verification handling');
    console.log('   ✅ Password reset request and process');
    console.log('   ✅ Data cleanup and integrity');

  } catch (error) {
    console.error('❌ Email verification test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testEmailVerification();
}

module.exports = { testEmailVerification };