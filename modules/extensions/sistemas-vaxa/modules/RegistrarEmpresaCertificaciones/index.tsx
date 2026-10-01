'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Upload,
  X,
  FileText,
  Activity,
  Layers,
  Plus,
  Trash2,
  Package,
  CheckCircle as CheckCircleIcon,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { creditosAdminApi, type PlanCatalogo, type ProductoCatalogo } from '../../shared/api/creditos.admin.api';
import { infraRecursosApi, infraAlquileresApi, aMensual, type InfraRecurso } from '../../shared/api/infra.admin.api';
import { tarifarioApi, type ServicioCatalogo } from '../../shared/api/tarifario.admin.api';
import { DOC_RULES, sanitizeDoc, nombreLabel, esEmpresa } from '../../shared/docs';
import { AlertCircle, CheckCircle } from '@/components/ui/icon';

/** Ciclos de contrato (catálogo fijo: id 1/2/3).
 *  meses_pago = mensualidades que se cobran · meses_vigencia = meses de servicio. */
const CICLOS = [
  { id: 1, label: 'Mensual',                      corto: 'Mensual',   mesesPago: 1,  mesesVigencia: 1 },
  { id: 2, label: 'Semestral (paga 5, recibe 6)', corto: 'Semestral', mesesPago: 5,  mesesVigencia: 6 },
  { id: 3, label: 'Anual (paga 10, recibe 12)',   corto: 'Anual',     mesesPago: 10, mesesVigencia: 12 },
];
const sol = (n: number) => `S/ ${n.toFixed(2)}`;
/** Precio del certificado adicional = proporcional al plan (precio mensual ÷ cupo). */
const adicionalProporcional = (precioMensual: number, cupo: number) =>
  cupo > 0 ? Math.round((precioMensual / cupo) * 100) / 100 : 0;

// Configuración específica del sistema de certificaciones
const CERTIFICACIONES_CONFIG = {
  NAME: 'Sistema de Certificaciones',
  PRIMARY_COLOR: VAXA_CONFIG.PRIMARY_COLOR, // Verde de sistemas-vaxa
  SECONDARY_COLOR: VAXA_CONFIG.SECONDARY_COLOR,
};

interface RegistrarEmpresaCertificacionesProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

interface FormData {
  nombre: string;
  slug: string;
  dominio: string;
  tipoDoc: string;   // cat.06: '6' RUC · '1' DNI · '4' CE · '7' pasaporte
  ruc: string;       // número de documento (genérico)
  email: string;
  telefono: string;
  direccion: string;
  pais: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoCargo: string;
}

/** Recurso (VPS/dominio/hosting) a dar de alta ("comprar") junto a una línea de servicio. */
interface RecursoNuevo { tipo: string; nombre: string; proveedor: string; costo: string; moneda: string; ciclo: string; fecha_renovacion: string; }
/** Una línea de lo que se le vende/cobra al cliente (servicio del Tarifario + su recurso opcional). */
interface LineaServicio {
  key: string;
  servicioCatId: string;    // id del servicio del Tarifario ('' = escrito a mano)
  descripcion: string;
  precio: string;           // lo que le COBRAS
  moneda: string;
  ciclo: string;
  proximo_cobro: string;
  recursoMode: 'ninguno' | 'existente' | 'nuevo';
  recurso_id: string;       // si 'existente'
  nuevo: RecursoNuevo;      // si 'nuevo' (comprar)
}
const TIPOS_RECURSO = ['Dominio', 'Hosting', 'VPS', 'SSL', 'Correo', 'Otro'];

/** Metadatos de presentación por sistema. Escalable: si aparece un producto nuevo
 *  en el catálogo sin entrada aquí, se usa `PRODUCTO_META_DEFAULT`. */
const PRODUCTO_META: Record<string, { icon: typeof Layers; desc: string; color: string }> = {
  'certificaciones':    { icon: FileText, desc: 'Emisión y validación de certificados', color: '#059669' },
  'historias-clinicas': { icon: Activity, desc: 'Fichas y expedientes clínicos del centro', color: '#0F766E' },
};
const PRODUCTO_META_DEFAULT = { icon: Layers, desc: 'Sistema de Vaxa', color: '#6366F1' };

