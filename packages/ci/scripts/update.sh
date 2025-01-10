#!/bin/bash
source ../../.env

echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster nitro-app-cluster \
  --service $(aws ecs list-services --cluster nitro-app-cluster --query 'serviceArns[0]' --output text | cut -d'/' -f3) \
  --force-new-deployment \
  --no-cli-pager

echo "⏳ Waiting for service to start..."
sleep 30

echo "✅ Update complete!" 