#!/bin/bash
source ../../.env

echo "🚀 Deploying CDK stack..."
cdk deploy --require-approval never

echo "🔄 Updating ECS service to use new image..."
aws ecs update-service \
  --cluster nitro-app-cluster \
  --service $(aws ecs list-services --cluster nitro-app-cluster --query 'serviceArns[0]' --output text | cut -d'/' -f3) \
  --force-new-deployment \
  --no-cli-pager

echo "⏳ Waiting for service to start..."
sleep 30

echo "📝 Getting service URL..."
aws cloudformation describe-stacks \
  --stack-name NitroAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --no-cli-pager

echo "✅ Deployment complete!" 