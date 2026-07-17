# Kịch bản Kiểm thử Tải (Load Testing Scenarios)

Tài liệu này hướng dẫn cách chạy kịch bản kiểm thử tải (Load Testing) cho ScoutX Platform sử dụng công cụ **K6**.

## 1. Cài đặt K6

Tải và cài đặt K6 theo hệ điều hành của bạn:
- **Windows (PowerShell)**:
  ```powershell
  winget install grafana.k6
  ```
- **macOS**:
  ```bash
  brew install k6
  ```
- **Linux**:
  ```bash
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5DCC117B301150D
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.bintray.com/loadimpact/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

## 2. Chạy kịch bản kiểm thử tải

Chạy kịch bản kiểm thử tải hướng tới môi trường local hoặc staging:
```bash
k6 run -e BASE_URL=http://localhost:3000 tests/load/k6-load-test.js
```
