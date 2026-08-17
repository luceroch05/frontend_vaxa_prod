import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { getHostMode } from '@/lib/host';
import { certPath } from '@/lib/paths';
import TenantLayout from './layouts/TenantLayout';
import HomePage from './pages/HomePage';
import TenantRedirect from './pages/TenantRedirect';
import LazyRoute from './components/LazyRoute';

// Módulo SaaS de Certificados (importación directa — no usa el module-loader)
import CertificadosLayout from '../modules/extensions/certificaciones/shared/components/CertificadosLayout';
import AdminGuard   from '../modules/extensions/certificaciones/shared/components/AdminGuard';
import AdminLayout  from '../modules/extensions/certificaciones/shared/components/AdminLayout';
import AdminLogin   from '../modules/extensions/certificaciones/modules/AdminLogin';
import AdminDashboard     from '../modules/extensions/certificaciones/modules/AdminDashboard';
import AdminProgramas       from '../modules/extensions/certificaciones/modules/AdminProgramas';
import AdminProgramaDetalle from '../modules/extensions/certificaciones/modules/AdminProgramaDetalle';
import AdminInscripciones from '../modules/extensions/certificaciones/modules/AdminInscripciones';
import PonentesStaff from '../modules/extensions/certificaciones/modules/PonentesStaff';
import AdminEstudiantes   from '../modules/extensions/certificaciones/modules/AdminEstudiantes';
import AdminCertificados  from '../modules/extensions/certificaciones/modules/AdminCertificados';
import AdminPlan          from '../modules/extensions/certificaciones/modules/AdminPlan';
import AdminReportes      from '../modules/extensions/certificaciones/modules/AdminReportes';
import AdminAuditoria     from '../modules/extensions/certificaciones/modules/AdminAuditoria';
import AdminConfig        from '../modules/extensions/certificaciones/modules/AdminConfig';
import PublicRegistro from '../modules/extensions/certificaciones/modules/PublicRegistro';
import PublicValidar  from '../modules/extensions/certificaciones/modules/PublicValidar';
// Libro de Reclamaciones Virtual (público, sin login — importación directa para NO envolverlo en AuthGuard)
import LibroReclamaciones from '../modules/extensions/sistemas-vaxa/modules/LibroReclamaciones';

// Módulo SaaS de Historias Clínicas (centros terapéuticos) — importación directa
import TerapLayout   from '../modules/extensions/terapeutico/shared/TerapLayout';
import TerapGuard    from '../modules/extensions/terapeutico/shared/TerapGuard';
import TerapShell    from '../modules/extensions/terapeutico/shared/TerapShell';
import TerapLogin        from '../modules/extensions/terapeutico/modules/Login';
import TerapPacientes    from '../modules/extensions/terapeutico/modules/Pacientes';
import TerapPacienteDetalle from '../modules/extensions/terapeutico/modules/PacienteDetalle';
import TerapAgenda       from '../modules/extensions/terapeutico/modules/Agenda';
import TerapServicios    from '../modules/extensions/terapeutico/modules/Servicios';

/** Compatibilidad: la ruta vieja /admin/login redirige al nuevo login. */
function LoginRedirect() {
  const { empresa } = useParams<{ empresa: string }>();
  return <Navigate to={certPath(empresa!, '/login')} replace />;
}

/** Compatibilidad: la ruta vieja /admin (panel) redirige al nuevo panel. */
function PanelRedirect() {
  const { empresa } = useParams<{ empresa: string }>();
  return <Navigate to={certPath(empresa!, '/panel')} replace />;
}

/* ── Hijos del área de certificados (se montan bajo /:empresa/certificados en
      legacy y bajo /:empresa en el subdominio; se definen UNA vez). ───────── */
function certificadosChildren() {
  return (
    <>
      {/* Páginas públicas — sin autenticación (pero el slug debe existir) */}
      <Route index element={<PublicRegistro />} />
      <Route path="validar" element={<PublicValidar />} />

      {/* Login del operador */}
      <Route path="login" element={<AdminLogin />} />

      {/* Área protegida del operador */}
      <Route path="panel" element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="programas"     element={<AdminProgramas />} />
          <Route path="programas/:programaId" element={<AdminProgramaDetalle />} />
          <Route path="estudiantes"   element={<AdminEstudiantes />} />
          <Route path="inscripciones" element={<AdminInscripciones />} />
          <Route path="ponentes"      element={<PonentesStaff />} />
          <Route path="certificados"  element={<AdminCertificados />} />
          <Route path="plan"          element={<AdminPlan />} />
          <Route path="reportes"      element={<AdminReportes />} />
          <Route path="auditoria"     element={<AdminAuditoria />} />
          <Route path="config"        element={<AdminConfig />} />
        </Route>
      </Route>

      {/* Compat: rutas viejas con /admin → nuevas */}
      <Route path="admin/login" element={<LoginRedirect />} />
      <Route path="admin/*"     element={<PanelRedirect />} />
    </>
  );
}

