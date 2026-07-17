# Chiến lược nhánh (Branching Strategy)

ScoutX sử dụng chiến lược nhánh **GitHub Flow** tinh giản và hiệu quả để đảm bảo tốc độ phát triển nhanh và chất lượng mã nguồn cao.

## 1. Nhánh chính (`main`)

- Nhánh `main` luôn ở trạng thái sẵn sàng phát hành (production-ready).
- Không commit trực tiếp lên nhánh `main`. Mọi thay đổi phải thông qua Pull Request (PR).

## 2. Nhánh tính năng (`feature/*` hoặc `bugfix/*`)

- Tạo nhánh mới từ `main` cho mỗi tính năng hoặc sửa lỗi:
  - Tính năng mới: `feature/ten-tinh-nang`
  - Sửa lỗi: `bugfix/ten-loi`
- Đảm bảo viết commit message theo chuẩn **Conventional Commits** (ví dụ: `feat(auth): ...`, `fix(perf): ...`).
