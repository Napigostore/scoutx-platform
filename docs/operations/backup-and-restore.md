# Hướng dẫn Sao lưu & Khôi phục Dữ liệu (Backup & Restore Guide)

Tài liệu này hướng dẫn quy trình sao lưu và khôi phục cơ sở dữ liệu PostgreSQL cho ScoutX Platform nhằm đảm bảo an toàn dữ liệu và sẵn sàng cho các tình huống khôi phục sau thảm họa (Disaster Recovery).

## 1. Sao lưu dữ liệu (Backup)

Sử dụng script `backup.sh` để tiến hành sao lưu cơ sở dữ liệu ra file SQL:
```bash
chmod +x deploy/backup/backup.sh
./deploy/backup/backup.sh <db_host> <db_user> <db_name> <backup_dir>
```

Ví dụ chạy cục bộ:
```bash
./deploy/backup/backup.sh localhost postgres scoutx ./backups
```

## 2. Khôi phục dữ liệu (Restore)

Sử dụng script `restore.sh` để khôi phục dữ liệu từ một file sao lưu có sẵn:
```bash
chmod +x deploy/backup/restore.sh
./deploy/backup/restore.sh <db_host> <db_user> <db_name> <backup_file_path>
```

Ví dụ chạy cục bộ:
```bash
./deploy/backup/restore.sh localhost postgres scoutx ./backups/scoutx_backup_20231027_120000.sql
```
