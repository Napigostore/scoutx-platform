# Danh sách kiểm tra mức độ sẵn sàng vận hành (Production Readiness Checklist)

Tài liệu này cung cấp danh sách các hạng mục bắt buộc phải hoàn thành và kiểm chứng trước khi đưa ScoutX Platform vào vận hành chính thức trên môi trường Production.

## 1. Hạ tầng & Triển khai (Infrastructure & Deployment)
- [x] Dockerfile sử dụng multi-stage build tối ưu và tài khoản non-root.
- [x] Kubernetes manifests được quản lý đa môi trường bằng Kustomize.
- [x] Thiết lập cơ chế tự động co giãn Horizontal Pod Autoscaler (HPA).
- [x] Thiết lập Pod Disruption Budget (PDB) để đảm bảo tính sẵn sàng khi bảo trì node.

## 2. Giám sát & Cảnh báo (Observability & Alerting)
- [x] Tích hợp OpenTelemetry Collector để thu thập logs, metrics, và traces.
- [x] Thiết lập các quy tắc cảnh báo tự động (Alerting Rules) trong Prometheus.
- [x] Xây dựng đầy đủ các Runbooks hướng dẫn xử lý sự cố nhanh.

## 3. An toàn dữ liệu & Bảo mật (Data Safety & Security)
- [x] Thiết lập và kiểm chứng thành công quy trình Sao lưu & Khôi phục dữ liệu (Backup & Restore).
- [x] Quét lỗ hổng bảo mật Docker image bằng Trivy đạt kết quả an toàn.
- [x] Sinh thành công tài liệu SBOM chuẩn CycloneDX.
