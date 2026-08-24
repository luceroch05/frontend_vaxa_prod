// Prueba de CAPACIDAD CRUDA — mide el techo real del servidor.
// Truco: cada visita finge venir de una IP distinta (X-Forwarded-For) para
// esquivar el rate-limit por IP (max 200/min). NO cambia nada en el backend.
//   k6 run loadtest/crudo.js

const BASE = 'https://vaxasys.com';

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m',  target: 100 },
    { duration: '1m',  target: 200 },
    { duration: '1m',  target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],   // p95 de latencia < 3s
    http_req_failed:   ['rate<0.05'],    // < 5% de errores REALES (ya sin 429)
  },
};

// IP falsa y aleatoria por cada petición → el guardia cree que es otra persona.
function ipFalsa() {
  const r = () => Math.floor(Math.random() * 254) + 1;
  return `${r()}.${r()}.${r()}.${r()}`;
}

export default function () {
  const res = http.get(`${BASE}/public/vaxa-landing`, {
    headers: { 'X-Forwarded-For': ipFalsa() },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'bloqueo 429 (no deberia salir ya)': (r) => r.status === 429,
  });
  sleep(1);
}
