'use client';

import { useState } from 'react';
import {
  BookOpen, Loader2, CheckCircle, CheckCircle2, AlertCircle, Download, User, FileText, Clock, ArrowRight, X,
} from '@/components/ui/icon';
import { api, API_URL } from '@/lib/api/client';

/** Datos fijos del proveedor (Vaxa) — coinciden con el PDF y la config del backend. */
const PROVEEDOR = {
  razonSocial: 'VAXA SYSTEMS S.A.C',
  ruc: '20615047954',
  domicilio: 'CAL.CALLE 48 MZA. W1 LOTE 5 URB. EL PINAR LIMA - LIMA - COMAS',
};

type Tipo = 'RECLAMO' | 'QUEJA';
type BienTipo = 'PRODUCTO' | 'SERVICIO';

interface RespuestaOk { numero: string; id: number; fecha_limite: string | null }

interface Adjunto { ruta: string; nombre: string; mime: string; tamano: number }
interface Hito { estado: string; estado_nombre: string; nota: string | null; fecha: string | null }
interface ConsultaResp {
  numero: string; tipo_nombre: string; bien_tipo_nombre: string;
  estado: string; estado_nombre: string; created_at: string;
  fecha_limite: string | null; respondido_at: string | null; respuesta: string | null;
  historial: Hito[]; adjuntos: Adjunto[];
}

const MAX_ADJUNTOS = 5;

const label = 'block text-[11px] font-semibold uppercase tracking-wider mb-1.5';
const labelColor = { color: '#374151' };

