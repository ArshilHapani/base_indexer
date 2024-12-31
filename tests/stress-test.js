import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 50 users
    { duration: '1m', target: 70 }, // Stay at 50 users
    { duration: '30s', target: 10 }, // Ramp down
    {
      duration: '10s',
      target: 0,
    },
  ],
};

export default function () {
  const res = http.get(
    'http://localhost:5000/api/v1/tokens/0xca4569949699d56e1834efe9f58747ca0f151b01'
  );
  check(res, { 'status was 200': (r) => r.status == 200 });
  // sleep()
}
