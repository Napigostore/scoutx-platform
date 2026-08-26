# Kiến trúc Giám sát & Quan sát (Observability Architecture)

Tài liệu này mô tả kiến trúc giám sát, thu thập dữ liệu logs, metrics và traces của ScoutX Platform.

## 1. Các thành phần chính

- **Structured Logging**: Toàn bộ logs được ghi ra dưới dạng JSON một dòng (Single-line JSON) ra `stdout`/`stderr` để các công cụ thu thập logs (như Loki, FluentBit) dễ dàng xử lý.
- **Metrics**: Thu thập các chỉ số hiệu năng quan trọng (HTTP request rate, latency, error rate, database query duration) và expose qua định dạng Prometheus.
- **Distributed Tracing**: Sử dụng OpenTelemetry để theo dõi luồng xử lý của request đi qua các lớp dịch vụ (Application, Domain, Infrastructure).
