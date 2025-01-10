# Test Cognito Auth

This project demonstrates AWS Cognito authentication implementation with API Gateway and ECS Fargate.

## Architecture

- **API Gateway**: REST API with Cognito authorizer
- **Cognito**: User Pool with client credentials flow
- **ECS Fargate**: Running Nitro application
- **Aurora PostgreSQL**: Database for user management
- **CDK**: Infrastructure as code

## Project Structure

```
.
├── packages/
│   ├── ci/                 # CDK and deployment scripts
│   │   ├── cdk/           # CDK infrastructure code
│   │   └── scripts/       # Deployment and utility scripts
│   └── nitro-app/         # Nitro application
├── API.md                 # API documentation and examples
└── README.md             # This file
```

## Authentication Types

1. **Client Credentials Flow** (POST /users)
   - Uses Cognito OAuth2 token
   - Scope: api/write
   - Required for creating users

2. **API Key** (GET, PUT, DELETE /users)
   - Simple API key authentication
   - Required for all other endpoints

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your AWS credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
```

3. Bootstrap CDK (first time only):
```bash
npm run cdk:bootstrap --workspace=ci
```

4. Deploy the stack:
```bash
npm run deploy --workspace=ci
```

5. Get credentials:
```bash
npm run get-creds --workspace=ci
```

6. Follow [API.md](API.md) for testing the endpoints

## Development

### Available Commands

#### CDK Commands
- **Bootstrap CDK**: `npm run cdk:bootstrap --workspace=ci`
- **Deploy CDK**: `npm run cdk:deploy --workspace=ci`
- **Destroy Stack**: `npm run cdk:destroy --workspace=ci`

#### Build & Deploy
- **Build**: `npm run build --workspace=ci`
- **Deploy**: `npm run deploy --workspace=ci`

#### Monitoring & Maintenance
- **View logs**: `npm run logs --workspace=ci`
- **Cleanup**: `npm run cleanup --workspace=ci`
- **Get credentials**: `npm run get-creds --workspace=ci`

### Development Workflow

1. Bootstrap CDK (first time only):
   ```bash
   npm run cdk:bootstrap --workspace=ci
   ```

2. Build and deploy:
   ```bash
   # Create infrastructure

   npm run deploy --workspace=ci


   # Build docker image, push it to ECR update ECS service to use it
   # Needed to update ECS service to use the new image instead of the nginx dummy image

   npm run build --workspace=ci
   ```

3. Get credentials:
   ```bash
   npm run get-creds --workspace=ci
   ```

4. Monitor logs:
   ```bash
   npm run logs --workspace=ci
   ```

5. Cleanup when done:
   ```bash
   npm run cleanup --workspace=ci
   # or destroy stack completely
   npm run cdk:destroy --workspace=ci
   ```

## Security

- `.env` files are git-ignored
- Use `get-creds` script to get fresh credentials
- API keys and secrets are managed by AWS

## License

MIT 