#!/bin/bash

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Apply migrations
echo "Applying database migrations..."
npx prisma migrate dev --name init

# Optional: Seed the database with initial data
echo "Seeding database with initial data..."
npx prisma db seed