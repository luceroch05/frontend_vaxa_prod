// Prueba de carga — endpoint público (sin token ni código): GET /public/vaxa-landing
// Mide la capacidad cruda del servidor (Node + MySQL + red) ante muchos golpes simultáneos.
//   k6 run loadtest/publico.js

const BASE = 'https://vaxasys.com';

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 25 },
    { duration: '1m',  target: 50 },
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed:   ['rate<0.05'],
  },
};

export default function () {
  const res = http.get(`${BASE}/public/vaxa-landing`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'rate-limit 429': (r) => r.status === 429,
  });
  sleep(1);
}
