import { useState } from 'react';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { webApi } from '../../shared/api/web.api';
import FormConfig, { type CampoConfig } from './FormConfig';
import CrudLista, { type CampoLista, type CrudApi } from './CrudLista';

const TEAL = '#0F766E';

// ── Specs de campos (estables, fuera del componente) ──────────────────────────
const PORTADA: CampoConfig[] = [
  { key: 'logo_url', label: 'Logo', type: 'image' },
  { key: 'color_primario', label: 'Color primario', type: 'color' },
  { key: 'color_secundario', label: 'Color secundario', type: 'color' },
  { key: 'hero_titulo', label: 'Título principal', type: 'text', placeholder: 'Ayudamos a tu hijo a comunicarse…' },
  { key: 'hero_subtitulo', label: 'Subtítulo', type: 'textarea', placeholder: 'Breve descripción del centro' },
  { key: 'hero_imagen', label: 'Imagen de portada', type: 'image' },
  { key: 'hero_boton_texto', label: 'Texto del botón', type: 'text', placeholder: 'Reservar cita' },
  { key: 'hero_boton_link', label: 'Link del botón', type: 'url', placeholder: '#contacto' },
];
const REDES: CampoConfig[] = [
  { key: 'red_facebook', label: 'Facebook', type: 'url', placeholder: 'https://facebook.com/...' },
  { key: 'red_instagram', label: 'Instagram', type: 'url', placeholder: 'https://instagram.com/...' },
  { key: 'red_tiktok', label: 'TikTok', type: 'url' },
  { key: 'red_youtube', label: 'YouTube', type: 'url' },
  { key: 'red_linkedin', label: 'LinkedIn', type: 'url' },
  { key: 'red_whatsapp', label: 'WhatsApp', type: 'text', placeholder: '+51 999 888 777' },
];
const CONTACTO: CampoConfig[] = [
  { key: 'contacto_direccion', label: 'Dirección', type: 'text' },
  { key: 'contacto_telefono', label: 'Teléfono', type: 'text' },
  { key: 'contacto_telefono2', label: 'Teléfono 2', type: 'text' },
  { key: 'contacto_email', label: 'Correo', type: 'text' },
  { key: 'contacto_horario', label: 'Horario', type: 'text', placeholder: 'Lun a Sáb · 9:00 a 19:00' },
  { key: 'contacto_mapa_url', label: 'Mapa (URL de Google Maps)', type: 'url' },
];

const SERV_CAMPOS: CampoLista[] = [
  { key: 'titulo', label: 'Título', type: 'text' },
  { key: 'descripcion', label: 'Descripción', type: 'textarea' },
  { key: 'icono', label: 'Ícono (emoji)', type: 'text', placeholder: '🗣️' },
  { key: 'imagen_url', label: 'Imagen (opcional)', type: 'image' },
];
const STAFF_CAMPOS: CampoLista[] = [
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'cargo', label: 'Cargo / especialidad', type: 'text' },
  { key: 'descripcion', label: 'Descripción', type: 'textarea' },
  { key: 'foto_url', label: 'Foto', type: 'image' },
];
const ALIANZA_CAMPOS: CampoLista[] = [
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'link', label: 'Sitio web (opcional)', type: 'text' },
  { key: 'logo_url', label: 'Logo', type: 'image' },
];

// API objects estables (referencias fijas) para las listas.
const servApi: CrudApi<any> = { list: webApi.listServicios, create: webApi.createServicio, update: webApi.updateServicio, remove: webApi.deleteServicio };
const staffApi: CrudApi<any> = { list: webApi.listStaff, create: webApi.createStaff, update: webApi.updateStaff, remove: webApi.deleteStaff };
const aliApi: CrudApi<any> = { list: webApi.listAlianzas, create: webApi.createAlianza, update: webApi.updateAlianza, remove: webApi.deleteAlianza };

const TABS = ['Portada', 'Servicios', 'Equipo', 'Alianzas', 'Redes', 'Contacto'] as const;
type Tab = typeof TABS[number];

export default function MiWeb() {
  const empresa = useEmpresaSlug()!;
  const [tab, setTab] = useState<Tab>('Portada');

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-[20px] font-bold" style={{ color: '#0E1A1A' }}>Mi Web</h2>
        <p className="text-[13px]" style={{ color: '#8A9A98' }}>Administra el contenido de tu página pública.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap my-5 p-1 rounded-xl w-fit" style={{ background: '#EEF2F1' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
            style={tab === t ? { background: '#fff', color: '#0E1A1A', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#7B8B89' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #E5E9E7' }}>
        {tab === 'Portada' && <FormConfig empresa={empresa} titulo="Portada" descripcion="Logo, colores, título y botón principal." campos={PORTADA} />}
        {tab === 'Redes' && <FormConfig empresa={empresa} titulo="Redes sociales" descripcion="Deja en blanco las que no uses." campos={REDES} />}
        {tab === 'Contacto' && <FormConfig empresa={empresa} titulo="Datos de contacto" descripcion="Dirección, teléfonos, correo y horario." campos={CONTACTO} />}
        {tab === 'Servicios' && <CrudLista empresa={empresa} titulo="Servicios" descripcion="Los servicios que ofreces." campos={SERV_CAMPOS} api={servApi} primaryKey="titulo" />}
        {tab === 'Equipo' && <CrudLista empresa={empresa} titulo="Equipo" descripcion="Las personas de tu centro." campos={STAFF_CAMPOS} api={staffApi} primaryKey="nombre" />}
        {tab === 'Alianzas' && <CrudLista empresa={empresa} titulo="Alianzas y convenios" descripcion="Logos de tus aliados." campos={ALIANZA_CAMPOS} api={aliApi} primaryKey="nombre" />}
      </div>

      <p className="text-[11.5px] mt-3" style={{ color: '#9CA3AF' }}>Los cambios se guardan por sección. <span style={{ color: TEAL, fontWeight: 600 }}>Recarga tu web pública para verlos.</span></p>
    </div>
  );
}
