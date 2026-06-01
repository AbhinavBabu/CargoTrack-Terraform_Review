#!/bin/sh
set -e

# Build DATABASE_URL from individual parts if not already set.
# This supports connecting to an external PostgreSQL server (separate EC2 or RDS).
if [ -z "$DATABASE_URL" ]; then
  DB_HOST="${DATABASE_HOST:-localhost}"
  DB_PORT="${DATABASE_PORT:-5432}"
  DB_NAME="${DATABASE_NAME:-cargotrack}"
  DB_USER="${DATABASE_USER:-cargotrack}"
  DB_PASS="${DATABASE_PASSWORD:-cargotrack123}"
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  export DATABASE_URL
  echo "DATABASE_URL constructed from individual vars (host: ${DB_HOST}:${DB_PORT})"
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting CargoTrack API..."
node dist/index.js
