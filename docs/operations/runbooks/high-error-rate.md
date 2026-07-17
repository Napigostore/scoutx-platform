# Sổ tay vận hành: Tỷ lệ lỗi HTTP cao (High Error Rate Runbook)

## 1. Tác động (Impact)
- Người dùng gặp lỗi khi truy cập hệ thống hoặc thực hiện các tác vụ (đăng nhập, tìm kiếm, ghép cặp).

## 2. Các bước kiểm tra nhanh (Immediate Checks)
- Kiểm tra logs của container `web` để xác định mã lỗi (500, 503, v.v.):
  ```bash
  docker compose logs web --tail=100
  ```
- Kiểm tra kết nối cơ sở dữ liệu PostgreSQL.

## 3. Biện pháp khắc phục (Mitigation)
- Khởi động lại container nếu bị treo:
  ```bash
  docker compose restart web
  ```
- Hoàn tác (Rollback) về phiên bản ổn định trước đó nếu lỗi xảy ra ngay sau khi deploy.