const fmtLargo = (s: string | null) =>
  (s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');
const fmtHito = (s: string | null) =>
  (s ? new Date(s.replace(' ', 'T')).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

export default function LibroReclamaciones() {
  const [modo, setModo] = useState<'registrar' | 'seguimiento'>('registrar');
  const [seguirNumero, setSeguirNumero] = useState('');
  // Consumidor
  const [nombre, setNombre] = useState('');
  const [tipoDoc, setTipoDoc] = useState('1'); // 1 DNI · 4 CE · 7 Pasaporte
  const [numDoc, setNumDoc] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [esMenor, setEsMenor] = useState(false);
  const [apoderadoNombre, setApoderadoNombre] = useState('');
  const [apoderadoNumDoc, setApoderadoNumDoc] = useState('');
  // Bien
  const [bienTipo, setBienTipo] = useState<BienTipo>('SERVICIO');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  // Reclamación
  const [tipo, setTipo] = useState<Tipo>('RECLAMO');
  const [detalle, setDetalle] = useState('');
  const [pedido, setPedido] = useState('');
  // Adjuntos (se suben al servidor; guardamos solo su ruta/URL)
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [errArchivo, setErrArchivo] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<RespuestaOk | null>(null);

  const subirArchivos = async (files: FileList | null) => {
    if (!files || subiendo) return;
    setErrArchivo(null);
    const restantes = MAX_ADJUNTOS - adjuntos.length;
    if (restantes <= 0) { setErrArchivo(`Máximo ${MAX_ADJUNTOS} archivos.`); return; }
    setSubiendo(true);
    try {
      for (const file of Array.from(files).slice(0, restantes)) {
        if (file.size > 10 * 1024 * 1024) { setErrArchivo(`"${file.name}" supera los 10 MB.`); continue; }
        try {
          const res = await fetch(`${API_URL}/public/reclamos/adjunto`, {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name) },
            body: file,
          });
          if (!res.ok) { const e = await res.json().catch(() => ({})); setErrArchivo(e.error || `No se pudo subir "${file.name}".`); continue; }
          const meta = await res.json() as Adjunto;
          setAdjuntos(a => [...a, meta]);
        } catch { setErrArchivo(`No se pudo subir "${file.name}".`); }
      }
    } finally { setSubiendo(false); }
  };

  const enviar = async () => {
    if (enviando) return;
    setError(null);
    if (!nombre.trim()) return setError('Ingresa tu nombre completo.');
    if (!numDoc.trim()) return setError('Ingresa tu número de documento.');
    if (esMenor && !apoderadoNombre.trim()) return setError('Al ser menor de edad, ingresa el nombre del padre, madre o apoderado.');
    if (!detalle.trim()) return setError('Describe el detalle de tu reclamo o queja.');
    if (!pedido.trim()) return setError('Indica tu pedido concreto.');

    setEnviando(true);
    try {
      const res = await api.post<RespuestaOk>('/public/reclamos', {
        consumidor: {
          nombre, tipo_doc: tipoDoc, num_doc: numDoc, domicilio, telefono, email,
          es_menor: esMenor, apoderado_nombre: apoderadoNombre, apoderado_num_doc: apoderadoNumDoc,
        },
        bien: { tipo: bienTipo, monto: monto || undefined, descripcion },
        reclamacion: { tipo, detalle, pedido },
        adjuntos: adjuntos.map(a => ({ ruta: a.ruta, nombre: a.nombre, mime: a.mime, tamano: a.tamano })),
      });
      setOk(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError((e as Error).message || 'No se pudo registrar. Inténtalo nuevamente.');
    } finally { setEnviando(false); }
  };

  // ── Pantalla de éxito ──
  if (ok) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F5F4F0' }}>
        <div className="w-full max-w-lg rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <CheckCircle className="w-7 h-7" style={{ color: '#059669' }} />
          </div>
          <h1 className="text-[20px] font-bold" style={{ color: '#0D0E12' }}>Reclamo registrado</h1>
          <p className="text-[13.5px] mt-2" style={{ color: '#6B7280' }}>
            Tu Hoja de Reclamación fue registrada con el número:
          </p>
          <p className="text-[22px] font-bold tabular-nums my-2" style={{ color: '#059669' }}>{ok.numero}</p>
          <p className="text-[12.5px]" style={{ color: '#9CA3AF' }}>
            Guarda este número. Te responderemos en un plazo no mayor a <b>15 días hábiles</b>
            {ok.fecha_limite ? ` (antes del ${new Date(`${ok.fecha_limite}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })})` : ''}.
          </p>
          <a href={`${API_URL}/public/reclamos/${ok.numero}/pdf`} target="_blank" rel="noopener noreferrer"
            className="sv-btn sv-btn-primary w-full py-2.5 mt-6 inline-flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Descargar mi Hoja de Reclamación
          </a>
          <button onClick={() => { setSeguirNumero(ok.numero); setModo('seguimiento'); setOk(null); }}
            className="w-full py-2.5 mt-2 inline-flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl"
            style={{ background: '#fff', color: '#059669', border: '1px solid #A7F3D0' }}>
            <Clock className="w-4 h-4" /> Seguir el estado de mi reclamo
          </button>
        </div>
      </div>
    );
  }

  // ── Modo seguimiento ──
  if (modo === 'seguimiento') {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: '#F5F4F0' }}>
        <div className="max-w-2xl mx-auto">
          <Tabs modo={modo} setModo={setModo} />
          <Seguimiento initialNumero={seguirNumero} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#F5F4F0' }}>
      <div className="max-w-3xl mx-auto">
        <Tabs modo={modo} setModo={setModo} />
        {/* Encabezado */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: '#0D0E12' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <BookOpen className="w-5 h-5" style={{ color: '#A7F3D0' }} />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-white leading-tight">Libro de Reclamaciones Virtual</h1>
              <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Conforme al Código de Protección y Defensa del Consumidor</p>
            </div>
          </div>
          <div className="text-[11.5px] mt-3 grid gap-0.5" style={{ color: '#C8C3BB' }}>
            <p><span className="font-semibold text-white">Proveedor:</span> {PROVEEDOR.razonSocial}</p>
            <p><span className="font-semibold text-white">RUC:</span> {PROVEEDOR.ruc}</p>
            <p><span className="font-semibold text-white">Domicilio:</span> {PROVEEDOR.domicilio}</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-6" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          {/* 1. Consumidor */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" style={{ color: '#059669' }} />
              <h2 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>1. Identificación del consumidor</h2>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className={label} style={labelColor}>Nombre completo *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} className="sv-input w-full" placeholder="Nombres y apellidos" />
              </div>
              <div>
                <label className={label} style={labelColor}>Tipo de documento *</label>
                <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} className="sv-input w-full">
                  <option value="1">DNI</option>
                  <option value="4">Carné de extranjería</option>
                  <option value="7">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className={label} style={labelColor}>N° de documento *</label>
                <input value={numDoc} onChange={e => setNumDoc(e.target.value)} className="sv-input w-full" inputMode="numeric" placeholder="Número" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className={label} style={labelColor}>Domicilio</label>
                <input value={domicilio} onChange={e => setDomicilio(e.target.value)} className="sv-input w-full" placeholder="Dirección" />
              </div>
              <div>
                <label className={label} style={labelColor}>Teléfono</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} className="sv-input w-full" inputMode="tel" placeholder="Celular / teléfono" />
              </div>
              <div>
                <label className={label} style={labelColor}>Correo electrónico</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="sv-input w-full" type="email" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-[12.5px] cursor-pointer" style={{ color: '#374151' }}>
              <input type="checkbox" checked={esMenor} onChange={e => setEsMenor(e.target.checked)} />
              El consumidor es menor de edad
            </label>
            {esMenor && (
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className={label} style={labelColor}>Nombre del padre/madre/apoderado *</label>
                  <input value={apoderadoNombre} onChange={e => setApoderadoNombre(e.target.value)} className="sv-input w-full" />
                </div>
                <div>
                  <label className={label} style={labelColor}>Documento del apoderado</label>
                  <input value={apoderadoNumDoc} onChange={e => setApoderadoNumDoc(e.target.value)} className="sv-input w-full" />
                </div>
              </div>
            )}
          </section>

          {/* 2. Bien contratado */}
          <section className="pt-2" style={{ borderTop: '1px solid #F2F0EA' }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" style={{ color: '#059669' }} />
              <h2 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>2. Identificación del bien contratado</h2>
            </div>
            <div className="flex gap-2 mb-3">
              {(['PRODUCTO', 'SERVICIO'] as BienTipo[]).map(v => (
                <button key={v} type="button" onClick={() => setBienTipo(v)}
                  className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  style={bienTipo === v ? { background: '#059669', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #EEECE6' }}>
                  {v === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                </button>
              ))}
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: '160px 1fr' }}>
              <div>
                <label className={label} style={labelColor}>Monto reclamado (S/)</label>
                <input value={monto} onChange={e => setMonto(e.target.value)} className="sv-input w-full" inputMode="decimal" placeholder="0.00" />
              </div>
              <div>
                <label className={label} style={labelColor}>Descripción</label>
                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} className="sv-input w-full" placeholder="Detalle del producto o servicio" />
              </div>
            </div>
          </section>

          {/* 3. Detalle de la reclamación */}
          <section className="pt-2" style={{ borderTop: '1px solid #F2F0EA' }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4" style={{ color: '#059669' }} />
              <h2 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>3. Detalle de la reclamación y pedido</h2>
            </div>
            <div className="flex gap-2 mb-2">
              {(['RECLAMO', 'QUEJA'] as Tipo[]).map(v => (
                <button key={v} type="button" onClick={() => setTipo(v)}
                  className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  style={tipo === v ? { background: '#0D0E12', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #EEECE6' }}>
                  {v === 'RECLAMO' ? 'Reclamo' : 'Queja'}
                </button>
              ))}
            </div>
            <p className="text-[11px] mb-3" style={{ color: '#9CA3AF' }}>
              <b>Reclamo:</b> disconformidad relacionada a los productos o servicios. &nbsp;
              <b>Queja:</b> malestar o descontento respecto a la atención al público.
            </p>
            <div className="space-y-3">
              <div>
                <label className={label} style={labelColor}>Detalle *</label>
                <textarea value={detalle} onChange={e => setDetalle(e.target.value)} rows={4} className="sv-input w-full" style={{ resize: 'vertical' }}
                  placeholder="Describe lo ocurrido con el mayor detalle posible" />
              </div>
              <div>
                <label className={label} style={labelColor}>Pedido *</label>
                <textarea value={pedido} onChange={e => setPedido(e.target.value)} rows={3} className="sv-input w-full" style={{ resize: 'vertical' }}
                  placeholder="¿Qué solución esperas?" />
              </div>
            </div>
          </section>

          {/* Adjuntos (evidencia) */}
          <section className="pt-2" style={{ borderTop: '1px solid #F2F0EA' }}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" style={{ color: '#059669' }} />
              <h2 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>
                Archivos adjuntos <span className="font-normal text-[12px]" style={{ color: '#9CA3AF' }}>(opcional)</span>
              </h2>
            </div>
            <p className="text-[11px] mb-2" style={{ color: '#9CA3AF' }}>
              Adjunta boletas, fotos o documentos como evidencia. Máximo {MAX_ADJUNTOS} archivos, 10 MB c/u.
            </p>
            <label
              onDragOver={e => { e.preventDefault(); if (!subiendo && adjuntos.length < MAX_ADJUNTOS) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); subirArchivos(e.dataTransfer.files); }}
              className="flex flex-col items-center justify-center gap-1.5 p-6 rounded-xl text-center cursor-pointer transition-colors"
              style={{ border: `2px dashed ${dragOver ? '#059669' : '#D8D4CC'}`, background: dragOver ? '#ECFDF5' : '#FAFAF8' }}>
              {subiendo
                ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#059669' }} />
                : <FileText className="w-6 h-6" style={{ color: '#059669' }} />}
              <span className="text-[13px] font-semibold" style={{ color: '#374151' }}>
                {subiendo ? 'Subiendo…' : 'Arrastra tus archivos aquí o haz clic para elegir'}
              </span>
              <span className="text-[11px]" style={{ color: '#9CA3AF' }}>PDF, JPG, PNG o Word</span>
              <input type="file" multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*"
                disabled={subiendo || adjuntos.length >= MAX_ADJUNTOS}
                onChange={e => { subirArchivos(e.target.files); e.target.value = ''; }}
                className="hidden" />
            </label>
            {subiendo && (
              <p className="text-[12px] mt-2 flex items-center gap-1" style={{ color: '#059669' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo…
              </p>
            )}
            {errArchivo && <p className="text-[12px] mt-2" style={{ color: '#B91C1C' }}>{errArchivo}</p>}
            {adjuntos.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {adjuntos.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: '#FAFAF8', border: '1px solid #F2F0EA' }}>
                    <span className="text-[12.5px] truncate flex items-center gap-2" style={{ color: '#374151' }}>
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} /> {a.nombre}
                    </span>
                    <button type="button" onClick={() => setAdjuntos(x => x.filter((_, idx) => idx !== i))} title="Quitar">
                      <X className="w-4 h-4" style={{ color: '#C8C3BB' }} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && (
            <div className="p-3 rounded-xl flex items-center gap-2 text-[12.5px]" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button onClick={enviar} disabled={enviando || subiendo} className="sv-btn sv-btn-primary w-full py-3">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            {enviando ? 'Registrando…' : 'Registrar reclamo'}
          </button>

          <p className="text-[10.5px] leading-relaxed" style={{ color: '#9CA3AF' }}>
            * La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para
            interponer una denuncia ante el INDECOPI. El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a
            quince (15) días hábiles, el cual es improrrogable.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Selector Registrar / Seguimiento. */
function Tabs({ modo, setModo }: { modo: 'registrar' | 'seguimiento'; setModo: (m: 'registrar' | 'seguimiento') => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden mb-4 w-full max-w-sm mx-auto" style={{ border: '1px solid #EEECE6', background: '#fff' }}>
      {([['registrar', 'Registrar reclamo'], ['seguimiento', 'Seguir mi reclamo']] as const).map(([v, l]) => (
        <button key={v} type="button" onClick={() => setModo(v)} className="flex-1 py-2.5 text-[13px] font-semibold transition-colors"
          style={modo === v ? { background: '#0D0E12', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
          {l}
        </button>
      ))}
    </div>
  );
}

const ESTADO_STYLE: Record<string, { bg: string; fg: string }> = {
  PENDIENTE:  { bg: '#FFFBEB', fg: '#B45309' },
  EN_PROCESO: { bg: '#EFF6FF', fg: '#1D4ED8' },
  ATENDIDO:   { bg: '#ECFDF5', fg: '#047857' },
  CERRADO:    { bg: '#F1F5F9', fg: '#475569' },
};

/** Consulta pública: número + documento → línea de tiempo del reclamo. */
function Seguimiento({ initialNumero = '' }: { initialNumero?: string }) {
  const [numero, setNumero] = useState(initialNumero);
  const [doc, setDoc] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConsultaResp | null>(null);

  const consultar = async () => {
    if (buscando) return;
    setError(null); setData(null);
    if (!numero.trim() || !doc.trim()) { setError('Ingresa el número de reclamo y tu documento.'); return; }
    setBuscando(true);
    try {
      const res = await api.get<ConsultaResp>(
        `/public/reclamos/consulta?numero=${encodeURIComponent(numero.trim())}&doc=${encodeURIComponent(doc.trim())}`,
      );
      setData(res);
    } catch (e) {
      setError((e as Error).message || 'No se pudo consultar. Verifica los datos.');
    } finally { setBuscando(false); }
  };

  const st = data ? (ESTADO_STYLE[data.estado] ?? ESTADO_STYLE.PENDIENTE) : null;

  return (
    <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4" style={{ color: '#059669' }} />
        <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Seguimiento de mi reclamo</h2>
      </div>
      <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>
        Ingresa el número de tu Hoja de Reclamación y tu documento para ver el estado.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className={label} style={labelColor}>N° de reclamo</label>
          <input value={numero} onChange={e => setNumero(e.target.value)} className="sv-input w-full" placeholder="LR-2026-0001" />
        </div>
        <div>
          <label className={label} style={labelColor}>Tu documento</label>
          <input value={doc} onChange={e => setDoc(e.target.value)} className="sv-input w-full" inputMode="numeric"
            placeholder="N° de documento" onKeyDown={e => { if (e.key === 'Enter') consultar(); }} />
        </div>
      </div>

      <button onClick={consultar} disabled={buscando} className="sv-btn sv-btn-primary w-full py-2.5 mt-4">
        {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        {buscando ? 'Consultando…' : 'Consultar estado'}
      </button>

      {error && (
        <div className="mt-4 p-3 rounded-xl flex items-center gap-2 text-[12.5px]" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {data && (
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid #EEECE6' }}>
          {/* Resumen */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <p className="text-[16px] font-bold tabular-nums" style={{ color: '#0D0E12' }}>{data.numero}</p>
              <p className="text-[12px]" style={{ color: '#9CA3AF' }}>{data.tipo_nombre} · {data.bien_tipo_nombre} · {fmtLargo(data.created_at)}</p>
            </div>
            {st && <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: st.bg, color: st.fg }}>{data.estado_nombre}</span>}
          </div>

          {/* Plazo / respuesta */}
          <div className="text-[12.5px] mb-4 flex items-center gap-2" style={{ color: '#64748B' }}>
            <Clock className="w-4 h-4" />
            {data.respondido_at
              ? `Respondido el ${fmtLargo(data.respondido_at)}`
              : `Plazo de respuesta: hasta el ${fmtLargo(data.fecha_limite)} (15 días hábiles)`}
          </div>

          {/* Línea de tiempo */}
          <div className="relative pl-6">
            {data.historial.map((h, i) => {
              const ultimo = i === data.historial.length - 1;
              return (
                <div key={i} className="relative pb-5 last:pb-0">
                  {!ultimo && <span className="absolute left-[-14px] top-4 bottom-0 w-px" style={{ background: '#E5E7EB' }} />}
                  <span className="absolute left-[-20px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: ultimo ? '#059669' : '#D1D5DB' }}>
                    {ultimo && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <p className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>{h.estado_nombre}</p>
                  {h.nota && <p className="text-[12px]" style={{ color: '#6B7280' }}>{h.nota}</p>}
                  <p className="text-[11px] tabular-nums" style={{ color: '#9CA3AF' }}>{fmtHito(h.fecha)}</p>
                </div>
              );
            })}
          </div>

          {/* Respuesta del proveedor */}
          {data.respuesta && (
            <div className="mt-5 p-4 rounded-xl" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#047857' }}>Respuesta del proveedor</p>
              <p className="text-[13px] whitespace-pre-wrap" style={{ color: '#065F46' }}>{data.respuesta}</p>
            </div>
          )}

          {/* Adjuntos que envió el consumidor */}
          {data.adjuntos && data.adjuntos.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#B0A898' }}>Archivos adjuntos</p>
              <ul className="space-y-1.5">
                {data.adjuntos.map((a, i) => (
                  <li key={i}>
                    <a href={`${API_URL}${a.ruta}`} target="_blank" rel="noopener noreferrer"
                      className="text-[12.5px] flex items-center gap-2 hover:opacity-70" style={{ color: '#1D4ED8' }}>
                      <FileText className="w-3.5 h-3.5" /> {a.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a href={`${API_URL}/public/reclamos/${data.numero}/pdf`} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: '#B45309' }}>
            <Download className="w-4 h-4" /> Descargar la Hoja de Reclamación
          </a>
        </div>
      )}
    </div>
  );
}
