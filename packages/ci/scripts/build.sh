#!/bin/bash
source ../../.env

# Get AWS account ID if not set
if [ -z "$AWS_ACCOUNT_ID" ]; then
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
fi

# Build and push image
echo "🏗️ Building image..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build -t nitro-app ../../packages/nitro-app

echo "🔑 Logging in to ECR..."
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com

echo "🏷️ Tagging image..."
docker tag nitro-app:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nitro-app:latest

# Перевіряємо архітектуру образу
echo "🔍 Checking image architecture..."
docker inspect nitro-app:latest --format='{{.Architecture}}'

echo "⬆️ Pushing image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nitro-app:latest

# Оновлюємо таск дефініцію
echo "📝 Updating task definition..."
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $(aws ecs describe-services \
    --cluster nitro-app-cluster \
    --services $(aws ecs list-services --cluster nitro-app-cluster --query 'serviceArns[0]' --output text | cut -d'/' -f3) \
    --query 'services[0].taskDefinition' \
    --output text) \
  --query 'taskDefinition' \
  --output json)

# Змінюємо image і containerPort в таск дефініції
NEW_TASK_DEF=$(echo $TASK_DEF | jq \
  --arg IMAGE "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nitro-app:latest" \
  '.containerDefinitions[0].image = $IMAGE | 
   .containerDefinitions[0].portMappings[0].containerPort = 80 |
   .containerDefinitions[0].portMappings[0].hostPort = 80')

# Реєструємо нову таск дефініцію
aws ecs register-task-definition \
  --family $(echo $TASK_DEF | jq -r '.family') \
  --container-definitions "$(echo $NEW_TASK_DEF | jq '.containerDefinitions')" \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu $(echo $TASK_DEF | jq -r '.cpu') \
  --memory $(echo $TASK_DEF | jq -r '.memory') \
  --execution-role-arn $(echo $TASK_DEF | jq -r '.executionRoleArn') \
  --task-role-arn $(echo $TASK_DEF | jq -r '.taskRoleArn') \
  --no-cli-pager

# Оновлюємо сервіс з новою таск дефініцією
echo "🔄 Updating service..."
aws ecs update-service \
  --cluster nitro-app-cluster \
  --service $(aws ecs list-services --cluster nitro-app-cluster --query 'serviceArns[0]' --output text | cut -d'/' -f3) \
  --task-definition $(aws ecs describe-task-definition \
    --task-definition $(echo $TASK_DEF | jq -r '.family') \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text) \
  --force-new-deployment \
  --no-cli-pager

# Після оновлення сервісу
echo "⏳ Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster nitro-app-cluster \
  --services $(aws ecs list-services --cluster nitro-app-cluster --query 'serviceArns[0]' --output text | cut -d'/' -f3)

# Перевіряємо що всі таски використовують новий образ
echo "🔍 Checking running tasks..."
aws ecs list-tasks \
  --cluster nitro-app-cluster \
  --desired-status RUNNING \
  --query 'taskArns[]' \
  --output text | tr '\t' '\n' | while read -r task; do
    aws ecs describe-tasks \
      --cluster nitro-app-cluster \
      --tasks $task \
      --query 'tasks[].containers[].image' \
      --output text \
      --no-cli-pager
done

echo "✅ Build complete!" 