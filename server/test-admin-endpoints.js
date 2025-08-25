const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@pme2go.com',
  password: 'Admin@2024!'
};

let adminToken = null;

async function testAdminEndpoints() {
  try {
    console.log('🧪 Testing Admin Endpoints...\n');
    
    // Step 1: Login as admin
    console.log('📋 Step 1: Admin Login');
    console.log('─'.repeat(50));
    
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Admin login failed:', error);
      process.exit(1);
    }
    
    const loginData = await loginResponse.json();
    adminToken = loginData.accessToken;
    console.log('✅ Admin login successful');
    console.log(`👤 Logged in as: ${loginData.user.name} (${loginData.user.email})`);
    console.log(`🔐 Role: ${loginData.user.role || 'Not set'}`);
    
    // Step 2: Test dashboard stats
    console.log('\n📋 Step 2: Dashboard Stats');
    console.log('─'.repeat(50));
    
    const statsResponse = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Dashboard stats retrieved successfully');
      console.log(`📊 Total users: ${stats.users.total}`);
      console.log(`🚫 Banned users: ${stats.users.banned}`);
      console.log(`🟢 Active users: ${stats.users.active}`);
      console.log(`📈 Recent users: ${stats.users.recent}`);
      console.log(`💬 Messages (24h): ${stats.activity.messages_24h}`);
      console.log(`🔔 Notifications (24h): ${stats.activity.notifications_24h}`);
      console.log(`🤝 Connections: ${stats.activity.connections}`);
      console.log('📋 User distribution:');
      stats.distribution.forEach(dist => {
        console.log(`  ${dist.type}: ${dist.count} users`);
      });
    } else {
      const error = await statsResponse.json();
      console.error('❌ Dashboard stats failed:', error);
    }
    
    // Step 3: Test user management - Get users list
    console.log('\n📋 Step 3: User Management - List Users');
    console.log('─'.repeat(50));
    
    const usersResponse = await fetch(`${BASE_URL}/admin/users?limit=5&page=1`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    let testUserId = null;
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users list retrieved successfully');
      console.log(`👥 Found ${usersData.users.length} users (Page ${usersData.pagination.currentPage}/${usersData.pagination.totalPages})`);
      
      usersData.users.slice(0, 3).forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.name} (${user.email}) - ${user.type} - Role: ${user.role || 'user'}`);
        if (user.role === 'user' && !testUserId) {
          testUserId = user.id; // Use first regular user for testing
        }
      });
    } else {
      const error = await usersResponse.json();
      console.error('❌ Get users failed:', error);
    }
    
    // Step 4: Test user details
    if (testUserId) {
      console.log('\n📋 Step 4: User Details');
      console.log('─'.repeat(50));
      
      const userDetailResponse = await fetch(`${BASE_URL}/admin/users/${testUserId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (userDetailResponse.ok) {
        const userDetail = await userDetailResponse.json();
        console.log('✅ User details retrieved successfully');
        console.log(`👤 User: ${userDetail.user.name} (${userDetail.user.email})`);
        console.log(`📊 Activity: ${userDetail.user.activity.messages_sent} messages, ${userDetail.user.activity.connections} connections`);
        console.log(`📅 Created: ${new Date(userDetail.user.created_at).toLocaleDateString()}`);
        console.log(`🔒 Status: ${userDetail.user.is_banned ? 'BANNED' : 'ACTIVE'}`);
      } else {
        const error = await userDetailResponse.json();
        console.error('❌ Get user details failed:', error);
      }
    }
    
    // Step 5: Test system health
    console.log('\n📋 Step 5: System Health Check');
    console.log('─'.repeat(50));
    
    const healthResponse = await fetch(`${BASE_URL}/admin/system/health`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ System health check successful');
      console.log(`📊 Status: ${health.status}`);
      console.log(`💾 Database: ${health.checks.database ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🧠 Memory: RSS=${health.checks.memory_usage.rss}, Heap=${health.checks.memory_usage.heapUsed}`);
      console.log(`⏱️  Uptime: ${Math.round(health.checks.uptime)} seconds`);
    } else {
      const error = await healthResponse.json();
      console.error('❌ System health check failed:', error);
    }
    
    // Step 6: Test system settings
    console.log('\n📋 Step 6: System Settings');
    console.log('─'.repeat(50));
    
    const settingsResponse = await fetch(`${BASE_URL}/admin/system/settings`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('✅ System settings retrieved successfully');
      settings.settings.forEach(setting => {
        console.log(`  🔧 ${setting.key}: ${JSON.stringify(setting.value)}`);
      });
    } else {
      const error = await settingsResponse.json();
      console.error('❌ Get system settings failed:', error);
    }
    
    // Step 7: Test admin activity logs
    console.log('\n📋 Step 7: Admin Activity Logs');
    console.log('─'.repeat(50));
    
    const logsResponse = await fetch(`${BASE_URL}/admin/system/logs?limit=5`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (logsResponse.ok) {
      const logs = await logsResponse.json();
      console.log('✅ Admin activity logs retrieved successfully');
      console.log(`📋 Found ${logs.logs.length} recent log entries:`);
      logs.logs.forEach((log, i) => {
        console.log(`  ${i + 1}. ${log.action} by ${log.admin_name} - ${new Date(log.created_at).toLocaleString()}`);
      });
    } else {
      const error = await logsResponse.json();
      console.error('❌ Get admin logs failed:', error);
    }
    
    // Step 8: Test non-admin access (should fail)
    console.log('\n📋 Step 8: Test Access Control (using regular user)');
    console.log('─'.repeat(50));
    
    // First, login as a regular user
    const regularUserLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'marie.dubois@consulting.fr', // Regular user from sample data
        password: 'Password123!' // Default password from setup
      })
    });
    
    if (regularUserLogin.ok) {
      const regularData = await regularUserLogin.json();
      console.log(`✅ Logged in as regular user: ${regularData.user.name}`);
      
      // Try to access admin endpoint
      const unauthorizedResponse = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${regularData.accessToken}`
        }
      });
      
      if (!unauthorizedResponse.ok) {
        const error = await unauthorizedResponse.json();
        console.log('✅ Access control working - regular user denied admin access');
        console.log(`🚫 Error: ${error.error} (${error.code})`);
      } else {
        console.log('❌ Access control FAILED - regular user got admin access!');
      }
    } else {
      console.log('⚠️  Could not test access control - regular user login failed');
    }
    
    console.log('\n🎉 Admin Endpoints Testing Completed!');
    
  } catch (error) {
    console.error('❌ Admin endpoints testing failed:', error);
    process.exit(1);
  }
}

// Run tests
testAdminEndpoints()
  .then(() => {
    console.log('\n✅ All admin endpoint tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Admin endpoint testing failed:', error);
    process.exit(1);
  });