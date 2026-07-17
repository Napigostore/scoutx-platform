# Giám sát sau phát hành (Post-Release Monitoring Guide)

Tài liệu hướng dẫn quy trình giám sát và đánh giá chất lượng hệ thống trong 24 - 48 giờ đầu tiên sau khi phát hành phiên bản mới.

## 1. Các mốc thời gian kiểm tra (Checkpoints)

- **T+5 phút**: Kiểm tra trạng thái các Pod (`kubectl get pods`) và tỷ lệ lỗi HTTP trên Grafana.
- **T+15 phút**: Xác nhận các chỉ số SLO về độ trễ (p95 < 500ms) và tỷ lệ lỗi (< 1%).
- **T+30 phút**: Kiểm tra kết nối cơ sở dữ liệu (Connection Pool) và tỷ lệ Cache Hit/Miss.
- **T+60 phút**: Đánh giá tổng quan logs hệ thống để phát hiện các unhandled exceptions hoặc cảnh báo bất thường.

## 2. Đánh giá SLO sau 24 - 48 giờ

Tiến hành thu thập dữ liệu và lập báo cáo đánh giá chất lượng phát hành (Release Health Report) dựa trên các chỉ số SLI/SLO thực tế để phân loại phiên bản là **Healthy**, **Degraded**, hoặc **Failed**.
