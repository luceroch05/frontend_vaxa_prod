// Login a carga CONSTANTE — la cantidad de usuarios se pasa por CLI (--vus N --duration T).
// Sirve para medir escalón por escalón: 150, 300, 500, 800...
//   k6 run --vus 300 --duration 40s loadtest/login-step.js

const BASE     = 'https://vaxasys.com';
const CORREO   = 'admin@vaxasys.com';
const EMPRESA  = 'vaxa';
const PRODUCTO = 'certificaciones';
const CLAVE    = 'clave-falsa-loadtest';

import http from 'k6/http';
import { check } from 'k6';

const headers = { 'Content-Type': 'application/json' };
const payload = JSON.stringify({ correo: CORREO, contrasena: CLAVE, empresa: EMPRESA, producto: PRODUCTO });

export default function () {
  // timeout 20s: si tarda más, se considera "caído" (falla real).
  const res = http.post(`${BASE}/api/auth/login`, payload, { headers, timeout: '20s' });
  check(res, {
    'ok (401 esperado)':          (r) => r.status === 401,
    'CAIDO (5xx o timeout)':      (r) => r.status >= 500 || r.status === 0,
  });
}
