// Prueba de carga de los endpoints PÚBLICOS pesados — de forma SEGURA (sin escribir ni gastar).
// El objetivo (qué endpoint) se pasa por CLI: -e T=qr | grupos | participante | registro
// IP falsa rotativa para esquivar el rate-limit y medir la capacidad cruda.
//   k6 run -e T=qr --vus 150 --duration 40s loadtest/publico-full.js

const BASE    = 'https://vaxasys.com';
const EMPRESA = 'vaxa';

import http from 'k6/http';
import { check } from 'k6';

function ipFalsa() {
  const r = () => Math.floor(Math.random() * 254) + 1;
  return `${r()}.${r()}.${r()}.${r()}`;
}

const T = __ENV.T || 'qr';

export default function () {
  const headers = { 'X-Forwarded-For': ipFalsa(), 'Content-Type': 'application/json' };
  let res;

  if (T === 'qr') {
    // Validar certificado por QR (código falso → 404, pero hace la búsqueda real en BD).
    res = http.get(`${BASE}/public/certificado/${EMPRESA}/COD-FALSO-LOADTEST-123`, { headers, timeout: '20s' });
  } else if (T === 'grupos') {
    // Cargar los grupos/aulas para el formulario público (consulta JOIN pesada).
    res = http.get(`${BASE}/public/certificados/${EMPRESA}/grupos`, { headers, timeout: '20s' });
  } else if (T === 'participante') {
    // Buscar participante por documento (consulta indexada, 404 si no existe).
    res = http.get(`${BASE}/public/certificados/${EMPRESA}/participante?documento=99999999`, { headers, timeout: '20s' });
  } else if (T === 'registro') {
    // Inscripción: grupo_id FALSO → el servidor valida (empresa + grupo) y rechaza con 404
    // ANTES de escribir nada. Mide el trabajo sin ensuciar la BD.
    const body = JSON.stringify({
      tipo_documento_id: 1, numero_documento: '99999999',
      nombres: 'Prueba', apellidos: 'Carga', grupo_id: 999999999,
    });
    res = http.post(`${BASE}/public/certificados/${EMPRESA}/registro`, body, { headers, timeout: '20s' });
  }

  check(res, {
    'sin error de servidor (5xx)': (r) => r.status < 500,
    'sin timeout':                 (r) => r.status !== 0,
  });
}
