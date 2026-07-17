# Hướng dẫn phát hành Production (Production Release Guide)

Tài liệu hướng dẫn quy trình phát hành ScoutX Platform lên môi trường Production một cách an toàn và có kiểm soát.

## 1. Nguyên tắc phát hành

- **Build Once, Promote Everywhere**: Sử dụng chính xác Docker image digest đã được kiểm chứng thành công trên môi trường Staging. Tuyệt đối không rebuild lại mã nguồn.
- **Manual Approval**: Yêu cầu phê duyệt thủ công trên GitHub Actions trước khi kích hoạt job deploy Production.
- **Zero-Downtime**: Sử dụng chiến lược Rolling Update (`maxUnavailable: 0`, `maxSurge: 1`) để đảm bảo không có thời gian chết.

## 2. Các bước triển khai

1. Chạy migration database:
   ```bash
   kubectl apply -n scoutx-production -f deploy/kubernetes/base/migration-job.yaml
   ```
2. Triển khai ứng dụng:
   ```bash
   kubectl apply -k deploy/kubernetes/overlays/production
   ```
3. Theo dõi trạng thái rollout:
   ```bash
   kubectl rollout status deployment/scoutx-web -n scoutx-production
   ```
