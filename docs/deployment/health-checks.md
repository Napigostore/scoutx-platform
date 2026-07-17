# Kiểm tra sức khỏe hệ thống (Health Checks)

Hệ thống cung cấp các HTTP endpoints chuyên biệt để giám sát trạng thái hoạt động của container.

## 1. Liveness Probe (`/api/health/live`)

- Xác nhận tiến trình (process) của ứng dụng vẫn đang hoạt động bình thường.
- Trả về HTTP `200 OK` kèm JSON.

## 2. Readiness Probe (`/api/health/ready`)

- Xác nhận ứng dụng đã sẵn sàng nhận traffic (đã kết nối thành công tới Database, Cache, v.v.).
- Trả về HTTP `200 OK` nếu sẵn sàng, hoặc `503 Service Unavailable` nếu có lỗi kết nối.
