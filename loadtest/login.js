// Prueba de carga — LOGIN (el "click" pesado: consulta BD + verifica contraseña con bcrypt).
// Usa un correo real con contraseña FALSA: el servidor hace todo el trabajo pesado
// pero devuelve 401 (no inicia sesión, no bloquea nada — no hay lockout).
//   k6 run loadtest/login.js

const BASE     = 'https://vaxasys.com';
const CORREO   = 'admin@vaxasys.com';        // correo real (para que llegue al bcrypt)
const EMPRESA  = 'vaxa';                      // tenant_slug
const PRODUCTO = 'certificaciones';
const CLAVE    = 'clave-falsa-loadtest';      // contraseña incorrecta a propósito

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
    // 401 es lo ESPERADO (clave falsa). Solo nos importan errores de servidor (5xx/timeout).
    'http_req_duration{expected:si}': ['p(95)<3000'],
  },
};

const headers = { 'Content-Type': 'application/json' };
const payload = JSON.stringify({ correo: CORREO, contrasena: CLAVE, empresa: EMPRESA, producto: PRODUCTO });

export default function () {
  const res = http.post(`${BASE}/api/auth/login`, payload, { headers });
  check(res, {
    '401 (esperado, clave falsa)': (r) => r.status === 401,
    'sin error de servidor (5xx)':  (r) => r.status < 500,
    'sin timeout':                  (r) => r.status !== 0,
  });
  sleep(1);
}
