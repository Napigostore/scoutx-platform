#!/bin/bash
# ScoutX PostgreSQL Restore Script
# Usage: ./restore.sh <db_host> <db_user> <db_name> <backup_file_path>

DB_HOST=${1:-"localhost"}
DB_USER=${2:-"postgres"}
DB_NAME=${3:-"scoutx"}
BACKUP_FILE=$4

if [ -z "$BACKUP_FILE" ]; then
  echo "Error: Backup file path is required!"
  echo "Usage: ./restore.sh <db_host> <db_user> <db_name> <backup_file_path>"
  exit 1
fi

echo "Starting restore for database '$DB_NAME' from file '$BACKUP_FILE'..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Restore completed successfully!"
else
  echo "Error: Restore failed!"
  exit 1
fi
