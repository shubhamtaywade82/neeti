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
      return
    fi
    sleep 1
  done
  echo "Database at ${DB_HOST}:${DB_PORT} did not become ready in time" >&2
  return 1
}

echo "Waiting for database..."
wait_for_db

echo "Starting worker command..."
exec "$@"
