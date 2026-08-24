// Prueba de carga — EMISIÓN de certificado (genera el PDF). El flujo más pesado.
// Usa el endpoint de VISTA PREVIA (genera el mismo PDF pero NO emite ni gasta crédito).
// Corre en LOCAL (localhost:4000) → mide el PESO del flujo, no la velocidad de producción.
//   k6 run -e TOKEN=xxxxx --vus 10 --duration 30s loadtest/emision.js

const BASE   = 'http://localhost:4000';
const INSCR  = 1;          // inscripción del tenant 'vaxa'
const TOKEN  = __ENV.TOKEN;

import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get(`${BASE}/api/certificados/emision/preview/${INSCR}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'x-tenant-id': 'vaxa' },
    timeout: '30s',
  });
  check(res, {
    'PDF generado (200)':        (r) => r.status === 200,
    'sin error de servidor':     (r) => r.status < 500,
    'sin timeout':               (r) => r.status !== 0,
  });
}
