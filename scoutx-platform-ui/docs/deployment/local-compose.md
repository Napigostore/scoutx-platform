# Docker Compose cục bộ (Local Compose)

Tài liệu hướng dẫn sử dụng Docker Compose để chạy thử nghiệm tích hợp toàn bộ hệ thống ScoutX cục bộ.

## Khởi động dịch vụ

```bash
docker compose up -d
```

## Kiểm tra trạng thái các container

```bash
docker compose ps
```

## Xem logs của ứng dụng

```bash
docker compose logs web --tail=100
```
