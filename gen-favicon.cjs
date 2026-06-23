/* Genera un favicon con esquinas redondeadas a partir de public/vaxa.png
 * usando pngjs (sin instalar nada). Salida: public/vaxa-rounded.png */
const fs = require('fs');
const { PNG } = require('pngjs');

const SRC = 'public/vaxa.png';
const OUT = 'public/vaxa-rounded.png';

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width: W, height: H, data } = png;

// Radio del redondeo (≈22% del lado, estilo ícono de app).
const r = Math.round(Math.min(W, H) * 0.22);
const bx = W / 2, by = H / 2; // medios lados

// SDF de caja redondeada: <0 dentro, >0 fuera. Da anti-aliasing en el borde.
function sdf(px, py) {
  const qx = Math.abs(px - bx) - (bx - r);
  const qy = Math.abs(py - by) - (by - r);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ax, ay) - r;
}

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = sdf(x + 0.5, y + 0.5);
    const cov = Math.min(Math.max(0.5 - d, 0), 1); // cobertura 0..1 (borde suave)
    const idx = (y * W + x) * 4;
    data[idx + 3] = Math.round(data[idx + 3] * cov); // multiplica el alfa
  }
}

fs.writeFileSync(OUT, PNG.sync.write(png));
console.log('OK', OUT, `${W}x${H}`, 'radio=' + r);
