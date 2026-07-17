# Hướng dẫn triển khai Staging (Staging Deployment Guide)

Tài liệu hướng dẫn chi tiết các bước triển khai và cấu hình ScoutX Platform trên môi trường Staging.

## 1. Chuẩn bị môi trường

Đảm bảo bạn đang kết nối đúng tới cụm Kubernetes Staging:
```bash
kubectl config current-context
```

Tạo namespace nếu chưa tồn tại:
```bash
kubectl create namespace scoutx-staging
```

## 2. Triển khai ứng dụng

Sử dụng Kustomize để áp dụng cấu hình Staging:
```bash
kubectl apply -k deploy/kubernetes/overlays/staging
```

Theo dõi trạng thái rollout:
```bash
kubectl rollout status deployment/scoutx-web -n scoutx-staging
```
