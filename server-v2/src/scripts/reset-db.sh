#!/bin/bash

echo "Resetting database..."

# Stop and remove containers and volumes
echo "Stopping and removing Docker containers..."
docker-compose down -v

# Start Docker containers
echo "Starting fresh Docker containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Delete existing migration files
echo "Removing old migration files..."
rm -rf src/db/migrations/*

# Generate new migrations
echo "Generating new migrations..."
npm run db:generate

# Apply migrations
echo "Applying migrations..."
npm run db:migrate

# Seed the database
echo "Seeding the database..."
npm run db:seed

echo "Database reset and initialization complete!"