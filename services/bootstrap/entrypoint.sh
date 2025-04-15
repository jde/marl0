#!/bin/sh
set -e

echo "⏳ Waiting for Postgres to be ready..."
until pg_isready -h postgres -U "$POSTGRES_USER" > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Postgres is available. Creating user (if needed)..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /bootstrap/init.sql

echo "🔍 Checking for database 'marl0'..."
DB_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = 'marl0'" || true)

if [ "$DB_EXISTS" != "1" ]; then
  echo "📦 Creating database 'marl0' owned by 'marl0'..."
  PGPASSWORD=$POSTGRES_PASSWORD createdb -h postgres -U "$POSTGRES_USER" -O marl0 marl0
else
  echo "✅ Database 'marl0' already exists."
fi

echo "🎉 Bootstrap complete. Exiting."
