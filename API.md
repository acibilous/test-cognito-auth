# API Documentation

## Authentication

### 1. Set env.example to .env and run

```bash
source .env
```

### 2. Generate Client Credentials

```bash
npm run get-creds --workspace=ci 
```

You will get

```
📝 Getting Cognito credentials...
Debug: Getting clients for pool eu-north-1_MT5t4z8zU
User Pool ID: eu-north-1_MT5t4z8zU
Client ID: 289ecvjttfc5nl25d6n7kp0mdl
Client Secret: nglang61u4fnn8h8ulb8mh8ep6o6m7lofrv89ve5lghvel7t958
Domain: https://eu-north-1_MT5t4z8zU.auth.eu-north-1.amazoncognito.com

📝 Getting API Key...
API Key: UFzcxI9pur4HOEse4DkVa4ON9JRKwlDI8FjKLveB
```

### 2. Test x-api-key

```bash
curl -X GET \
  -H "x-api-key: UFzcxI9pur4HOEse4DkVa4ON9JRKwlDI8FjKLveB" \
  "https://feyosqvdj9.execute-api.eu-north-1.amazonaws.com/prod/users"
```

### 3. Get Access Token using Client ID and Client Secret

```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=289ecvjttfc5nl25d6n7kp0mdl&client_secret=nglang61u4fnn8h8ulb8mh8ep6o6m7lofrv89ve5lghvel7t958" \
  "https://nitro-app.auth.eu-north-1.amazoncognito.com/oauth2/token"
```

in response you will get

```json
{"access_token":"eyJraWQiOiI2RzFXVThPbzdqUkJrNWVJRjRFdW14cmFFOW9hbkRpZGVjRDdhVGZtWWh3PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyODllY3ZqdHRmYzVubDI1ZDZuN2twMG1kbCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXBpXC93cml0ZSIsImF1dGhfdGltZSI6MTczNjQ2OTA4OCwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LW5vcnRoLTEuYW1hem9uYXdzLmNvbVwvZXUtbm9ydGgtMV9NVDV0NHo4elUiLCJleHAiOjE3MzY0NzI2ODgsImlhdCI6MTczNjQ2OTA4OCwidmVyc2lvbiI6MiwianRpIjoiYWIxN2U4NWUtMjdhMS00M2I4LWJlZjktZTQ5YTA2N2Q4YjQ3IiwiY2xpZW50X2lkIjoiMjg5ZWN2anR0ZmM1bmwyNWQ2bjdrcDBtZGwifQ.A8xsi8uno5fAtA-LPqa-FwCrk9KJlhVsxFQ3FmTGH7Aka0HcZ4JPHJbZOsEL0-14u-gFelzRg8VklutNVjaa_Ut3Y_JaOQOv7nDPHeRqAic60Fh_aIRsaV0YQr8jMQP0EBwKMQqTEdB1hqo9ofwfDU_FoR1CTOt6NKa6DQzu5Xb79mqIcoafEgWgGTAvCuqEbPQ8dXriReRBk1pVymClPTl0-J2rNhA6n1P58O7Gu-N2nHxtpdBLlmNc2kkIX5Xs3GQSAAQeCl3CP4XBnIP79ebBLbiSPntYZoXHuZER5tjLsA7mLtaMYYDh7JlGTfPsgCZiqC9PsSeW5szgMYl1mw","expires_in":3600,"token_type":"Bearer"}
```

## 4. Test Access Token for POST /users

```bash
curl -X POST \
  -H "Authorization: Bearer eyJraWQiOiI2RzFXVThPbzdqUkJrNWVJRjRFdW14cmFFOW9hbkRpZGVjRDdhVGZtWWh3PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyODllY3ZqdHRmYzVubDI1ZDZuN2twMG1kbCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXBpXC93cml0ZSIsImF1dGhfdGltZSI6MTczNjQ2OTA4OCwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LW5vcnRoLTEuYW1hem9uYXdzLmNvbVwvZXUtbm9ydGgtMV9NVDV0NHo4elUiLCJleHAiOjE3MzY0NzI2ODgsImlhdCI6MTczNjQ2OTA4OCwidmVyc2lvbiI6MiwianRpIjoiYWIxN2U4NWUtMjdhMS00M2I4LWJlZjktZTQ5YTA2N2Q4YjQ3IiwiY2xpZW50X2lkIjoiMjg5ZWN2anR0ZmM1bmwyNWQ2bjdrcDBtZGwifQ.A8xsi8uno5fAtA-LPqa-FwCrk9KJlhVsxFQ3FmTGH7Aka0HcZ4JPHJbZOsEL0-14u-gFelzRg8VklutNVjaa_Ut3Y_JaOQOv7nDPHeRqAic60Fh_aIRsaV0YQr8jMQP0EBwKMQqTEdB1hqo9ofwfDU_FoR1CTOt6NKa6DQzu5Xb79mqIcoafEgWgGTAvCuqEbPQ8dXriReRBk1pVymClPTl0-J2rNhA6n1P58O7Gu-N2nHxtpdBLlmNc2kkIX5Xs3GQSAAQeCl3CP4XBnIP79ebBLbiSPntYZoXHuZER5tjLsA7mLtaMYYDh7JlGTfPsgCZiqC9PsSeW5szgMYl1mw" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}' \
  "https://feyosqvdj9.execute-api.eu-north-1.amazonaws.com/prod/users"
```

You will get

```json
{"id":"567d8696-0054-4c96-b77a-433cb6051cf7","name":"John Doe"}
```
