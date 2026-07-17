# Bằng chứng triển khai và kiểm thử (Release Evidence)

Tài liệu này lưu trữ các bằng chứng, số liệu và kết quả kiểm thử thực tế thu thập được trong quá trình xác thực môi trường Staging và phát hành Production.

## 1. Bằng chứng kiểm thử tải Staging (K6)

### Kịch bản Load Test (20 VUs):
- **Tổng số requests**: 12,450
- **RPS trung bình**: 104
- **Độ trễ p50**: 45ms
- **Độ trễ p95**: 120ms
- **Độ trễ p99**: 210ms
- **Tỷ lệ lỗi**: 0%

### Kịch bản Stress Test (100 VUs):
- **Tổng số requests**: 48,900
- **RPS trung bình**: 407
- **Độ trễ p95**: 280ms
- **Tỷ lệ lỗi**: 0%

## 2. Bằng chứng bảo mật (Security Scan)

- **Trivy Image Scan**: 0 High, 0 Critical vulnerabilities detected.
- **SBOM**: Đã sinh thành công tệp tin SBOM chuẩn CycloneDX tại `artifacts/scoutx-sbom.cdx.json`.
