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
  const base_url = 'http://localhost';
  const endpoint =
    'api/v1/tokens/0x8ee87cd9eef20a5b7b81b3b947bd40e65fd51e99/getTokenHolders?page=1';

  const res = http.get(`${base_url}/${endpoint}`);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep()
}
