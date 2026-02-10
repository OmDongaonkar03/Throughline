#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run build

echo "Running database migrations..."
npx prisma migrate deploy

echo "Build completed successfully!"