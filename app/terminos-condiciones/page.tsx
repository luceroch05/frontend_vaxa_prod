'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material'
import {
  Menu as MenuIcon,
  ArrowBack,
  Email,
  Language,
  LocationOn
} from '@mui/icons-material'

// Navbar Component
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Link href="/" passHref>
              <Box component="a" sx={{ display: 'flex', alignItems: 'center' }}>
                <Image
                  src="/images/imagotipo vaxa.png"
                  alt="Vaxa Logo"
                  width={100}
                  height={75}
                  style={{ objectFit: 'contain', cursor: 'pointer' }}
                />
              </Box>
            </Link>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
            <Button color="inherit" href="/#features">Características</Button>
            <Button color="inherit" href="/#seguridad">Seguridad</Button>
            <Button color="inherit" href="/#precios">Precios</Button>
            <Button variant="outlined" href="/#contacto">Solicitar información</Button>
          </Box>

          <IconButton
            color="inherit"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Menú móvil */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <List>
            <ListItem component={Link} href="/#features" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Características" />
            </ListItem>
            <ListItem component={Link} href="/#seguridad" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Seguridad" />
            </ListItem>
            <ListItem component={Link} href="/#precios" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Precios" />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem component={Link} href="/#contacto" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Solicitar información" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  )
}

