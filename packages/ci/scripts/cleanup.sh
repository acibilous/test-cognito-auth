#!/bin/bash
source ../../.env

# Get variables from AWS
CLUSTER_NAME="nitro-app-cluster"
REPOSITORY_NAME="nitro-app"

echo "🔄 Checking ECS service..."
SERVICE_NAME=$(aws ecs list-services \
  --cluster $CLUSTER_NAME \
  --query 'serviceArns[0]' \
  --output text || echo "")

if [ "$SERVICE_NAME" != "None" ] && [ ! -z "$SERVICE_NAME" ]; then
  echo "Found service: $SERVICE_NAME"
  SERVICE_NAME=$(echo $SERVICE_NAME | cut -d'/' -f3)
  
  echo "🔄 Updating service desired count to 0..."
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --desired-count 0 \
    --no-cli-pager || true

  # Видаляємо сервіс примусово
  echo "🗑️ Deleting ECS service..."
  aws ecs delete-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force \
    --no-cli-pager || true
else
  echo "No ECS service found, skipping service cleanup"
fi

echo "🗑️ Deleting ECR images..."
# Видаляємо всі образи примусово
aws ecr delete-repository \
  --repository-name $REPOSITORY_NAME \
  --force \
  --no-cli-pager || true

echo "💥 Destroying CDK stack..."
cdk destroy --force --require-approval never 