export default function RegistrarEmpresaCertificaciones({
  tenantId,
  tenant,
}: RegistrarEmpresaCertificacionesProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoCertPreview, setLogoCertPreview] = useState<string | null>(null); // logo obligatorio del certificado
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [planId, setPlanId] = useState<number>(0);
  const [cicloId, setCicloId] = useState<number>(1);
  const [precioCert, setPrecioCert] = useState<number>(20);   // solo modo "Pago por certificado"
  const [verificandoRuc, setVerificandoRuc] = useState(false);
  const [rucMsg, setRucMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  // Servicio a medida que el proveedor (Vaxa) activa para este cliente puntual.
  const [permiteDiseno, setPermiteDiseno] = useState(false);
  // Sistemas que se contratan (multi-select, desde el catálogo de la BD).
  const [catalogo, setCatalogo] = useState<ProductoCatalogo[]>([]);
  // Sin producto preseleccionado: el usuario elige conscientemente SaaS y/o servicio a medida.
  const [productos, setProductos] = useState<string[]>([]);
  const esCert = productos.includes('certificaciones');
  const toggleProducto = (slug: string) => setProductos((prev) =>
    prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);

  // Servicios y recursos (lo que le cobras fuera del SaaS: web, catálogo, dominio, hosting…).
  // Cada línea = un servicio del Tarifario + su recurso (asignar uno tuyo o COMPRAR uno nuevo).
  // Al guardar, se crean los recursos nuevos y los cobros (alquileres) ligados a la empresa.
  const [recursos, setRecursos] = useState<InfraRecurso[]>([]);
  const [serviciosCat, setServiciosCat] = useState<ServicioCatalogo[]>([]);   // catálogo del Tarifario
  const [lineas, setLineas] = useState<LineaServicio[]>([]);

  const nuevaLinea = (): LineaServicio => ({
    key: Math.random().toString(36).slice(2),
    servicioCatId: '', descripcion: '', precio: '', moneda: 'PEN', ciclo: 'mensual', proximo_cobro: '',
    recursoMode: 'ninguno', recurso_id: '',
    nuevo: { tipo: 'Dominio', nombre: '', proveedor: '', costo: '', moneda: 'PEN', ciclo: 'anual', fecha_renovacion: '' },
  });
  const addLinea = () => setLineas((ls) => [...ls, nuevaLinea()]);
  const removeLinea = (key: string) => setLineas((ls) => ls.filter((l) => l.key !== key));
  const updLinea = (key: string, patch: Partial<LineaServicio>) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const updNuevo = (key: string, patch: Partial<RecursoNuevo>) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, nuevo: { ...l.nuevo, ...patch } } : l)));
  // Elegir un servicio del Tarifario rellena descripción + precio (editables).
  const elegirServicio = (key: string, catId: string) => {
    const s = serviciosCat.find((x) => String(x.id) === catId);
    updLinea(key, { servicioCatId: catId, ...(s ? { descripcion: s.nombre, precio: String(s.precio) } : {}) });
  };
  const lineaValida = (l: LineaServicio) => l.descripcion.trim() !== '' && Number(l.precio) > 0 && (l.recursoMode !== 'nuevo' || l.nuevo.nombre.trim() !== '');
  const lineasValidas = lineas.filter(lineaValida);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    slug: '',
    dominio: '',
    tipoDoc: '6',
    ruc: '',
    email: '',
    telefono: '',
    direccion: '',
    pais: 'Perú',
    contactoNombre: '',
    contactoEmail: '',
    contactoCargo: '',
  });

  useEffect(() => {
    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      navigate(tenantPath(tenantId, '/login'));
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuario(user);
      } catch (error) {
        navigate(tenantPath(tenantId, '/login'));
      }
    }
  }, [tenantId, navigate]);

  // Carga los planes reales de la BD para el selector.
  useEffect(() => {
    creditosAdminApi.listPlanes()
      .then((ps) => { setPlanes(ps); setPlanId((id) => id || ps[0]?.id || 0); })
      .catch(() => { /* el backend dará el error al guardar si falla */ });
  }, []);

  // VPS/hosting ya registrados en Infraestructura (para asignarlos al servicio a medida).
  useEffect(() => {
    infraRecursosApi.list().then((rs) => setRecursos(Array.isArray(rs) ? rs : [])).catch(() => setRecursos([]));
    // Catálogo de servicios del Tarifario (web/dominios/hosting) para elegir sin escribir a mano.
    tarifarioApi.get().then((t) => setServiciosCat(Array.isArray(t.servicios) ? t.servicios : [])).catch(() => setServiciosCat([]));
  }, []);

  // Catálogo de sistemas disponibles (escalable: sale de la BD).
  // 'sistemas-vaxa' es el panel interno de Vaxa, NO se alquila: se excluye siempre.
  useEffect(() => {
    creditosAdminApi.getCatalogoProductos()
      .then((cat) => { const c = cat.filter((p) => p.slug !== 'sistemas-vaxa'); if (c.length) setCatalogo(c); })
      .catch(() => setCatalogo([
        { slug: 'certificaciones', nombre: 'Certificados' },
        { slug: 'historias-clinicas', nombre: 'Historias Clínicas' },
      ]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Verifica el RUC en SUNAT (dato público) y autocompleta razón social + dirección.
  const verificarRuc = async () => {
    const ruc = formData.ruc.trim();
    if (!ruc) { setRucMsg({ ok: false, texto: 'Ingresa el RUC primero.' }); return; }
    setVerificandoRuc(true); setRucMsg(null);
    try {
      const info = await creditosAdminApi.consultarRuc(ruc);
      setFormData((prev) => ({ ...prev, nombre: info.razonSocial, direccion: info.direccion || prev.direccion }));
      const det = [info.estado, info.condicion].filter(Boolean).join(' · ');
      setRucMsg({ ok: true, texto: `✓ ${info.razonSocial}${det ? ` (${det})` : ''}` });
    } catch (e) {
      setRucMsg({ ok: false, texto: `${(e as Error).message} Puedes escribir la razón social a mano.` });
    } finally { setVerificandoRuc(false); }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoCertPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const removeLogoCert = () => setLogoCertPreview(null);

  // Plan seleccionado y si es el modo "Pago por certificado" (sin ciclo/mantenimiento).
  const planSel = planes.find((p) => p.id === planId);
  const esPagoCert = planSel?.slug === 'pago_certificado';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // El backend tiene columnas razon_social, ruc, tenant_slug, dominio. El resto de
      // campos (teléfono, dirección, contacto) aún no se persisten. El plan elegido se
      // asigna como suscripción vigente en el backend.
      const empresa = await creditosAdminApi.crearEmpresa({
        razon_social: formData.nombre,
        tenant_slug: formData.slug || undefined,   // si vacío, el backend lo genera del nombre
        dominio: formData.dominio || undefined,
        ruc: formData.ruc || undefined,
        tipo_doc: formData.tipoDoc,
        logo: logoPreview || undefined,            // data URL base64 del logo de registro
        productos,                                 // sistemas contratados (uno o varios)
        // Config de Certificados SOLO si contrató ese sistema (no mezclar).
        ...(esCert ? {
          logo_cert: logoCertPreview || undefined,
          plan_id: planId || undefined,
          ciclo_id: cicloId,
          precio_certificado: esPagoCert ? (Number(precioCert) > 0 ? Number(precioCert) : 20) : undefined,
          permite_diseno: permiteDiseno,
        } : {}),
      });
      // Servicios y recursos: por cada línea, si trae un recurso NUEVO lo damos de alta
      // ("comprar" = registrar el gasto en Infraestructura), y creamos el cobro (alquiler)
      // ligado a la empresa + a ese recurso. Todo en un solo registro.
      for (const l of lineasValidas) {
        let recursoId: number | null = l.recursoMode === 'existente' && l.recurso_id ? Number(l.recurso_id) : null;
        if (l.recursoMode === 'nuevo') {
          const r = await infraRecursosApi.create({
            tipo: l.nuevo.tipo, nombre: l.nuevo.nombre.trim(), proveedor: l.nuevo.proveedor.trim() || null,
            costo: Number(l.nuevo.costo) || 0, moneda: l.nuevo.moneda, ciclo: l.nuevo.ciclo,
            fecha_renovacion: l.nuevo.fecha_renovacion || null, proyectos: formData.nombre,
          });
          recursoId = r.id;
        }
        await infraAlquileresApi.create({
          empresa_id: empresa.id, recurso_id: recursoId,
          descripcion: l.descripcion.trim(), precio: Number(l.precio) || 0, moneda: l.moneda, ciclo: l.ciclo,
          proximo_cobro: l.proximo_cobro || null, estado_pago: 'pendiente', activo: 1,
        });
      }
      // No se emite ningún comprobante al registrar (eso es en Facturación Electrónica).
      // Destino: perfil de la empresa si contrató un SaaS; si es solo servicios, a
      // Infraestructura (ahí se ve/cobra).
      const destinoSaas = esCert ? '/certificaciones' : productos.includes('historias-clinicas') ? '/historias-clinicas' : null;
      navigate(tenantPath(tenantId, destinoSaas ? `${destinoSaas}/empresa/${empresa.id}` : '/infraestructura'));
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (!usuario) {
    return null;
  }

  // Ciclo de pago elegido (define cuántas mensualidades se cobran y la vigencia).
  const cicloSel = CICLOS.find((c) => c.id === cicloId) ?? CICLOS[0];

  // ¿Se puede registrar? Todos los campos marcados con * deben estar completos.
  const f = formData;
  const puedeRegistrar =
    (productos.length > 0 || lineasValidas.length > 0) &&   // al menos un SaaS o un servicio válido
    f.nombre.trim() !== '' && f.pais.trim() !== '' &&   // documento OPCIONAL (persona/empresa sin RUC o que aún no lo da)
    f.email.trim() !== '' && f.telefono.trim() !== '' && f.direccion.trim() !== '' &&
    f.contactoNombre.trim() !== '' && f.contactoEmail.trim() !== '' && f.contactoCargo.trim() !== '' &&
    (!esCert || !!planId);                        // el plan solo es obligatorio para Certificados

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{
          name: 'Sistemas Vaxa',
          primaryColor: CERTIFICACIONES_CONFIG.PRIMARY_COLOR,
          secondaryColor: CERTIFICACIONES_CONFIG.SECONDARY_COLOR,
        }}
      />

      <main className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        {/* Back button */}
        <button
          onClick={() => navigate(tenantPath(tenantId, '/sistemas'))}
          className="flex items-center gap-1.5 mb-5 text-[13px] font-medium transition-colors group"
          style={{ color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a Sistemas
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3.5 page-enter">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <Building2 className="w-6 h-6" style={{ color: '#059669' }} />
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Registrar cliente / empresa</h1>
            <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Un solo lugar: SaaS, servicios a medida (web/catálogo) y sus dominios/hosting</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="sv-card p-6 sm:p-8 page-enter stagger-1">
          {/* 1) Sistemas SaaS (opcional) */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-1">Sistemas SaaS <span className="text-[12px] font-medium text-gray-400">· opcional</span></h2>
            <p className="text-[13px] mb-4" style={{ color: '#9CA3AF' }}>Marca los que contrata; cada uno tiene su propio panel. Si solo le vendes un servicio (web, dominio…), déjalo vacío y usa la sección de abajo.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catalogo.map((p) => {
                const meta = PRODUCTO_META[p.slug] ?? PRODUCTO_META_DEFAULT;
                const Icon = meta.icon;
                const sel = productos.includes(p.slug);
                return (
                  <button key={p.slug} type="button" onClick={() => toggleProducto(p.slug)}
                    className="relative text-left rounded-2xl p-4 transition-all flex items-start gap-3"
                    style={{ border: `2px solid ${sel ? meta.color : '#E5E1D8'}`, background: sel ? '#FBFEFD' : '#fff', boxShadow: sel ? `0 12px 28px -16px ${meta.color}` : 'none' }}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: sel ? meta.color : '#F1F0EC', color: sel ? '#fff' : '#9CA3AF' }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{p.nombre}</p>
                      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>{meta.desc}</p>
                    </div>
                    {sel && <CheckCircleIcon className="w-5 h-5 shrink-0" style={{ color: meta.color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2) Servicios y recursos (lo que le cobras: web/catálogo/dominio/hosting del Tarifario) */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-[15px] font-bold text-gray-900">Servicios y recursos <span className="text-[12px] font-medium text-gray-400">· lo que le cobras</span></h2>
              <button type="button" onClick={addLinea} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                <Plus className="w-3.5 h-3.5" /> Agregar servicio
              </button>
            </div>
            <p className="text-[13px] mb-4" style={{ color: '#9CA3AF' }}>Elige del Tarifario. Por cada uno puedes <b>asignar</b> un recurso tuyo o <b>comprar</b> uno nuevo (dominio/hosting); se crea el cobro ligado al cliente y verás el margen.</p>

            {lineas.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ border: '1.5px dashed #D9E3E0', background: '#FAFBFB' }}>
                <p className="text-[13px]" style={{ color: '#6B7280' }}>Sin servicios agregados.</p>
                <button type="button" onClick={addLinea} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: '#059669' }}><Plus className="w-4 h-4" /> Agregar el primero</button>
              </div>
            ) : (
              <div className="space-y-3">
                {lineas.map((l, i) => (
                  <LineaCard key={l.key} idx={i} l={l} serviciosCat={serviciosCat} recursos={recursos}
                    onUpd={updLinea} onUpdNuevo={updNuevo} onElegir={elegirServicio} onRemove={removeLinea} />
                ))}
              </div>
            )}

            {productos.length === 0 && lineasValidas.length === 0 && (
              <p className="text-[12px] mt-2" style={{ color: '#DC2626' }}>Marca un sistema arriba o agrega al menos un servicio.</p>
            )}
          </div>

          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-6">Logo de la Empresa</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 rounded-xl object-contain border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block">
                  <div className="px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Subir Logo</p>
                        <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Logo OBLIGATORIO del certificado — solo si contrató Certificados */}
            {esCert && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-[13.5px] font-bold text-gray-900 mb-1">Logo obligatorio del certificado</h3>
              <p className="text-sm text-gray-500 mb-4">
                Imagen aparte que saldrá <b>obligatoriamente</b> en todos los certificados de este cliente.
                Si no la asignas, el certificado usará el logo de la empresa de arriba.
              </p>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {logoCertPreview ? (
                    <div className="relative">
                      <img
                        src={logoCertPreview}
                        alt="Logo certificado preview"
                        className="w-32 h-32 rounded-xl object-contain border-2 border-emerald-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={removeLogoCert}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-emerald-300 flex items-center justify-center bg-emerald-50/40">
                      <FileText className="w-12 h-12 text-emerald-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <div className="px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Asignar imagen del certificado</p>
                          <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoCertChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Información de la Empresa */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Información de la Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  {formData.tipoDoc === '0' ? 'Nombre / Razón social' : nombreLabel(formData.tipoDoc)} *
                  <span className="ml-2 normal-case tracking-normal font-medium" style={{ color: formData.tipoDoc === '0' ? '#9CA3AF' : esEmpresa(formData.tipoDoc) ? '#059669' : '#1D4ED8' }}>
                    · Cliente {formData.tipoDoc === '0' ? 'sin documento' : esEmpresa(formData.tipoDoc) ? 'Empresa (RUC)' : 'Persona (DNI/CE)'}
                  </span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder={esEmpresa(formData.tipoDoc) ? 'Instituto TechPro Capacitaciones' : 'Juan Pérez García'}
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Identificador / Slug (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="techpro"
                  className="sv-input"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Portal: <code className="text-emerald-600">/{formData.slug || '<se-genera-del-nombre>'}/certificados</code>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Documento <span className="normal-case tracking-normal font-medium text-gray-400">· opcional</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="tipoDoc"
                    value={formData.tipoDoc}
                    onChange={(e) => {
                      const t = e.target.value;
                      // "Sin documento" (0): limpia el número; el resto solo lo sanea al nuevo tipo.
                      setFormData((prev) => ({ ...prev, tipoDoc: t, ruc: t === '0' ? '' : sanitizeDoc(prev.ruc, t) }));
                      setRucMsg(null);
                    }}
                    className="sv-input"
                    style={{ width: 130 }}
                  >
                    <option value="6">RUC</option>
                    <option value="1">DNI</option>
                    <option value="4">CE</option>
                    <option value="7">Pasaporte</option>
                    <option value="0">Sin documento</option>
                  </select>
                  <input
                    type="text"
                    name="ruc"
                    value={formData.ruc}
                    onChange={(e) => { setFormData((prev) => ({ ...prev, ruc: sanitizeDoc(e.target.value, prev.tipoDoc) })); setRucMsg(null); }}
                    inputMode={DOC_RULES[formData.tipoDoc]?.numeric ? 'numeric' : 'text'}
                    maxLength={DOC_RULES[formData.tipoDoc]?.max || 15}
                    disabled={formData.tipoDoc === '0'}
                    placeholder={formData.tipoDoc === '0' ? 'Sin documento' : formData.tipoDoc === '6' ? '20123456789 (opcional)' : formData.tipoDoc === '1' ? '12345678 (opcional)' : 'N° de documento (opcional)'}
                    className="sv-input flex-1 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  {formData.tipoDoc === '6' && (
                    <button
                      type="button"
                      onClick={verificarRuc}
                      disabled={verificandoRuc || !formData.ruc.trim()}
                      className="sv-btn sv-btn-ghost px-3 whitespace-nowrap disabled:opacity-50"
                      style={{ border: '1px solid #EEECE6' }}
                    >
                      {verificandoRuc ? 'Verificando…' : 'Verificar'}
                    </button>
                  )}
                </div>
                {rucMsg && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: rucMsg.ok ? '#15803D' : '#B45309' }}>{rucMsg.texto}</p>
                )}
                {formData.tipoDoc === '0' && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: '#9CA3AF' }}>Cliente sin documento (persona o empresa que aún no lo da). Se puede completar luego; sin él no se emiten comprobantes.</p>
                )}
                {formData.tipoDoc !== '6' && formData.tipoDoc !== '0' && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: '#9CA3AF' }}>Con DNI/CE solo se emiten boletas (desde Facturación). La factura requiere RUC.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">País *</label>
                <select
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  required
                  className="sv-input"
                >
                  <option value="Perú">Perú</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Chile">Chile</option>
                  <option value="Argentina">Argentina</option>
                  <option value="México">México</option>
                  <option value="España">España</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email de la Empresa *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="contacto@techpro.edu.pe"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="+51 999 888 777"
                  className="sv-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Av. Javier Prado 1234, San Isidro"
                  className="sv-input"
                />
              </div>
            </div>
          </div>

          {/* Contacto Principal */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Contacto Principal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="contactoNombre"
                  value={formData.contactoNombre}
                  onChange={handleChange}
                  required
                  placeholder="María González"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="contactoEmail"
                  value={formData.contactoEmail}
                  onChange={handleChange}
                  required
                  placeholder="maria.gonzalez@techpro.edu.pe"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Cargo *</label>
                <input
                  type="text"
                  name="contactoCargo"
                  value={formData.contactoCargo}
                  onChange={handleChange}
                  required
                  placeholder="Gerente de Operaciones"
                  className="sv-input"
                />
              </div>
            </div>
          </div>

          {/* Plan de Suscripción + servicios a medida — SOLO para Certificados (no mezclar) */}
          {esCert && (<>
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Plan de Suscripción
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              El plan define el <span className="font-semibold text-emerald-600">mantenimiento</span>, la implementación,
              los <span className="font-semibold text-emerald-600">créditos incluidos</span> y el límite de usuarios.
              Cada certificado consume 1 crédito; se recargan con paquetes.
            </p>

            {/* Tarjetas de plan (reales de la BD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {planes.map((plan) => {
                const sel = planId === plan.id;
                return (
                  <label key={plan.id} className="relative cursor-pointer rounded-2xl p-4 transition-all flex flex-col"
                    style={sel
                      ? { border: '1.5px solid #059669', background: '#F0FDF9', boxShadow: '0 4px 16px rgba(5,150,105,0.12)' }
                      : { border: '1.5px solid #EEECE6', background: '#fff' }}>
                    <input type="radio" name="plan" value={plan.id} checked={sel} onChange={() => setPlanId(plan.id)} className="sr-only" />
                    <h3 className="text-[14px] font-bold mb-1" style={{ color: '#0D0E12' }}>{plan.nombre}</h3>
                    <div className="mb-2">
                      <span className="text-[22px] font-bold" style={{ color: '#0D0E12' }}>{sol(plan.mantenimiento_mensual)}</span>
                      <span className="text-[12px]" style={{ color: '#9CA3AF' }}>/mes mant.</span>
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: '#059669' }}>
                      {plan.creditos_incluidos > 0 ? `${plan.creditos_incluidos} créditos incluidos` : 'Créditos a medida'}
                    </p>
                    <p className="text-[11.5px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      Implementación {sol(plan.implementacion)} · {plan.usuarios_incluidos === 0 ? '∞' : plan.usuarios_incluidos} usuario{plan.usuarios_incluidos === 1 ? '' : 's'}
                    </p>
                    {/* Mantenimiento total según el ciclo elegido (semestral/anual) */}
                    {cicloId !== 1 && plan.mantenimiento_mensual > 0 && (
                      <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#059669' }}>
                        {cicloSel.corto}: {sol(plan.mantenimiento_mensual * cicloSel.mesesPago)}
                        <span className="font-normal" style={{ color: '#9CA3AF' }}> · {cicloSel.mesesVigencia} meses</span>
                      </p>
                    )}
                  </label>
                );
              })}
            </div>

            {esPagoCert ? (
              /* ── Modo "Pago por certificado": precio por cert, sin ciclo ni mantenimiento ── */
              <div className="mt-4 max-w-xs">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Precio por certificado (S/)</label>
                <input
                  type="number" min={0} step="0.5" value={precioCert}
                  onChange={(e) => setPrecioCert(Number(e.target.value))}
                  className="sv-input"
                />
                <p className="text-[11.5px] mt-1.5" style={{ color: '#059669' }}>
                  Se cobra <b>{sol(Number(precioCert) || 0)}</b> por cada certificado emitido. Sin mantenimiento ni
                  vencimiento; el certificado queda validable de por vida.
                </p>
              </div>
            ) : (
              <>
                {/* Ciclo de facturación */}
                <div className="mt-4 max-w-xs">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Ciclo de facturación</label>
                  <select value={cicloId} onChange={(e) => setCicloId(Number(e.target.value))} className="sv-input">
                    {CICLOS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                {/* Total inicial: implementación + mantenimiento del ciclo */}
                {(() => {
                  const p = planes.find((x) => x.id === planId);
                  if (!p) return null;
                  const mantTotal = p.mantenimiento_mensual * cicloSel.mesesPago;
                  const ahorro    = p.mantenimiento_mensual * (cicloSel.mesesVigencia - cicloSel.mesesPago);
                  const totalInicial = p.implementacion + mantTotal;
                  return (
                    <div className="mt-3 rounded-xl px-4 py-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12.5px] font-semibold" style={{ color: '#065F46' }}>
                          {p.nombre} · {cicloSel.corto} (primera venta)
                        </span>
                        <span className="text-[20px] font-bold" style={{ color: '#047857' }}>{sol(totalInicial)}</span>
                      </div>
                      <p className="text-[11.5px] mt-1" style={{ color: '#059669' }}>
                        Implementación <b>{sol(p.implementacion)}</b> + mantenimiento {cicloSel.mesesPago} mes{cicloSel.mesesPago !== 1 ? 'es' : ''} <b>{sol(mantTotal)}</b>
                        {ahorro > 0 && <> · ahorras <b>{sol(ahorro)}</b> ({cicloSel.mesesVigencia} meses de servicio)</>}.
                        {' '}Incluye <b>{p.creditos_incluidos} créditos</b>.
                      </p>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Qué incluye el plan elegido + campos que pide (dominio, etc.) */}
            {(() => {
              const p = planes.find((x) => x.id === planId);
              if (!p) return null;
              const incluidos = [
                p.permite_diseno       && 'Diseño personalizado del certificado',
                p.permite_subdominio   && 'Dominio o subdominio propio',
                p.permite_carga_masiva && 'Carga masiva (Excel) / API',
                p.permite_api          && 'Acceso por API',
                p.permite_metricas     && 'Panel de métricas',
                p.permite_auditoria    && 'Auditoría completa',
              ].filter(Boolean) as string[];

              return (
                <div className="mt-4 rounded-2xl p-4" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                  <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
                    Incluye el {p.nombre}
                  </p>
                  {incluidos.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {incluidos.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: '#15803D' }}>
                          <CheckCircle className="w-3.5 h-3.5" /> {f}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12.5px]" style={{ color: '#64748B' }}>Funciones base: códigos, validación pública y PDF.</p>
                  )}

                  {/* Si el plan incluye dominio propio, se pide el dominio aquí. */}
                  {p.permite_subdominio && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEECE6' }}>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-2" style={{ color: '#374151' }}>
                        <Globe className="w-4 h-4 text-emerald-600" /> Dominio propio del cliente
                      </label>
                      <input
                        type="text" name="dominio" value={formData.dominio} onChange={handleChange}
                        placeholder="validar.suempresa.com" className="sv-input"
                      />
                      <p className="text-[11.5px] mt-1" style={{ color: '#9CA3AF' }}>
                        Este plan incluye dominio propio. Si lo provee Vaxa, déjalo y se configura luego.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Servicios a medida que activa Vaxa (proveedor) para este cliente puntual.
              No dependen del plan: los prende el proveedor al registrar. */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Servicios a medida
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Los activa Vaxa para clientes puntuales. No vienen con el plan.
            </p>
            <label
              className="flex items-start gap-3 rounded-2xl p-4 cursor-pointer transition-all"
              style={permiteDiseno
                ? { border: '1.5px solid #059669', background: '#F0FDF9', boxShadow: '0 4px 16px rgba(5,150,105,0.10)' }
                : { border: '1.5px solid #EEECE6', background: '#fff' }}
            >
              <input
                type="checkbox"
                checked={permiteDiseno}
                onChange={(e) => setPermiteDiseno(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-600"
              />
              <div>
                <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>
                  Diseño personalizado (Lienzo)
                </p>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#64748B' }}>
                  Habilita el editor de arrastre (tipo Canva) para que este cliente posicione los
                  campos sobre su propio fondo. Márcalo solo para clientes a medida (ej. FAP);
                  el resto usa el diseño estándar.
                </p>
              </div>
            </label>
          </div>
          </>)}

          {/* El comprobante (factura/boleta) NO se emite al registrar: se hace
              manualmente desde Facturación Electrónica. */}
          <div className="mb-6 px-4 py-3 rounded-xl text-[12.5px]" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1' }}>
            Al registrar <b>no se emite ningún comprobante</b>. La factura o boleta se emite luego desde <b>Facturación Electrónica</b>.
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-2.5 pt-6" style={{ borderTop: '1px solid #F2F0EA' }}>
            <button type="button" onClick={() => navigate(tenantPath(tenantId, '/sistemas'))} className="sv-btn sv-btn-ghost px-5">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !puedeRegistrar} className="sv-btn sv-btn-primary px-5">
              <Save className="w-4 h-4" />
              {loading ? 'Registrando…' : 'Registrar empresa'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const SYM = (m: string) => (m === 'USD' ? '$' : 'S/');
const lblCls = 'block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5';

/** Una línea de "Servicios y recursos": servicio del Tarifario + su recurso (asignar o comprar) + margen. */
function LineaCard({ idx, l, serviciosCat, recursos, onUpd, onUpdNuevo, onElegir, onRemove }: {
  idx: number; l: LineaServicio; serviciosCat: ServicioCatalogo[]; recursos: InfraRecurso[];
  onUpd: (key: string, patch: Partial<LineaServicio>) => void;
  onUpdNuevo: (key: string, patch: Partial<RecursoNuevo>) => void;
  onElegir: (key: string, catId: string) => void;
  onRemove: (key: string) => void;
}) {
  const grupos = serviciosCat.reduce((acc, s) => { (acc[s.grupo] ??= []).push(s); return acc; }, {} as Record<string, ServicioCatalogo[]>);
  const cobraMes = aMensual(Number(l.precio) || 0, l.ciclo);
  const pagaMes = l.recursoMode === 'nuevo' ? aMensual(Number(l.nuevo.costo) || 0, l.nuevo.ciclo) : 0;
  const margen = cobraMes - pagaMes;
  const modos: { v: LineaServicio['recursoMode']; t: string }[] = [
    { v: 'ninguno', t: 'Sin recurso' }, { v: 'existente', t: 'Asignar existente' }, { v: 'nuevo', t: 'Comprar nuevo' },
  ];
  return (
    <div className="rounded-2xl p-4" style={{ background: '#FAFBFB', border: '1px solid #E8ECEA' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#059669' }}>Servicio {idx + 1}</span>
        <button type="button" onClick={() => onRemove(l.key)} title="Quitar servicio" className="p-1 rounded-lg hover:bg-red-50" style={{ color: '#DC2626' }}><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className={lblCls}>Servicio * <span className="normal-case tracking-normal font-medium text-gray-400">· del Tarifario</span></label>
          <select value={l.servicioCatId} onChange={(e) => onElegir(l.key, e.target.value)} className="sv-input">
            <option value="">✎ Otro (escribir a mano)</option>
            {Object.entries(grupos).map(([grupo, items]) => (
              <optgroup key={grupo} label={grupo}>
                {items.map((s) => <option key={s.id} value={s.id}>{s.nombre} · S/ {s.precio}</option>)}
              </optgroup>
            ))}
          </select>
          <input type="text" value={l.descripcion} onChange={(e) => onUpd(l.key, { descripcion: e.target.value })}
            placeholder="Descripción (ej. Desarrollo web personalizado)" className="sv-input mt-2" />
        </div>
        <div>
          <label className={lblCls}>Precio *</label>
          <div className="flex gap-2">
            <select value={l.moneda} onChange={(e) => onUpd(l.key, { moneda: e.target.value })} className="sv-input" style={{ width: 84 }}>
              <option value="PEN">S/</option><option value="USD">$</option>
            </select>
            <input type="number" min={0} step="0.01" value={l.precio} onChange={(e) => onUpd(l.key, { precio: e.target.value })} placeholder="0.00" className="sv-input flex-1" />
          </div>
        </div>
        <div>
          <label className={lblCls}>Ciclo de cobro</label>
          <select value={l.ciclo} onChange={(e) => onUpd(l.key, { ciclo: e.target.value })} className="sv-input">
            <option value="mensual">Mensual</option><option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option><option value="anual">Anual</option><option value="unico">Pago único</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={lblCls}>Próximo cobro</label>
          <input type="date" value={l.proximo_cobro} onChange={(e) => onUpd(l.key, { proximo_cobro: e.target.value })} className="sv-input max-w-[220px]" />
        </div>

        <div className="md:col-span-2">
          <label className={lblCls}>Recurso <span className="normal-case tracking-normal font-medium text-gray-400">· VPS / dominio / hosting</span></label>
          <div className="inline-flex rounded-lg overflow-hidden mb-2" style={{ border: '1px solid #E5E9E7' }}>
            {modos.map((m) => (
              <button key={m.v} type="button" onClick={() => onUpd(l.key, { recursoMode: m.v })}
                className="text-[12px] font-semibold px-3 py-1.5"
                style={l.recursoMode === m.v ? { background: '#059669', color: '#fff' } : { background: '#fff', color: '#64748B' }}>{m.t}</button>
            ))}
          </div>
          {l.recursoMode === 'existente' && (
            <select value={l.recurso_id} onChange={(e) => onUpd(l.key, { recurso_id: e.target.value })} className="sv-input">
              <option value="">— Elige un recurso tuyo —</option>
              {recursos.map((r) => <option key={r.id} value={r.id}>{r.tipo} · {r.nombre}{r.proveedor ? ` (${r.proveedor})` : ''}</option>)}
            </select>
          )}
          {l.recursoMode === 'nuevo' && (
            <div className="rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ background: '#fff', border: '1px solid #E5E9E7' }}>
              <div>
                <label className={lblCls}>Tipo</label>
                <select value={l.nuevo.tipo} onChange={(e) => onUpdNuevo(l.key, { tipo: e.target.value })} className="sv-input">
                  {TIPOS_RECURSO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lblCls}>Nombre *</label>
                <input value={l.nuevo.nombre} onChange={(e) => onUpdNuevo(l.key, { nombre: e.target.value })} placeholder="midominio.com / Hosting X" className="sv-input" />
              </div>
              <div>
                <label className={lblCls}>Proveedor</label>
                <input value={l.nuevo.proveedor} onChange={(e) => onUpdNuevo(l.key, { proveedor: e.target.value })} placeholder="GoDaddy / Hostinger…" className="sv-input" />
              </div>
              <div>
                <label className={lblCls}>Costo <span className="normal-case tracking-normal font-medium text-gray-400">· lo que TÚ pagas</span></label>
                <div className="flex gap-2">
                  <select value={l.nuevo.moneda} onChange={(e) => onUpdNuevo(l.key, { moneda: e.target.value })} className="sv-input" style={{ width: 84 }}>
                    <option value="PEN">S/</option><option value="USD">$</option>
                  </select>
                  <input type="number" min={0} step="0.01" value={l.nuevo.costo} onChange={(e) => onUpdNuevo(l.key, { costo: e.target.value })} placeholder="0.00" className="sv-input flex-1" />
                </div>
              </div>
              <div>
                <label className={lblCls}>Ciclo del recurso</label>
                <select value={l.nuevo.ciclo} onChange={(e) => onUpdNuevo(l.key, { ciclo: e.target.value })} className="sv-input">
                  <option value="mensual">Mensual</option><option value="anual">Anual</option><option value="unico">Pago único</option>
                </select>
              </div>
              <div>
                <label className={lblCls}>Renovación <span className="normal-case tracking-normal font-medium text-gray-400">· cuándo pagas</span></label>
                <input type="date" value={l.nuevo.fecha_renovacion} onChange={(e) => onUpdNuevo(l.key, { fecha_renovacion: e.target.value })} className="sv-input" />
              </div>
            </div>
          )}
          {Number(l.precio) > 0 && (
            <p className="text-[11.5px] mt-2 flex items-center gap-1.5" style={{ color: margen >= 0 ? '#047857' : '#B45309' }}>
              <Package className="w-3.5 h-3.5" />
              Cobras <b>{SYM(l.moneda)} {cobraMes.toFixed(2)}/mes</b>
              {l.recursoMode === 'nuevo' && Number(l.nuevo.costo) > 0 && <> · pagas <b>{SYM(l.nuevo.moneda)} {pagaMes.toFixed(2)}/mes</b> · margen <b>{margen.toFixed(2)}/mes</b></>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
