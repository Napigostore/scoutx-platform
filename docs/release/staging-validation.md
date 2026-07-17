# Xác thực môi trường Staging (Staging Validation Guide)

Tài liệu hướng dẫn các bước kiểm thử và xác thực chất lượng phiên bản trên môi trường Staging trước khi phát hành.

## 1. Smoke Tests

Kiểm tra nhanh các endpoints sức khỏe hệ thống:
```bash
curl -f https://staging.scoutx.example.com/api/health/live
curl -f https://staging.scoutx.example.com/api/health/ready
```

## 2. End-to-End (E2E) Tests

Chạy bộ kiểm thử E2E tự động để xác minh các luồng nghiệp vụ chính:
```bash
pnpm test:e2e:staging
```

## 3. Load Tests (K6)

Chạy kiểm thử tải để đo lường hiệu năng và độ trễ:
```bash
k6 run -e BASE_URL=https://staging.scoutx.example.com -e SCENARIO=load tests/load/k6-load-test.js
```
