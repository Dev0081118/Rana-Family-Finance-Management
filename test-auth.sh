#!/bin/bash

echo "=== Home Finance App Authentication Test ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test variables
API_URL="http://localhost:5001/api/v1"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"

echo "Testing Authentication Endpoints..."
echo ""

# Function to make HTTP requests and check response
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing $description... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL/$endpoint")
    else
        response=$(curl -s -w "%{http_code}" \
            "$API_URL/$endpoint")
    fi
    
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL (Status: $status_code)${NC}"
        return 1
    fi
}

# Test 1: Health Check
test_endpoint "GET" "health" "" "200" "Server health check"

# Test 2: Registration
echo ""
echo "Testing User Registration..."
registration_data="{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
test_endpoint "POST" "auth/register" "$registration_data" "201" "User registration"

# Test 3: Login
echo ""
echo "Testing User Login..."
login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$API_URL/auth/login")

if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: $token"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $login_response"
fi

# Test 4: Protected Route Access
echo ""
echo "Testing Protected Route Access..."
if [ -n "$token" ]; then
    protected_response=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $token" \
        "$API_URL/auth/profile")
    
    status_code="${protected_response: -3}"
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ Protected route access successful${NC}"
    else
        echo -e "${RED}✗ Protected route access failed (Status: $status_code)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping protected route test (no token)${NC}"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "If tests failed, check:"
echo "1. Backend server is running on port 5001"
echo "2. Database connection is working"
echo "3. Environment variables are set correctly"
echo "4. CORS settings allow frontend requests"