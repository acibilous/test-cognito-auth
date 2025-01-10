#!/bin/bash

echo "📝 Getting API URL..."
# Get the most recently created API
API_URL=$(aws apigateway get-rest-apis --query 'reverse(sort_by(items, &createdDate))[0].id' --output text)

if [ -z "$API_URL" ]; then
  echo "❌ No API Gateway found"
  exit 1
fi

echo "API URL: https://${API_URL}.execute-api.eu-north-1.amazonaws.com/prod"

echo -e "\n📝 Getting Cognito credentials..."
# Get the most recently created user pool
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 --query 'reverse(sort_by(UserPools[?contains(Name, `nitro-app`)], &CreationDate))[0].Id' --output text)

if [ -z "$USER_POOL_ID" ]; then
  echo "❌ No Cognito User Pool found"
  exit 1
fi

# Get client info and print raw output for debugging
echo "Debug: Getting clients for pool ${USER_POOL_ID}"
# Get client ID first
CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id ${USER_POOL_ID} \
  --query 'UserPoolClients[0].ClientId' --output text)

if [ -z "$CLIENT_ID" ]; then
  echo "❌ No Cognito Client found"
  exit 1
fi

# Get client secret
CLIENT_SECRET=$(aws cognito-idp describe-user-pool-client \
  --user-pool-id ${USER_POOL_ID} \
  --client-id ${CLIENT_ID} \
  --query 'UserPoolClient.ClientSecret' \
  --output text)

if [ -z "$CLIENT_SECRET" ]; then
  echo "❌ No Client Secret found"
  exit 1
fi

echo "User Pool ID: ${USER_POOL_ID}"
echo "Client ID: ${CLIENT_ID}"
echo "Client Secret: ${CLIENT_SECRET}"
echo "Domain: https://${USER_POOL_ID}.auth.eu-north-1.amazoncognito.com"

# Get API Key
echo -e "\n📝 Getting API Key..."
API_KEY=$(aws apigateway get-api-keys \
  --query 'items[?ends_with(name, `NitroAppApiKey`)].value' \
  --include-values \
  --output text)

if [ -z "$API_KEY" ]; then
  echo "❌ No API Key found"
  exit 1
fi

echo "API Key: ${API_KEY}"

# Save to env file for easy access
echo -e "\n📝 Saving to .env file..."
cat > "$(dirname "$0")/../.env" << EOL
API_URL=https://${API_URL}.execute-api.eu-north-1.amazonaws.com/prod
USER_POOL_ID=${USER_POOL_ID}
CLIENT_ID=${CLIENT_ID}
CLIENT_SECRET=${CLIENT_SECRET}
COGNITO_DOMAIN=https://${USER_POOL_ID}.auth.eu-north-1.amazoncognito.com
API_KEY=${API_KEY}
EOL

echo "✅ Credentials saved to .env file" 