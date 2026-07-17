# Containerization & Deployment Readiness

Tài liệu này hướng dẫn cách đóng gói (containerize) và chuẩn bị triển khai ScoutX Platform bằng Docker và Docker Compose.

## 1. Dockerfile Multi-stage

Dockerfile sử dụng cơ chế multi-stage build tối ưu:
1. **base**: Cài đặt Node.js 22 và kích hoạt `pnpm` qua Corepack.
2. **dependencies**: Cài đặt các gói phụ thuộc một cách tối giản và tận dụng cache layer.
3. **builder**: Biên dịch dự án monorepo.
4. **runner**: Chạy ứng dụng Next.js dưới dạng `standalone` với tài khoản non-root (`nextjs`).

## 2. Chạy cục bộ bằng Docker Compose

Khởi động toàn bộ hệ thống (Web App + PostgreSQL Database):
```bash
docker compose up -d
```