/* ── Hijos del área de Historias Clínicas (centros terapéuticos). Se montan bajo
      /:empresa/terapeutico. Login público-por-slug + panel protegido por rol. ── */
function terapeuticoChildren() {
  return (
    <>
      <Route index element={<TerapLogin />} />
      <Route path="login" element={<TerapLogin />} />
      <Route path="panel" element={<TerapGuard />}>
        <Route element={<TerapShell />}>
          <Route index element={<TerapPacientes />} />
          <Route path="agenda" element={<TerapAgenda />} />
          <Route path="servicios" element={<TerapServicios />} />
          <Route path="pacientes/:id" element={<TerapPacienteDetalle />} />
        </Route>
      </Route>
    </>
  );
}

/* ── Hijos de un tenant del sistema interno (se montan bajo /:tenantId en
      legacy y en la raíz en el subdominio `sistemas.`; se definen UNA vez). ─ */
function tenantChildren() {
  return (
    <>
      <Route index element={<TenantRedirect />} />
      {/* Público (sin login): Libro de Reclamaciones Virtual */}
      <Route path="libro-reclamaciones" element={<LibroReclamaciones />} />
      <Route path="login"       element={<LazyRoute module="Login" />} />
      <Route path="dashboard"   element={<LazyRoute module="Dashboard" />} />
      <Route path="participantes" element={<LazyRoute module="Participantes" />} />
      <Route path="historial"   element={<LazyRoute module="HistorialLotes" />} />
      <Route path="historial/:loteId/certificados" element={<LazyRoute module="Certificados" paramKey="loteId" />} />
      <Route path="validar"     element={<LazyRoute module="Validacion" />} />
      <Route path="sistemas"    element={<LazyRoute module="Sistemas" />} />
      <Route path="usuarios"    element={<LazyRoute module="UsuariosSistemasVaxa" />} />
      <Route path="certificaciones"                       element={<LazyRoute module="DashboardCertificaciones" />} />
      <Route path="certificaciones/empresas"              element={<LazyRoute module="EmpresasCertificaciones" />} />
      <Route path="certificaciones/cobranza"              element={<LazyRoute module="CobranzaCertificaciones" />} />
      <Route path="certificaciones/facturacion"           element={<LazyRoute module="FacturacionCertificaciones" />} />
      <Route path="certificaciones/tarifario"             element={<LazyRoute module="TarifarioCertificaciones" />} />
      <Route path="certificaciones/cotizaciones"          element={<LazyRoute module="CotizacionesCertificaciones" />} />
      <Route path="certificaciones/reclamos"              element={<LazyRoute module="ReclamosCertificaciones" />} />
      <Route path="certificaciones/registrar-empresa"     element={<LazyRoute module="RegistrarEmpresaCertificaciones" />} />
      <Route path="certificaciones/empresa/:empresaId"    element={<LazyRoute module="PerfilEmpresa" paramKey="empresaId" />} />
    </>
  );
}

export default function App() {
  const { modo } = getHostMode();

  // ── Subdominio certificados.vaxasys.com → empresa = 1er segmento ──────────
  if (modo === 'certificados') {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:empresa" element={<CertificadosLayout />}>
          {certificadosChildren()}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ── Subdominio sistemas.vaxasys.com → tenant fijo (sistemas-vaxa) ─────────
  if (modo === 'sistemas') {
    return (
      <Routes>
        <Route path="/" element={<TenantLayout />}>
          {tenantChildren()}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ── Legacy (dominio actual): comportamiento idéntico al de hoy ────────────
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/:empresa/certificados" element={<CertificadosLayout />}>
        {certificadosChildren()}
      </Route>

      <Route path="/:empresa/terapeutico" element={<TerapLayout />}>
        {terapeuticoChildren()}
      </Route>

      <Route path="/:tenantId" element={<TenantLayout />}>
        {tenantChildren()}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
