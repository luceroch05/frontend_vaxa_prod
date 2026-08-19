import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { terapPath } from '@/lib/paths';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { webApi, type WebPublic } from '../../shared/api/web.api';

/**
 * Landing pública del centro (web del cliente). Lee el contenido editable desde
 * /public/web/:slug y lo pinta con los colores de la marca. El diseño puede
 * hacerse a medida por cliente; esta es la plantilla base data-driven.
 *
 * El botón "Ingresar" lleva al sistema (login de historias) bajo el mismo dominio.
 */
export default function Landing() {
  const slug = useEmpresaSlug()!;
  const [data, setData] = useState<WebPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    webApi.getPublicWeb(slug)
      .then((d) => { if (vivo) { setData(d); setLoading(false); } })
      .catch(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, [slug]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F6FBFB' }}>
      <Loader2 className="animate-spin" style={{ color: '#0F766E' }} />
    </div>;
  }

  const cfg = data?.config ?? {};
  const primary = cfg.color_primario || '#0F766E';
  const secondary = cfg.color_secundario || '#FF7A59';
  const marca = slug;
  const loginUrl = terapPath(slug, '/login');

  const servicios = data?.servicios ?? [];
  const staff = data?.staff ?? [];
  const alianzas = data?.alianzas ?? [];

  const redes = [
    { k: 'Facebook', v: cfg.red_facebook }, { k: 'Instagram', v: cfg.red_instagram },
    { k: 'TikTok', v: cfg.red_tiktok }, { k: 'YouTube', v: cfg.red_youtube },
    { k: 'LinkedIn', v: cfg.red_linkedin },
    { k: 'WhatsApp', v: cfg.red_whatsapp ? (cfg.red_whatsapp.startsWith('http') ? cfg.red_whatsapp : `https://wa.me/${cfg.red_whatsapp.replace(/\D/g, '')}`) : null },
  ].filter((r) => r.v);

  const vacia = !cfg.hero_titulo && !servicios.length && !staff.length;

  return (
    <div style={{ fontFamily: "'Nunito', system-ui, sans-serif", color: '#12363A', background: '#F6FBFB', minHeight: '100vh' }}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(246,251,251,.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <nav style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 19 }}>
            {cfg.logo_url
              ? <img src={imgUrl(cfg.logo_url)} alt={marca} style={{ height: 38, width: 38, borderRadius: 10, objectFit: 'contain' }} />
              : <span style={{ width: 36, height: 36, borderRadius: 10, background: primary, color: '#fff', display: 'grid', placeItems: 'center' }}>🏥</span>}
            <span style={{ textTransform: 'capitalize' }}>{marca}</span>
          </div>
          <Link to={loginUrl} style={{ background: primary, color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 999, textDecoration: 'none' }}>Ingresar</Link>
        </nav>
      </header>

      {vacia && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800 }}>Web en construcción</h1>
          <p style={{ color: '#5B7377', marginTop: 12 }}>Este centro aún no ha configurado su web pública desde el panel («Mi Web»).</p>
        </div>
      )}

      {/* Hero */}
      {!vacia && (
        <section style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 24px 60px', display: 'grid', gridTemplateColumns: cfg.hero_imagen ? '1.05fr .95fr' : '1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.02em' }}>
              {cfg.hero_titulo || marca}
            </h1>
            {cfg.hero_subtitulo && <p style={{ color: '#5B7377', fontSize: 18, margin: '20px 0 28px', maxWidth: 560 }}>{cfg.hero_subtitulo}</p>}
            <a href={cfg.hero_boton_link || '#contacto'} style={{ display: 'inline-block', background: secondary, color: '#fff', fontWeight: 700, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
              {cfg.hero_boton_texto || 'Contáctanos'}
            </a>
          </div>
          {cfg.hero_imagen && (
            <img src={imgUrl(cfg.hero_imagen)} alt="" style={{ width: '100%', borderRadius: 28, boxShadow: '0 20px 45px -18px rgba(0,0,0,.25)' }} />
          )}
        </section>
      )}

      {/* Servicios */}
      {servicios.length > 0 && (
        <section style={{ maxWidth: 1140, margin: '0 auto', padding: '50px 24px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Servicios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {servicios.map((s) => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 20, padding: 26, border: '1px solid rgba(0,0,0,.06)' }}>
                {s.imagen_url
                  ? <img src={imgUrl(s.imagen_url)} alt="" style={{ height: 52, width: 52, borderRadius: 12, objectFit: 'cover', marginBottom: 14 }} />
                  : <div style={{ fontSize: 34, marginBottom: 10 }}>{s.icono || '⭐'}</div>}
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.titulo}</h3>
                {s.descripcion && <p style={{ color: '#5B7377', fontSize: 15 }}>{s.descripcion}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Equipo */}
      {staff.length > 0 && (
        <section style={{ maxWidth: 1140, margin: '0 auto', padding: '50px 24px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Nuestro equipo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {staff.map((m) => (
              <div key={m.id} style={{ background: '#fff', borderRadius: 20, padding: 22, textAlign: 'center', border: '1px solid rgba(0,0,0,.06)' }}>
                {m.foto_url
                  ? <img src={imgUrl(m.foto_url)} alt={m.nombre} style={{ height: 96, width: 96, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />
                  : <div style={{ height: 96, width: 96, borderRadius: '50%', margin: '0 auto 12px', background: '#EEF2F1', display: 'grid', placeItems: 'center', fontSize: 34 }}>👤</div>}
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{m.nombre}</h3>
                {m.cargo && <p style={{ color: primary, fontSize: 13, fontWeight: 700 }}>{m.cargo}</p>}
                {m.descripcion && <p style={{ color: '#5B7377', fontSize: 13, marginTop: 6 }}>{m.descripcion}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alianzas */}
      {alianzas.length > 0 && (
        <section style={{ maxWidth: 1140, margin: '0 auto', padding: '50px 24px' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Alianzas y convenios</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
            {alianzas.map((a) => {
              const inner = a.logo_url
                ? <img src={imgUrl(a.logo_url)} alt={a.nombre} style={{ height: 52, objectFit: 'contain' }} />
                : <span style={{ fontWeight: 700, color: '#5B7377' }}>{a.nombre}</span>;
              return a.link
                ? <a key={a.id} href={a.link} target="_blank" rel="noreferrer">{inner}</a>
                : <div key={a.id}>{inner}</div>;
            })}
          </div>
        </section>
      )}

      {/* Contacto */}
      {(cfg.contacto_direccion || cfg.contacto_telefono || cfg.contacto_email || redes.length > 0) && (
        <section id="contacto" style={{ maxWidth: 1140, margin: '0 auto', padding: '50px 24px 90px' }}>
          <div style={{ background: primary, color: '#fff', borderRadius: 28, padding: 44 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 16 }}>Contáctanos</h2>
            {cfg.contacto_direccion && <p style={{ margin: '8px 0', fontWeight: 600 }}>📍 {cfg.contacto_direccion}</p>}
            {cfg.contacto_telefono && <p style={{ margin: '8px 0', fontWeight: 600 }}>📞 {cfg.contacto_telefono}{cfg.contacto_telefono2 ? ` · ${cfg.contacto_telefono2}` : ''}</p>}
            {cfg.contacto_email && <p style={{ margin: '8px 0', fontWeight: 600 }}>✉️ {cfg.contacto_email}</p>}
            {cfg.contacto_horario && <p style={{ margin: '8px 0', fontWeight: 600 }}>🕘 {cfg.contacto_horario}</p>}
            {redes.length > 0 && (
              <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                {redes.map((r) => (
                  <a key={r.k} href={r.v as string} target="_blank" rel="noreferrer"
                    style={{ background: 'rgba(255,255,255,.18)', color: '#fff', padding: '8px 16px', borderRadius: 999, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                    {r.k}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <footer style={{ background: '#12363A', color: '#B9D2D3', padding: '30px 24px', textAlign: 'center', fontSize: 13 }}>
        <span style={{ textTransform: 'capitalize' }}>{marca}</span> · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
