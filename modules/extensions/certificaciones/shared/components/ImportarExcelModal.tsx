import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Download, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, Users,
} from '@/components/ui/icon';
import { useCatalogos } from '../hooks/useCatalogos';
import { inscripcionesApi, type ImportarResultado } from '../api/inscripciones.api';
import { generarPlantilla, parsearArchivo, type FilaParseada } from '../utils/importarExcel';
import type { Grupo } from '../types';

interface Props {
  empresa: string;
  aula: Grupo;
  programaNombre: string;
  onClose: () => void;
  /** Se llama tras una importación exitosa (para refrescar contadores). */
  onDone?: () => void;
}

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  emitido:     { label: 'Emitido',     bg: '#F0FDF4', color: '#15803D' },
  inscrito:    { label: 'Inscrito',    bg: '#EFF6FF', color: '#2563EB' },
  ya_inscrito: { label: 'Ya inscrito', bg: '#F5F4F0', color: '#6B7280' },
  ya_emitido:  { label: 'Ya emitido',  bg: '#F5F4F0', color: '#6B7280' },
  error:       { label: 'Error',       bg: '#FEF2F2', color: '#B91C1C' },
};

export default function ImportarExcelModal({ empresa, aula, programaNombre, onClose, onDone }: Props) {
  const { catalogos } = useCatalogos(empresa);
  const tiposDoc = catalogos?.tipos_documento ?? [];

  const [emitir, setEmitir]       = useState(true);
  const [filas, setFilas]         = useState<FilaParseada[] | null>(null);
  const [parsing, setParsing]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ImportarResultado | null>(null);

  const validas = (filas ?? []).filter((f) => f.valido);
  const invalidas = (filas ?? []).filter((f) => !f.valido);

  const onArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';   // permite re-subir el mismo archivo
    if (!file) return;
    setParsing(true); setError(null);
    try {
      const parsed = await parsearArchivo(file, tiposDoc);
      if (parsed.length === 0) { setError('El archivo no tiene filas. Usa la plantilla y agrega al menos un participante.'); return; }
      setFilas(parsed);
    } catch {
      setError('No se pudo leer el archivo. Asegúrate de subir la plantilla en formato Excel (.xlsx).');
    } finally { setParsing(false); }
  };

  const confirmar = async () => {
    if (!validas.length) return;
    setImportando(true); setError(null);
    try {
      const r = await inscripcionesApi.importarMasivo(empresa, {
        grupo_id: aula.id,
        emitir,
        participantes: validas.map((f) => ({
          tipo_documento_id: f.tipo_documento_id,
          numero_documento: f.numero_documento,
          nombres: f.nombres,
          apellidos: f.apellidos,
          email: f.email,
          telefono: f.telefono,
        })),
      });
      setResultado(r);
      onDone?.();
    } catch (e) { setError((e as Error).message); }
    finally { setImportando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }}
      onMouseDown={() => !importando && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: '0 24px 70px -12px rgba(13,14,18,0.45)' }}
        onMouseDown={(e) => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #EEECE6' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <FileSpreadsheet size={18} style={{ color: '#15803D' }} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Importar participantes</h3>
              <p className="text-[12px]" style={{ color: '#9CA3AF' }}>{programaNombre} · {aula.nombre_grupo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" style={{ color: '#B0A898' }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {error && (
            <div className="mb-4 flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── Resultado ── */}
          {resultado ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-[14px] font-semibold" style={{ color: '#15803D' }}>
                <CheckCircle size={18} /> Importación completada
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat n={resultado.resumen.emitidos} label="Emitidos" color="#15803D" bg="#F0FDF4" />
                <Stat n={resultado.resumen.inscritos} label="Inscritos" color="#2563EB" bg="#EFF6FF" />
                <Stat n={resultado.resumen.ya_inscritos + resultado.resumen.ya_emitidos} label="Ya existían" color="#6B7280" bg="#F5F4F0" />
              </div>
              {resultado.resumen.errores > 0 && (
                <p className="text-[12.5px]" style={{ color: '#B91C1C' }}>
                  {resultado.resumen.errores} fila(s) con error (revisa el detalle abajo).
                </p>
              )}
              <TablaResultado filas={resultado.resultados} />
              <div className="flex justify-end">
                <button onClick={onClose} className="vx-btn vx-btn-primary px-5 py-2">Listo</button>
              </div>
            </div>
          ) : filas ? (
            /* ── Previsualización ── */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="px-2.5 py-1 rounded-lg font-semibold" style={{ background: '#F0FDF4', color: '#15803D' }}>{validas.length} válidos</span>
                {invalidas.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-semibold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{invalidas.length} con error (se omiten)</span>
                )}
              </div>

              <TablaPreview filas={filas} />

              <label className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                <input type="checkbox" checked={emitir} onChange={(e) => setEmitir(e.target.checked)} className="w-4 h-4 mt-0.5 accent-emerald-600" />
                <span>
                  <span className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>Emitir el certificado al importar</span>
                  <span className="block text-[11.5px]" style={{ color: '#9CA3AF' }}>
                    Gasta 1 crédito por participante y requiere que el programa tenga diseño de certificado configurado.
                    Si lo desmarcas, solo quedan inscritos.
                  </span>
                </span>
              </label>

              <div className="flex justify-between gap-2">
                <button onClick={() => { setFilas(null); setError(null); }} className="vx-btn vx-btn-ghost px-4 py-2">Cambiar archivo</button>
                <button onClick={confirmar} disabled={importando || validas.length === 0} className="vx-btn vx-btn-primary px-5 py-2">
                  {importando ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                  {emitir ? `Inscribir y emitir (${validas.length})` : `Inscribir (${validas.length})`}
                </button>
              </div>
            </div>
          ) : (
            /* ── Intro: descargar plantilla + subir ── */
            <div className="space-y-4">
              <Paso n={1} titulo="Descarga la plantilla">
                <p className="text-[12.5px] mb-2.5" style={{ color: '#64748B' }}>
                  Llénala con tus participantes (un alumno por fila) y guárdala.
                </p>
                <button
                  onClick={() => generarPlantilla(tiposDoc, { programa: programaNombre, aula: aula.nombre_grupo })}
                  disabled={!tiposDoc.length}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
                  style={{ background: '#0D0E12', color: '#fff' }}>
                  <Download size={15} /> Descargar plantilla .xlsx
                </button>
              </Paso>

              <Paso n={2} titulo="Sube el archivo lleno">
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-7 rounded-xl cursor-pointer transition-colors text-center"
                  style={{ border: '2px dashed #D8D3C7', background: '#FAFAF8' }}>
                  {parsing ? (
                    <Loader2 size={22} className="animate-spin" style={{ color: '#9CA3AF' }} />
                  ) : (
                    <Upload size={22} style={{ color: '#9CA3AF' }} />
                  )}
                  <span className="text-[13px] font-semibold" style={{ color: '#374151' }}>
                    {parsing ? 'Leyendo archivo…' : 'Haz clic para elegir el Excel'}
                  </span>
                  <span className="text-[11px]" style={{ color: '#B0A898' }}>Formato .xlsx (la plantilla descargada)</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={onArchivo} className="hidden" disabled={parsing} />
                </label>
              </Paso>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ border: '1px solid #EEECE6' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: '#0D0E12', color: '#fff' }}>{n}</span>
        <span className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>{titulo}</span>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function Stat({ n, label, color, bg }: { n: number; label: string; color: string; bg: string }) {
  return (
    <div className="rounded-xl py-3" style={{ background: bg }}>
      <p className="text-[22px] font-bold tabular-nums" style={{ color }}>{n}</p>
      <p className="text-[11px] font-semibold" style={{ color }}>{label}</p>
    </div>
  );
}

function TablaPreview({ filas }: { filas: FilaParseada[] }) {
  return (
    <div className="rounded-xl overflow-hidden max-h-64 overflow-y-auto" style={{ border: '1px solid #EEECE6' }}>
      <table className="w-full text-[12px]">
        <thead className="sticky top-0" style={{ background: '#FAFAF8' }}>
          <tr style={{ color: '#9CA3AF' }}>
            <th className="text-left font-semibold px-3 py-2">Documento</th>
            <th className="text-left font-semibold px-3 py-2">Nombre</th>
            <th className="text-left font-semibold px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} style={{ borderTop: '1px solid #F5F4F0' }}>
              <td className="px-3 py-2 tabular-nums" style={{ color: '#374151' }}>{f.tipo_texto} {f.numero_documento}</td>
              <td className="px-3 py-2" style={{ color: '#374151' }}>{f.nombres} {f.apellidos}</td>
              <td className="px-3 py-2">
                {f.valido
                  ? <span style={{ color: '#15803D' }}>✓ Listo</span>
                  : <span style={{ color: '#B91C1C' }}>✕ {f.motivo}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaResultado({ filas }: { filas: ImportarResultado['resultados'] }) {
  return (
    <div className="rounded-xl overflow-hidden max-h-64 overflow-y-auto" style={{ border: '1px solid #EEECE6' }}>
      <table className="w-full text-[12px]">
        <thead className="sticky top-0" style={{ background: '#FAFAF8' }}>
          <tr style={{ color: '#9CA3AF' }}>
            <th className="text-left font-semibold px-3 py-2">Documento</th>
            <th className="text-left font-semibold px-3 py-2">Nombre</th>
            <th className="text-left font-semibold px-3 py-2">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const meta = ESTADO_META[f.estado] ?? ESTADO_META.error;
            return (
              <tr key={i} style={{ borderTop: '1px solid #F5F4F0' }}>
                <td className="px-3 py-2 tabular-nums" style={{ color: '#374151' }}>{f.documento}</td>
                <td className="px-3 py-2" style={{ color: '#374151' }}>{f.nombre}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                  {f.motivo && <span className="block text-[11px] mt-0.5" style={{ color: '#B91C1C' }}>{f.motivo}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
