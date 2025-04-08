#!/bin/bash

set -e

# Get the absolute path of the project root (where this script is located)
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Determine environment (default to 'dev')
ENVIRONMENT=${ENVIRONMENT:-dev}

# Determine env file
ENV_FILE="$PROJECT_ROOT/.env.${ENVIRONMENT}"

# Check if the env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file '$ENV_FILE' not found!"
  exit 1
fi

echo "🚀 Running Docker Compose with environment: $ENVIRONMENT"

# Change directory to project root before running Docker Compose
cd "$PROJECT_ROOT"

# Run docker-compose with the env file
docker-compose --env-file "$ENV_FILE" "$@"
