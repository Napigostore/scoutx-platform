#!/bin/bash
# ScoutX PostgreSQL Backup Script
# Usage: ./backup.sh <db_host> <db_user> <db_name> <backup_dir>

DB_HOST=${1:-"localhost"}
DB_USER=${2:-"postgres"}
DB_NAME=${3:-"scoutx"}
BACKUP_DIR=${4:-"./backups"}

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting backup for database '$DB_NAME' from host '$DB_HOST'..."
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
else
  echo "Error: Backup failed!"
  exit 1
fi
