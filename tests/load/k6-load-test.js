import http from "k6/http";
import { check, sleep } from "k6";

// Define different testing profiles based on the SCENARIO environment variable
const profile = __ENV.SCENARIO || "load";

let selectedStages = [
  { duration: "30s", target: 20 }, // Default Load Test: Ramp-up to 20 users
  { duration: "1m", target: 20 }, // Stay at 20 users
  { duration: "30s", target: 0 }, // Ramp-down
];

if (profile === "stress") {
  selectedStages = [
    { duration: "1m", target: 50 }, // Ramp-up to 50 users
    { duration: "2m", target: 50 }, // Stay at 50 users
    { duration: "1m", target: 100 }, // Ramp-up to 100 users (Stress point)
    { duration: "2m", target: 100 }, // Stay at 100 users
    { duration: "1m", target: 0 }, // Ramp-down
  ];
} else if (profile === "spike") {
  selectedStages = [
    { duration: "10s", target: 10 }, // Normal baseline
    { duration: "10s", target: 150 }, // Sudden spike to 150 users
    { duration: "30s", target: 150 }, // Stay at spike
    { duration: "10s", target: 10 }, // Sudden drop
    { duration: "30s", target: 0 }, // Ramp-down
  ];
} else if (profile === "soak") {
  selectedStages = [
    { duration: "2m", target: 30 }, // Ramp-up to 30 users
    { duration: "4h", target: 30 }, // Stay at 30 users for 4 hours (Soak test)
    { duration: "2m", target: 0 }, // Ramp-down
  ];
}

export const options = {
  stages: selectedStages,
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.01"], // Error rate must be less than 1%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

  // 1. Test Liveness Endpoint
  const liveRes = http.get(`${baseUrl}/api/health/live`);
  check(liveRes, {
    "liveness status is 200": (r) => r.status === 200,
    "liveness status is ok": (r) => r.json().status === "ok",
  });

  sleep(1);

  // 2. Test Readiness Endpoint
  const readyRes = http.get(`${baseUrl}/api/health/ready`);
  check(readyRes, {
    "readiness status is 200": (r) => r.status === 200,
    "readiness status is ok": (r) => r.json().status === "ok",
  });

  sleep(1);
}
