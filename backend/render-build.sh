#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run build

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Build completed successfully!"