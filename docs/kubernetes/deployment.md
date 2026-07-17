# Hướng dẫn triển khai (Deployment Guide)

Tài liệu hướng dẫn các bước triển khai ScoutX Platform lên cụm Kubernetes.

## 1. Tạo Secrets

Trước khi triển khai, cần tạo Secret chứa các thông tin nhạy cảm:
```bash
kubectl create secret generic scoutx-runtime \
  --from-literal=DATABASE_URL="postgresql://postgres:postgres@db:5432/scoutx?schema=public" \
  --from-literal=JWT_SECRET="super-long-secret-key-123456" \
  -n scoutx-staging
```

## 2. Triển khai bằng Kustomize

### Môi trường Staging:
```bash
kubectl apply -k deploy/kubernetes/overlays/staging
```

### Môi trường Production:
```bash
kubectl apply -k deploy/kubernetes/overlays/production
```

## 3. Quy trình Rollback (Hoàn tác)

Nếu phiên bản mới gặp sự cố, thực hiện hoàn tác nhanh về phiên bản ổn định trước đó:
```bash
kubectl rollout undo deployment/scoutx-web -n scoutx-staging
```
