# Tài liệu CI/CD (CI/CD Documentation)

Hệ thống CI/CD của ScoutX được xây dựng hoàn toàn trên nền tảng **GitHub Actions** nhằm tự động hóa tối đa quy trình kiểm tra chất lượng và phát hành sản phẩm.

## 1. Các Workflows chính

- **CI Pipeline (`ci.yml`)**: Chạy tự động trên mỗi Pull Request và Push vào nhánh `main`. Thực hiện cài đặt, kiểm tra cú pháp (Lint), kiểm tra kiểu dữ liệu (Typecheck), chạy Unit Tests và biên dịch dự án (Build).
- **Security Scan (`security.yml`)**: Quét các lỗ hổng bảo mật trong các gói phụ thuộc bằng `npm audit` ở mức độ High/Critical.
- **Release Pipeline (`release.yml`)**: Tự động hóa quy trình phát hành phiên bản mới khi mã nguồn được merge vào nhánh `main`.
