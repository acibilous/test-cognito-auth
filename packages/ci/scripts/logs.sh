#!/bin/bash
source ../../.env

# Отримуємо останній лог стрім
LOG_STREAM=$(aws logs describe-log-streams \
  --log-group-name "/aws/ecs/nitro-app" \
  --order-by LastEventTime \
  --descending \
  --limit 1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

# Дивимось логи
aws logs get-log-events \
  --log-group-name "/aws/ecs/nitro-app" \
  --log-stream-name "$LOG_STREAM" \
  --output json 