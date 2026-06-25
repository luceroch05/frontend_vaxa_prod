import { Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import AdminEstudiantes   from '../modules/extensions/certificaciones/modules/AdminEstudiantes';
import AdminCertificados  from '../modules/extensions/certificaciones/modules/AdminCertificados';
import AdminPlan          from '../modules/extensions/certificaciones/modules/AdminPlan';
import AdminConfig        from '../modules/extensions/certificaciones/modules/AdminConfig';
import PublicRegistro from '../modules/extensions/certificaciones/modules/PublicRegistro';
import PublicValidar  from '../modules/extensions/certificaciones/modules/PublicValidar';

/** Compatibilidad: la ruta vieja /admin/login redirige al nuevo /login. */
function LoginRedirect() {
  const { empresa } = useParams<{ empresa: string }>();
  return <Navigate to={`/${empresa}/certificados/login`} replace />;
}

/** Compatibilidad: la ruta vieja /admin (panel) redirige al nuevo /panel. */
function PanelRedirect() {
  const { empresa } = useParams<{ empresa: string }>();
  return <Navigate to={`/${empresa}/certificados/panel`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* ── Módulo SaaS de Certificados ─────────────────────────────────────
          Público: /:empresa/certificados/ y /validar
          Operador: /:empresa/certificados/login  y  /:empresa/certificados/panel
          URL: /:empresa/certificados/  (empresa = tenant_slug en la BD)
          ──────────────────────────────────────────────────────────────── */}
      <Route path="/:empresa/certificados" element={<CertificadosLayout />}>
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
            <Route path="certificados"  element={<AdminCertificados />} />
            <Route path="plan"          element={<AdminPlan />} />
            <Route path="config"        element={<AdminConfig />} />
          </Route>
        </Route>

        {/* Compat: rutas viejas con /admin → nuevas */}
        <Route path="admin/login" element={<LoginRedirect />} />
        <Route path="admin/*"     element={<PanelRedirect />} />
      </Route>

      {/* ── Tenants existentes (module-loader) ──────────────────────────── */}
      <Route path="/:tenantId" element={<TenantLayout />}>
        <Route index element={<TenantRedirect />} />
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
        <Route path="certificaciones/registrar-empresa"     element={<LazyRoute module="RegistrarEmpresaCertificaciones" />} />
        <Route path="certificaciones/empresa/:empresaId"    element={<LazyRoute module="PerfilEmpresa" paramKey="empresaId" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
