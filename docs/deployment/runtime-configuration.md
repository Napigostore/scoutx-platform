# Cấu hình Runtime (Runtime Configuration)

ScoutX Platform hỗ trợ cấu hình linh hoạt thông qua các biến môi trường (Environment Variables).

## Các biến môi trường chính

- `NODE_ENV`: Môi trường chạy (`development`, `production`, `test`).
- `PORT`: Cổng mạng chạy ứng dụng (mặc định `3000`).
- `DATABASE_URL`: Đường dẫn kết nối cơ sở dữ liệu PostgreSQL.
- `JWT_SECRET`: Khóa bí mật dùng để ký và xác thực JWT tokens.
