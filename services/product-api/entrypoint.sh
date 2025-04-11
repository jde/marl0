#!/bin/sh
set -e

echo "🌱 Bootstrapping product-api container..."

echo "✅ Running Prisma..."
npx prisma generate
npx prisma migrate deploy

echo "🚀 Starting server..."
exec npm run dev
