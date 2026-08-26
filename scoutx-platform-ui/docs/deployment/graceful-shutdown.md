# Graceful Shutdown

ScoutX Platform hỗ trợ tắt ứng dụng một cách an toàn (Graceful Shutdown) khi nhận được tín hiệu `SIGTERM` hoặc `SIGINT` từ hệ điều hành hoặc container orchestrator.

## Quy trình tắt an toàn

1. Nhận tín hiệu `SIGTERM` / `SIGINT`.
2. Ngừng tiếp nhận các kết nối mới.
3. Hoàn thành các request đang xử lý dở dang.
4. Đóng kết nối cơ sở dữ liệu Prisma một cách an toàn.
5. Giải phóng các tài nguyên chạy ngầm và thoát tiến trình.
