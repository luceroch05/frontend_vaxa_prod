import {
  W, H, LogosFila, firmasGap, SIG_ITEM_W, SIG_IMG_H, nombreCortoDe,
} from './CertificadoPDF';
import { expandirVariablesCertificado, periodoCurso, fechaLargaISO, mesAnioISO } from '../utils/certVariables';
import { imgUrl } from '@/lib/api/client';
import LienzoCampos from '../../personalizado/LienzoCampos';
import LienzoDragLayer from '../../personalizado/LienzoDragLayer';
import ActaPreview from '../../personalizado/ActaPreview';
import { LayoutLienzo, layoutActivo } from '../../personalizado/layout';

interface PreviewLogo  { id: number; imagen_logo: string; nombre?: string | null }
interface PreviewFirma { id: number; imagen_firma: string; nombre_autoridad: string; cargo: string }

interface Props {
  plantillaUrl?: string | null;
  logos: PreviewLogo[];           // en el orden seleccionado
  firmas: PreviewFirma[];         // en el orden seleccionado
  texto?: string | null;          // texto con variables (sin expandir)
  tipoPrograma?: string;
  programaNombre?: string;
  horas?: number;
  creditos?: number;
  /** Fechas REALES del aula seleccionada (ISO YYYY-MM-DD). Si faltan (config por
   *  defecto sin aula), se usan las de ejemplo. La fecha de emisión siempre es hoy. */
  fechaInicio?: string | null;
  fechaFin?: string | null;
  fechaDia2?: string | null;
  fechaDia3?: string | null;
  /** Layout del modo "Diseño Personalizado (Lienzo)". Si está activo, sustituye al diseño por defecto. */
  layout?: LayoutLienzo | null;
  /** Ancho en px al que se muestra el certificado (se escala desde 1122). */
  displayWidth?: number;
  /** Si true (y modo lienzo activo), habilita arrastrar los campos sobre esta preview. */
  editable?: boolean;
  /** Se llama con el layout actualizado al arrastrar/mover un campo. */
  onLayoutChange?: (l: LayoutLienzo) => void;
  /** Campo seleccionado (para el panel de propiedades) — compartido con la capa de arrastre. */
  selectedKey?: string | null;
  /** Se llama al hacer clic en un campo (o en zona vacía) del lienzo. */
  onSelectField?: (key: string | null) => void;
  /** Hoja del diseño a mostrar: 1 (principal, default) o 2 (acta/créditos). La hoja 2
   *  muestra DEBAJO el acta real (referencia) y encima tus cositas. */
  pagina?: number;
  /** Unidades del programa → réplica del acta real en la Hoja 2. */
  actaUnidades?: { id: number; nombre: string; creditos?: number }[];
}

/* Datos de ejemplo: así el usuario VE cómo queda con un alumno real.
 * El grado (Mag.) va delante del nombre, como en el certificado real. */
const EJEMPLO = {
  participante: 'Mag. Ana María Torres López',
  tipoDocumento: 'DNI',
  documento:    '12345678',
  fechaInicio:  '15 de agosto de 2026',
  fechaFin:     '22 de agosto de 2026',
  fecha:        '25 de agosto de 2026',
  mesEmision:   'agosto 2026',
};

/* ── Vista previa del certificado ───────────────────────────────
 * Réplica a escala del CertificadoPDF real (mismas posiciones de
 * logos, firmas, texto y QR) con datos de ejemplo. Sirve para que
 * al configurar se vea cómo quedará: qué logo va al centro/los lados,
 * dónde caen las firmas y cómo se expande el texto con variables.
 * ─────────────────────────────────────────────────────────────── */
