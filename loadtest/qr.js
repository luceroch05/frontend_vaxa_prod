// Prueba de carga — Validación pública de certificado por QR.
// Endpoint público (sin token): GET /public/certificado/{empresa}/{codigo}
//
// Correr:  k6 run loadtest/qr.js
//
// ── EDITA ESTOS 3 VALORES ───────────────────────────────────
const BASE    = 'https://vaxasys.com';       // tu VITE_API_URL de producción
const EMPRESA = 'REEMPLAZA_SLUG';            // slug de la empresa de prueba
const CODIGO  = 'REEMPLAZA_CODIGO';          // un código de certificado REAL (que valide 200)
// ────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Escalones: sube usuarios simultáneos (VUs) de a poco. Si algo se pone feo, corta con Ctrl+C.
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 25 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 0 },   // bajada suave
  ],
  // Semáforo automático: k6 marca FALLA si se cruzan estos límites.
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // p95 de latencia < 3s
    http_req_failed:   ['rate<0.02'],   // < 2% de respuestas con error
  },
};

export default function () {
  const res = http.get(`${BASE}/public/certificado/${EMPRESA}/${CODIGO}`);
  check(res, {
    'status 200 (validó)': (r) => r.status === 200,
    'rate-limit 429 (tu defensa, no una caída)': (r) => r.status === 429,
  });
  sleep(1);   // cada usuario espera 1s entre validaciones (simula gente real)
}