// Footer Component
function Footer() {
  return (
    <Box sx={{ borderTop: '1px solid #e5e7eb', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
            <Image
              src="/images/imagotipo vaxa.png"
              alt="Vaxa Logo"
              width={120}
              height={60}
              style={{ objectFit: 'contain' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              © 2025 Vaxa. Todos los derechos reservados.
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Button
              component={Link}
              href="/politica-privacidad"
              variant="text"
              size="small"
              color="inherit"
            >
              Política de Privacidad
            </Button>
            <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>·</Typography>
            <Button
              component={Link}
              href="/terminos-condiciones"
              variant="text"
              size="small"
              color="inherit"
            >
              Términos y Condiciones
            </Button>
            <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>·</Typography>
            <Button
              component={Link}
              href="/#contacto"
              variant="text"
              size="small"
              color="inherit"
            >
              Contacto
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default function TerminosCondiciones() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box>
      <Navbar />

      {/* Hero Section */}
      <Box sx={{ py: 6, background: 'linear-gradient(#fff, #f9fafb)', borderBottom: '1px solid #e5e7eb' }}>
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            href="/"
            sx={{ mb: 3, color: '#059669' }}
          >
            Volver al inicio
          </Button>
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.625rem' }, lineHeight: 1.2, mb: 2, fontWeight: 700 }}>
            Términos y Condiciones de Uso
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
            VAXA SYSTEMS S.A.C.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Última actualización: octubre de 2025
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #e5e7eb' }}>
          
          {/* Section 1 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              1. Aceptación de los Términos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El acceso, registro y uso de los servicios digitales ofrecidos por VAXA SYSTEMS S.A.C. implica la aceptación expresa, plena y sin reservas de los presentes Términos y Condiciones de Uso.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Si el usuario no está de acuerdo con alguno de los términos aquí establecidos, deberá abstenerse de acceder o utilizar los servicios y plataformas de VAXA SYSTEMS S.A.C.
            </Typography>
          </Box>

          {/* Section 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              2. Identificación del Proveedor del Servicio
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C., con RUC N.° 20615047954, es una empresa tecnológica peruana dedicada al desarrollo y provisión de soluciones digitales para centros terapéuticos y profesionales de la salud, con domicilio en la ciudad de Lima, República del Perú.
            </Typography>
          </Box>

          {/* Section 3 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              3. Descripción del Servicio
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. brinda soluciones digitales especializadas, que incluyen, entre otros:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Sistema en línea de Historias Clínicas Electrónicas, agenda digital y reportes.',
                'Desarrollo y personalización de plataformas web según las necesidades del cliente.',
                'Digitalización de documentos, formularios y procesos actualmente utilizados por el centro terapéutico.',
                'Soporte técnico, mantenimiento y mejoras continuas del sistema.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 2 }}>
              El acceso a los servicios se realiza mediante un enlace personalizado del tipo:
            </Typography>
            <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#059669' }}>
                🔗 https://www.vaxa.com.pe/nombredenegocio/
              </Typography>
            </Box>
          </Box>

          {/* Section 4 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              4. Condiciones de Uso del Sistema
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El usuario se compromete a:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Utilizar el sistema de manera ética, responsable y conforme a la legislación peruana vigente.',
                'No emplear el sistema para fines ilícitos, fraudulentos o contrarios a la moral y buenas costumbres.',
                'No intentar acceder sin autorización a información, cuentas o sistemas de terceros.',
                'No manipular, alterar o dañar la información almacenada en la plataforma.',
                'Mantener la confidencialidad de sus credenciales de acceso, siendo responsable de todas las acciones realizadas desde su cuenta.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 5 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              5. Usuarios y Administración del Sistema
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Cada plan contratado incluye un usuario administrador, quien tiene permisos para registrar, editar y asignar información dentro del sistema.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              La creación o habilitación de usuarios adicionales deberá ser solicitada expresamente al soporte técnico de Vaxa, y estará sujeta a las condiciones comerciales vigentes, incluyendo el pago correspondiente por usuario adicional.
            </Typography>
          </Box>

          {/* Section 6 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              6. Desarrollo, Implementación y Paso a Producción
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'La plataforma es desarrollada y configurada según las necesidades específicas del cliente.',
                'VAXA SYSTEMS S.A.C. digitaliza los documentos y formatos que el centro utiliza actualmente.',
                'El tiempo estimado de desarrollo e implementación es de aproximadamente 1 mes desde la confirmación del servicio.',
                'En caso el desarrollo esté listo antes del plazo estimado, se coordinará con el cliente una fase de evaluación y validación.',
                'Una vez aprobado el funcionamiento, el sistema será puesto en producción.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 7 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              7. Propiedad Intelectual
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Todo el contenido, código fuente, estructura, diseño, logotipos, documentación, bases de datos y demás elementos del sistema son propiedad exclusiva de VAXA SYSTEMS S.A.C.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Queda estrictamente prohibida su reproducción, distribución, modificación, cesión o uso no autorizado, total o parcial, sin autorización expresa y por escrito de VAXA SYSTEMS S.A.C.
            </Typography>
          </Box>

          {/* Section 8 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              8. Responsabilidad del Usuario
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El usuario es responsable de:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'La veracidad, exactitud y legalidad de la información ingresada en el sistema.',
                'El uso adecuado del sistema y de los datos gestionados.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. no se responsabiliza por pérdidas, daños o perjuicios derivados del uso indebido del sistema, negligencia del usuario o divulgación no autorizada de información por parte del cliente o sus colaboradores.
            </Typography>
          </Box>

          {/* Section 9 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              9. Limitación de Responsabilidad
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. no garantiza la disponibilidad ininterrumpida del servicio y no será responsable por interrupciones ocasionadas por:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Mantenimiento programado o correctivo.',
                'Fallas técnicas, de conectividad o de terceros proveedores.',
                'Casos fortuitos o de fuerza mayor.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              En ningún caso será responsable por daños indirectos, incidentales o consecuentes derivados del uso del sistema.
            </Typography>
          </Box>

          {/* Section 10 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              10. Política de Pagos, Renovaciones y Cancelaciones
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Los servicios se pagan según el plan contratado y tarifas vigentes al momento de la suscripción.',
                'Las renovaciones pueden ser mensuales, semestrales o anuales, según el acuerdo con el cliente.',
                'Los pagos realizados no son reembolsables una vez iniciado el servicio.',
                'La cancelación del servicio deberá ser comunicada con la anticipación establecida por VAXA SYSTEMS S.A.C.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 11 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              11. Modificaciones del Servicio y de los Términos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. se reserva el derecho de modificar, actualizar o suspender parcial o totalmente el sistema, sus funcionalidades, planes o precios, informando oportunamente a los usuarios.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Asimismo, podrá actualizar estos Términos y Condiciones, los cuales serán publicados en www.vaxa.com.pe, indicando la fecha de la última modificación.
            </Typography>
          </Box>

          {/* Section 12 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              12. Legislación Aplicable y Jurisdicción
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los presentes Términos y Condiciones se rigen por las leyes de la República del Perú.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Cualquier controversia derivada de su interpretación o ejecución será sometida a los tribunales competentes de Lima Metropolitana, renunciando las partes a cualquier otro fuero.
            </Typography>
          </Box>

          {/* Section 13 - Contacto */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              13. Contacto
            </Typography>
            <Box sx={{ bgcolor: '#f9fafb', p: 3, borderRadius: 2 }}>
              {[
                { icon: <Email sx={{ color: '#059669' }} />, label: 'Email:', text: 'contacto@vaxa.com.pe' },
                { icon: <Email sx={{ color: '#059669' }} />, label: 'Soporte:', text: 'soporte@vaxa.com.pe' },
                { icon: <Language sx={{ color: '#059669' }} />, label: 'Web:', text: 'https://www.vaxa.com.pe' },
                { icon: <LocationOn sx={{ color: '#059669' }} />, label: 'Ubicación:', text: 'Lima – Perú' }
              ].map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: index < 3 ? 2 : 0 }}>
                  {item.icon}
                  <Typography variant="body1">
                    <strong>{item.label}</strong> {item.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Lema Corporativo */}
          <Box sx={{ mt: 6, p: 4, bgcolor: '#ecfdf5', borderRadius: 2, textAlign: 'center', border: '2px solid #059669' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#065f46', fontStyle: 'italic' }}>
              &ldquo; Digitalizamos tu gestión, potenciamos tu atención. &ldquo;
            </Typography>
          </Box>

          {/* Contact CTA */}
          <Box sx={{ mt: 6, p: 3, bgcolor: '#f9fafb', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#374151' }}>
              ¿Tienes dudas sobre nuestros términos y condiciones?
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/#contacto"
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Contáctanos
            </Button>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  )
}