# Kiến trúc Kubernetes (Kubernetes Architecture)

Tài liệu này mô tả chi tiết kiến trúc triển khai ScoutX Platform trên nền tảng Kubernetes.

## 1. Cấu trúc thư mục Manifests

Hệ thống sử dụng **Kustomize** để quản lý cấu hình đa môi trường:
- `base/`: Chứa các tài nguyên cốt lõi dùng chung (Deployment, Service, ConfigMap, HPA, PDB, NetworkPolicy, Migration Job).
- `overlays/staging/`: Cấu hình tối ưu cho môi trường Staging (1 replica, tài nguyên thấp, log level debug).
- `overlays/production/`: Cấu hình tối ưu cho môi trường Production (tối thiểu 2 replicas, HPA, PDB, TLS Ingress).

## 2. Bảo mật Container (Container Security)

- Chạy dưới quyền tài khoản non-root (`runAsNonRoot: true`, UID/GID `1001`).
- Hệ thống tệp tin gốc ở chế độ chỉ đọc (`readOnlyRootFilesystem: true`).
- Loại bỏ toàn bộ Linux capabilities (`capabilities.drop: ["ALL"]`).
- Sử dụng seccomp profile mặc định (`RuntimeDefault`).
