# Quy trình phê duyệt phát hành (Release Approval Process)

Tài liệu này quy định các bước phê duyệt bắt buộc trước khi tiến hành phát hành ScoutX Platform lên môi trường Production.

## 1. Các tiêu chí thông qua (Release Gates)

Một phiên bản Release Candidate (RC) chỉ được phép phát hành lên Production khi đạt đầy đủ các tiêu chí sau:
- **CI Pipeline**: Vượt qua tất cả các bước kiểm tra tĩnh (Lint, Typecheck, Build, Unit Tests).
- **Security Scan**: Không có lỗ hổng bảo mật mức độ High hoặc Critical chưa được xử lý.
- **Staging Validation**: Hoàn thành toàn bộ các bài kiểm thử Smoke, E2E, và Load Tests trên môi trường Staging với kết quả đạt SLO.
- **Rollback Test**: Xác minh quy trình hoàn tác hoạt động ổn định dưới 30 giây.

## 2. Quy trình phê duyệt thủ công (Manual Approval)

Việc triển khai lên Production yêu cầu sự phê duyệt thủ công từ đại diện các bên liên quan (Release Owner, Tech Lead, Security Officer) thông qua tính năng **GitHub Environments Approval**.
