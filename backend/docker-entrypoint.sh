#!/bin/sh
set -e

# Wait for the PostgreSQL database to be online
echo "Waiting for PostgreSQL database at $DB_HOST:$DB_PORT..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME"; do
  echo "PostgreSQL is unavailable - sleeping..."
  sleep 2
done

echo "PostgreSQL is up! Running migrations..."
php artisan migrate --force

# If custom command is passed (e.g. from docker-compose command override), run it
if [ $# -gt 0 ]; then
  echo "Executing command: $@"
  exec "$@"
else
  echo "Starting Apache..."
  exec apache2-foreground
fi
