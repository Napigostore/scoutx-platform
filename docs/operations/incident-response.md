# Quy trình ứng phó sự cố (Incident Response Process)

Tài liệu này quy định quy trình tiếp nhận, phân loại, xử lý và khắc phục các sự cố vận hành trên môi trường Production của ScoutX Platform.

## 1. Phân loại mức độ nghiêm trọng (Severity Levels)

- **SEV-1 (Critical Outage)**: Hệ thống bị sập hoàn toàn hoặc dữ liệu cốt lõi bị ảnh hưởng nghiêm trọng. Yêu cầu xử lý ngay lập tức (24/7).
- **SEV-2 (Major Degradation)**: Một tính năng chính (như Đăng nhập hoặc Ghép cặp) bị hỏng nhưng hệ thống vẫn hoạt động một phần.
- **SEV-3 (Minor Degradation)**: Hệ thống bị chậm hoặc gặp lỗi nhỏ không ảnh hưởng trực tiếp đến trải nghiệm cốt lõi của người dùng.
- **SEV-4 (Low/Warning)**: Các cảnh báo hoặc yêu cầu bảo trì thông thường.

## 2. Quy trình xử lý sự cố

1. **Phát hiện (Detection)**: Sự cố được phát hiện qua hệ thống cảnh báo tự động (Prometheus Alerts) hoặc báo cáo từ người dùng.
2. **Phân công (Assignment)**: Chỉ định rõ vai trò xử lý:
   - **Incident Commander**: Điều phối chung và giao tiếp với các bên liên quan.
   - **Technical Lead**: Trực tiếp chẩn đoán và đưa ra giải pháp kỹ thuật.
3. **Khắc phục (Mitigation)**: Áp dụng các biện pháp khắc phục nhanh (như restart container, tăng tài nguyên, hoặc thực hiện Rollback).
4. **Đánh giá sau sự cố (Postmortem)**: Tổ chức họp rút kinh nghiệm và lập tài liệu Postmortem để ngăn ngừa sự cố lặp lại.
