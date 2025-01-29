#!/bin/bash

HOST="http://localhost:3001"
API_ENDPOINT="$HOST/api/generate-egg"

echo "🚀 Running Enterprise Service Generation API Test Suite..."
echo "========================================"

# Function to send API requests
send_request() {
  local request_id=$1
  local payload=$2

  echo "➡️  Testing: $request_id"
  
  curl -X POST "$API_ENDPOINT" \
       -H "Content-Type: application/json" \
       -H "X-Request-ID: $request_id" \
       -d "$payload" | jq '.'
  
  echo "✅ Completed: $request_id"
  echo "----------------------------------------"
}

# ✅ Basic Service Test
send_request "test-basic-service" '{
  "type": "service",
  "parameters": {
    "name": "UserService",
    "methods": ["findAll", "findOne", "create", "update", "delete"]
  }
}'

# ✅ Complex Service Test - Authentication
send_request "test-auth-service" '{
  "type": "service",
  "parameters": {
    "name": "AuthenticationService",
    "methods": [
      "login", "logout", "refreshToken", "validateSession",
      "changePassword", "resetPassword", "generateTwoFactorCode",
      "verifyTwoFactorCode", "revokeToken", "updateProfile"
    ]
  }
}'

# ✅ Advanced Service Test - Enterprise Scale
send_request "test-enterprise-scale" '{
  "type": "service",
  "parameters": {
    "name": "EnterpriseService",
    "methods": [
      "initializeSystem", "validateConfiguration", "processRequest",
      "handleResponse", "manageCaching", "optimizePerformance",
      "handleFailover", "processQueue", "validateSecurity", "manageResources"
    ]
  }
}'

# ❌ Error Handling: Missing Parameters
send_request "test-missing-params" '{
  "type": "service"
}'

# ❌ Error Handling: Invalid Methods Format
send_request "test-invalid-methods" '{
  "type": "service",
  "parameters": {
    "name": "TestService",
    "methods": "not-an-array"
  }
}'

# ✅ Edge Case: Unicode Characters
send_request "test-unicode" '{
  "type": "service",
  "parameters": {
    "name": "TestService��",
    "methods": ["test✨", "validate🔍", "process🔄"]
  }
}'

# ✅ Edge Case: Extreme Name Length
send_request "test-long-name" "$(jq -n --arg name "$(printf 'a%.0s' {1..1000})Service" --argjson methods '["method1"]' '{
  "type": "service",
  "parameters": {
    "name": $name,
    "methods": $methods
  }
}')"

# ✅ Load Testing: Concurrent Requests
echo "🚀 Running Load Test..."
for i in {1..5}; do
  send_request "concurrent-test-$i" "$(jq -n --arg name "Service$i" --argjson methods '["method1"]' '{
    "type": "service",
    "parameters": {
      "name": $name,
      "methods": $methods
    }
  }')" &
done
wait

# ✅ Model Generation Test
send_request "test-model" '{
  "type": "model",
  "parameters": {
    "name": "OrderModel",
    "methods": [
      "validateBeforeSave", "calculateTotals", "applyDiscount",
      "generateInvoice", "processPayment", "updateInventory", "notifyCustomer"
    ]
  }
}'

# ✅ REST Controller Test
send_request "test-controller" '{
  "type": "controller",
  "parameters": {
    "name": "ProductController",
    "methods": [
      "listProducts", "getProductDetails", "createProduct",
      "updateProduct", "deleteProduct", "searchProducts",
      "exportToCsv", "importFromCsv"
    ]
  }
}'

# ✅ Health Check
echo "Checking API Health..."
curl -X GET "$HOST/api/health"

echo "✅ All API tests completed."

