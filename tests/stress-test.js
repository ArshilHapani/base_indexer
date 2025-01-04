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
  const base_url = 'http://localhost:5000';
  const endpoint =
    'api/v1/pools/trades?poolAddress=0x36545f9123a356faa3e0f3728f1e0c416814580a';

  const res = http.get(`${base_url}/${endpoint}`);
  check(res, { 'status was 200': (r) => r.status == 200 });
  // sleep()
}
