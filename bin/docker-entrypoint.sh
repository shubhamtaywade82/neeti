#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-neeti}"
DB_PASS="${POSTGRES_PASSWORD:-neeti_dev}"
DB_NAME="${POSTGRES_DB:-neeti_development}"

wait_for_db() {
  for i in {1..60}; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Database at ${DB_HOST}:${DB_PORT} did not become ready in time" >&2
  return 1
}

echo "Waiting for database..."
wait_for_db

echo "Creating database if missing..."
if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" | grep -q 1; then
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"
fi

echo "Running migrations..."
exec 9>/tmp/migrate.lock
flock -x 9
bundle exec rails solid_queue:install 2>/dev/null || true
bundle exec rails db:migrate

echo "Removing stale server pid if present..."
rm -f tmp/pids/server.pid

echo "Starting command..."
exec "$@"