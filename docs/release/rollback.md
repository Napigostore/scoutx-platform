# Hướng dẫn Hoàn tác (Rollback Guide)

Tài liệu hướng dẫn quy trình hoàn tác nhanh (Rollback) về phiên bản ổn định trước đó khi xảy ra sự cố nghiêm trọng trên Production.

## 1. Tiêu chí kích hoạt Rollback tự động/thủ công

Kích hoạt rollback ngay lập tức nếu phát hiện một trong các dấu hiệu sau:
- Tỷ lệ lỗi HTTP vượt quá 2% liên tục trong 5 phút.
- Độ trễ p95 tăng gấp đôi so với mức baseline thông thường.
- Pod rơi vào trạng thái `CrashLoopBackOff` hoặc bị `OOMKilled`.
- Luồng nghiệp vụ cốt lõi (Đăng nhập, Ghép cặp) bị gián đoạn hoàn toàn.

## 2. Câu lệnh thực hiện Rollback

Thực hiện hoàn tác nhanh Deployment về revision ổn định gần nhất:
```bash
kubectl rollout undo deployment/scoutx-web -n scoutx-production
```

Theo dõi trạng thái hoàn tác:
```bash
kubectl rollout status deployment/scoutx-web -n scoutx-production --timeout=300s
```
