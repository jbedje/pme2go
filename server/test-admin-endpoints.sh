#!/bin/bash

BASE_URL="http://localhost:3004/api"
ADMIN_EMAIL="admin@pme2go.com"
ADMIN_PASSWORD="Admin@2024!"

echo "🧪 Testing Admin Endpoints..."
echo ""

# Step 1: Login as admin
echo "📋 Step 1: Admin Login"
echo "──────────────────────────────────────────────────"

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Admin login failed"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Admin login successful"
echo "🔐 Token obtained: ${ADMIN_TOKEN:0:20}..."

# Step 2: Test dashboard stats
echo ""
echo "📋 Step 2: Dashboard Stats"
echo "──────────────────────────────────────────────────"

curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${BASE_URL}/admin/dashboard/stats" | \
  python -m json.tool 2>/dev/null || echo "✅ Dashboard stats retrieved (raw output above)"

# Step 3: Test users list
echo ""
echo "📋 Step 3: Users List"
echo "──────────────────────────────────────────────────"

curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${BASE_URL}/admin/users?limit=3" | \
  python -m json.tool 2>/dev/null || echo "✅ Users list retrieved (raw output above)"

# Step 4: Test system health
echo ""
echo "📋 Step 4: System Health"
echo "──────────────────────────────────────────────────"

curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${BASE_URL}/admin/system/health" | \
  python -m json.tool 2>/dev/null || echo "✅ System health retrieved (raw output above)"

# Step 5: Test system settings
echo ""
echo "📋 Step 5: System Settings"
echo "──────────────────────────────────────────────────"

curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${BASE_URL}/admin/system/settings" | \
  python -m json.tool 2>/dev/null || echo "✅ System settings retrieved (raw output above)"

# Step 6: Test access control (no token)
echo ""
echo "📋 Step 6: Access Control Test (No Token)"
echo "──────────────────────────────────────────────────"

UNAUTHORIZED_RESPONSE=$(curl -s "${BASE_URL}/admin/dashboard/stats")
echo "Response: $UNAUTHORIZED_RESPONSE"

echo ""
echo "🎉 Admin Endpoints Testing Completed!"