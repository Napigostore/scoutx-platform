# Quy trình phát hành (Release Process)

Tài liệu này mô tả quy trình phát hành tự động của ScoutX Platform sử dụng Semantic Versioning và GitHub Actions.

## 1. Semantic Versioning (SemVer)

ScoutX tuân thủ chuẩn SemVer `MAJOR.MINOR.PATCH`:
- **MAJOR**: Thay đổi không tương thích ngược (breaking changes).
- **MINOR**: Thêm tính năng mới tương thích ngược (backward-compatible features).
- **PATCH**: Sửa lỗi tương thích ngược (backward-compatible bug fixes).

## 2. Quy trình phát hành tự động

Mỗi khi một Pull Request được merge vào nhánh `main`:
1. **CI Pipeline** chạy để kiểm tra chất lượng (Lint, Typecheck, Test, Build).
2. **Release Pipeline** tự động phân tích các commit message để xác định phiên bản tiếp theo.
3. Tạo Git Tag mới và tự động tạo GitHub Release kèm theo Changelog chi tiết.
