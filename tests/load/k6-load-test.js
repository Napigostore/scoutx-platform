import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // 1. Test Liveness Endpoint
  const liveRes = http.get(`${baseUrl}/api/health/live`);
  check(liveRes, {
    'liveness status is 200': (r) => r.status === 200,
    'liveness status is ok': (r) => r.json().status === 'ok',
  });

  sleep(1);

  // 2. Test Readiness Endpoint
  const readyRes = http.get(`${baseUrl}/api/health/ready`);
  check(readyRes, {
    'readiness status is 200': (r) => r.status === 200,
    'readiness status is ok': (r) => r.json().status === 'ok',
  });

  sleep(1);
}