export default function CertificadoPreview({
  plantillaUrl, logos, firmas, texto, tipoPrograma, programaNombre, horas, creditos,
  fechaInicio, fechaFin, fechaDia2, fechaDia3, layout, displayWidth = 460,
  editable = false, onLayoutChange, selectedKey, onSelectField, pagina = 1, actaUnidades = [],
}: Props) {
  const scale = displayWidth / W;
  const esHoja2 = pagina === 2;   // la hoja 2 (acta/créditos) va en blanco, sin fondo del cert
  // ¿El QR fue movido a la hoja 2? Entonces el acta no dibuja su QR fijo (lo pone el diseño).
  const qrCampo = layout?.campos?.qr as { on?: boolean; pagina?: number } | undefined;
  const qrEnHoja2 = !!qrCampo && qrCampo.on !== false && (qrCampo.pagina === 2 ? 2 : 1) === 2;

  const programa = programaNombre || 'Nombre del Programa';
  const tipo     = tipoPrograma   || 'Certificado';
  const usarLienzo = layoutActivo(layout);

  // Fechas del preview: las del aula seleccionada si vinieron; si no, las de ejemplo.
  // La fecha de EMISIÓN siempre es HOY (así se emitiría ahora mismo).
  const hoyISO      = new Date().toLocaleDateString('en-CA');   // YYYY-MM-DD local
  const fEmision    = fechaLargaISO(hoyISO) || EJEMPLO.fecha;
  const fMesEmision = mesAnioISO(hoyISO)    || EJEMPLO.mesEmision;
  const fInicio     = fechaLargaISO(fechaInicio) || EJEMPLO.fechaInicio;
  const fFin        = fechaLargaISO(fechaFin)    || EJEMPLO.fechaFin;
  // Frase del periodo con las fechas reales del aula (mismo formato que el PDF).
  // Si no hay aula (config por defecto), se usa una frase de ejemplo.
  const periodoReal = periodoCurso(fechaInicio, fechaFin, fechaDia2, fechaDia3)
    || 'los días 15, 18 y 22 de agosto de 2026';

  // Variables de ejemplo para los campos del lienzo (así el admin ve cómo queda).
  const varsLienzo: Record<string, string> = {
    nombre: EJEMPLO.participante, participante: EJEMPLO.participante,
    nombreCorto: nombreCortoDe(EJEMPLO.participante),
    calidad: 'Participante',
    tipoDocumento: EJEMPLO.tipoDocumento, documento: EJEMPLO.documento,
    programa, curso: programa, tipo,
    fecha: fEmision, fechaInicio: fInicio, fechaFin: fFin, periodo: periodoReal,
    mesEmision: fMesEmision,
    horas: String(horas ?? 40), creditos: creditos ? String(creditos) : '', codigo: 'CERT-EJEMPLO',
  };

  const periodo = `, realizado ${periodoReal || 'los días 15, 18 y 22 de agosto de 2026'}`;
  const cuerpoDefault = `Por haber completado satisfactoriamente ${tipo} "${programa}" con una duración de ${horas ?? 40} horas académicas${periodo}.`;
  const cuerpoBase = texto?.trim() || cuerpoDefault;
  const cuerpo = expandirVariablesCertificado(cuerpoBase, {
    participante: EJEMPLO.participante,
    programa,
    horas: horas ?? 40,
    creditos: creditos ?? '',
    tipoPrograma: tipo,
    tipoDocumento: EJEMPLO.tipoDocumento,
    documento: EJEMPLO.documento,
    fecha: fEmision,
    fechaInicio: fInicio,
    fechaFin: fFin,
    periodo: periodoReal,
  });

  const cuerpoSize = (cuerpo.length > 200 ? 18 : 20);

  return (
    <div
      style={{
        width: displayWidth,
        height: H * scale,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid #EEECE6',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        background: '#fff',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: W, height: H,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        background: '#fff',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}>
        {/* Fondo — en modo lienzo se estira (fill) igual que el PDF real para que
            las coordenadas de los campos coincidan; en modo normal se recorta (cover).
            La hoja 2 (acta) NO usa el fondo del certificado: el acta es una hoja blanca. */}
        {plantillaUrl && !esHoja2 && (
          <img src={imgUrl(plantillaUrl)} alt="" style={{ position: 'absolute', inset: 0, width: W, height: H, objectFit: usarLienzo ? 'fill' : 'cover' }} />
        )}

        {usarLienzo ? (
          /* ── Modo lienzo: fondo del cliente + campos posicionados (+ capa de arrastre si es editable) ── */
          <>
            {/* Hoja 2: debajo va el ACTA real (referencia, como sale al emitir) y encima
                las cositas que agregues en la hoja 2. */}
            {esHoja2 && <ActaPreview unidades={actaUnidades} programa={programa} participante={EJEMPLO.participante} periodo={periodoReal} mostrarQr={!qrEnHoja2} />}
            <LienzoCampos layout={layout!} vars={varsLienzo} codigo="CERT-EJEMPLO" logos={logos} firmas={firmas} pagina={pagina} />
            {editable && onLayoutChange && (
              <LienzoDragLayer
                layout={layout!}
                scale={scale}
                logos={logos}
                firmas={firmas}
                pagina={pagina}
                onMove={(key, x, y) => onLayoutChange({
                  ...layout!,
                  activo: true,
                  campos: { ...(layout!.campos ?? {}), [key]: { ...(layout!.campos?.[key] ?? {}), x, y } },
                })}
                onResize={(key, patch) => onLayoutChange({
                  ...layout!,
                  activo: true,
                  campos: { ...(layout!.campos ?? {}), [key]: { ...(layout!.campos?.[key] ?? {}), ...patch } },
                })}
                selectedKey={selectedKey}
                onSelectField={onSelectField}
              />
            )}
          </>
        ) : (
        <>
        {/* Logos — fila centrada (hasta 10, sin encimarse) */}
        <LogosFila logos={logos} />

        {/* Bloque central */}
        <div style={{
          position: 'absolute', top: 160, bottom: 180, left: 180, right: 180,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#1a365d', textTransform: 'uppercase' }}>{tipo}</p>
          <p style={{ margin: '28px 0 0', fontSize: 18, color: '#475569' }}>Se otorga a:</p>
          <p style={{ margin: '10px 0 0', fontSize: 42, fontWeight: 700, color: '#0f172a', lineHeight: 1.15, fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {/* En el certificado va el nombre corto (un nombre + apellidos); el completo es para validar. */}
            Ana Torres López
          </p>
          <p style={{ margin: '35px 0 0', fontSize: cuerpoSize, color: '#475569', lineHeight: 1.65, maxWidth: 700, whiteSpace: 'pre-wrap' }}>
            {cuerpo}
          </p>
          <p style={{ margin: '30px 0 0', fontSize: 22, fontStyle: 'italic', color: '#1e40af', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            &ldquo;{programa}&rdquo;
          </p>
        </div>

        {/* Firmas */}
        {firmas.length > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 60,
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: firmasGap(firmas.length),
          }}>
            {firmas.map(f => (
              <div key={f.id} style={{ width: SIG_ITEM_W, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={imgUrl(f.imagen_firma)} alt={f.nombre_autoridad}
                  style={{ height: SIG_IMG_H, width: 'auto', maxWidth: SIG_ITEM_W, objectFit: 'contain', marginBottom: -10 }} />
                <div style={{ width: SIG_ITEM_W, borderTop: '1.5px solid #475569', marginBottom: 6 }} />
                <p style={{ display: 'block', width: SIG_ITEM_W, margin: 0, fontSize: 11, fontWeight: 700, color: '#1e293b', textAlign: 'center', lineHeight: '15px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{f.nombre_autoridad}</p>
                <p style={{ display: 'block', width: SIG_ITEM_W, margin: '4px 0 0', fontSize: 9, fontStyle: 'italic', color: '#64748b', textAlign: 'center', lineHeight: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{f.cargo}</p>
              </div>
            ))}
          </div>
        )}

        {/* QR (placeholder) */}
        <div style={{ position: 'absolute', right: 70, bottom: 40, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 100, height: 100, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#94a3b8', fontFamily: '"Courier New", monospace',
          }}>QR</div>
        </div>

        </>
        )}

        {/* Pie fijo de Vaxa — se dibuja en TODOS los certificados (por defecto y lienzo),
            igual que pintarFooterVaxa del backend. En la hoja 2 (acta/créditos) no va. */}
        {!esHoja2 && (
        <div style={{ position: 'absolute', left: 0, top: 764, width: W, pointerEvents: 'none', fontFamily: 'Helvetica, Arial, sans-serif' }}>
          <p style={{ position: 'absolute', left: 40, top: 4, margin: 0, fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
            Fecha de emisión: {fEmision}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Certificado emitido por</span>
            <img src="/vaxa.png" alt="Vaxa" style={{ height: 16, width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
