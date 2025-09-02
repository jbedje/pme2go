const { default: fetch } = require('node-fetch');

async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3002/api/admin/dashboard/stats');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check if response has expected structure
    if (data.users && data.users.total !== undefined) {
      console.log('✓ Has users.total');
    } else {
      console.log('❌ Missing users.total');
    }
    
    if (data.users && data.users.active !== undefined) {
      console.log('✓ Has users.active');
    } else {
      console.log('❌ Missing users.active');
    }
    
    if (data.activity && data.activity.messages_24h !== undefined) {
      console.log('✓ Has activity.messages_24h');
    } else {
      console.log('❌ Missing activity.messages_24h');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();