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
  Email
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

export default function PoliticaPrivacidad() {
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
            Política de Privacidad
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
              1. Identidad del Responsable del Tratamiento de Datos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C., con RUC N.º 20615047954, con domicilio en la ciudad de Lima, República del Perú, es responsable del tratamiento de los datos personales recopilados a través de sus plataformas digitales, incluyendo su sitio web www.vaxa.com.pe, aplicaciones web y sistemas en línea.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. es una empresa tecnológica dedicada a brindar soluciones digitales para centros terapéuticos y profesionales de la salud, garantizando el uso responsable, seguro y confidencial de la información personal conforme a la normativa vigente.
            </Typography>
          </Box>

          {/* Section 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              2. Finalidad del Tratamiento de Datos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los datos personales que recopilamos son utilizados para las siguientes finalidades:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Gestionar el acceso, registro y uso de los servicios digitales ofrecidos por VAXA SYSTEMS S.A.C.',
                'Brindar soporte técnico, atención al cliente y acompañamiento durante el uso del sistema.',
                'Enviar comunicaciones, notificaciones, actualizaciones, alertas o información relacionada con nuestros servicios.',
                'Cumplir con obligaciones legales, contractuales y regulatorias aplicables.',
                'Realizar análisis internos, estadísticos y de mejora continua de nuestros productos y servicios.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 3 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              3. Datos Personales que Recopilamos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. podrá recopilar los siguientes datos personales:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                { strong: 'Datos de identificación:', text: ' nombres y apellidos, DNI, RUC, cargo, razón social, entre otros.' },
                { strong: 'Datos de contacto:', text: ' correo electrónico, número telefónico, dirección u otros datos de comunicación.' },
                { strong: 'Datos de acceso y uso del sistema:', text: ' usuario, contraseña cifrada, dirección IP, fecha y hora de ingreso, actividad dentro del sistema.' },
                { strong: 'Datos sensibles o información clínica,', text: ' únicamente cuando sea ingresada voluntariamente por los usuarios autorizados dentro del sistema de historias clínicas electrónicas, conforme a la Ley N.º 29733 – Ley de Protección de Datos Personales y su reglamento aprobado por el D.S. N.º 003-2013-JUS.' }
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    <strong>{item.strong}</strong>{item.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 4 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              4. Confidencialidad y Seguridad de la Información
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. adopta medidas técnicas, organizativas y legales necesarias para garantizar la seguridad y confidencialidad de los datos personales, evitando su alteración, pérdida, acceso no autorizado o uso indebido.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              La información se almacena en servidores seguros, con accesos restringidos según perfiles de usuario y sistemas de respaldo periódico que garantizan la integridad y disponibilidad de los datos.
            </Typography>
          </Box>

          {/* Section 5 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              5. Cesión y Transferencia de Datos Personales
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los datos personales no serán cedidos ni transferidos a terceros, salvo en los siguientes casos:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Cuando exista autorización expresa y previa del titular de los datos.',
                'Por requerimiento de autoridad administrativa, judicial o competente.',
                'Cuando sea necesario para el cumplimiento de obligaciones legales o contractuales asumidas por VAXA SYSTEMS S.A.C.'
              ].map((item, index) => (
                <Box component="li" key={index}>
                  <Typography variant="body1" paragraph>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 6 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              6. Derechos del Titular de los Datos (ARCO)
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El titular de los datos personales puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) en cualquier momento, enviando una solicitud al correo electrónico:
            </Typography>
            <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email sx={{ color: '#059669' }} />
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                 datos@vaxa.com.pe
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              La solicitud deberá contener:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              {[
                'Nombre completo del titular.',
                'Documento de identidad.',
                'Descripción clara del derecho que desea ejercer.'
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
              7. Conservación de los Datos Personales
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los datos personales serán conservados únicamente durante el tiempo necesario para cumplir con las finalidades para las cuales fueron recopilados o mientras exista una relación contractual vigente entre el usuario y VAXA SYSTEMS S.A.C., salvo disposición legal en contrario.
            </Typography>
          </Box>

          {/* Section 8 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              8. Modificaciones a la Política de Privacidad
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. se reserva el derecho de modificar, actualizar o adaptar la presente Política de Privacidad en cualquier momento.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Cualquier cambio será publicado oportunamente en www.vaxa.com.pe, indicando la fecha de la última actualización.
            </Typography>
          </Box>

          {/* Section 9 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              9. Consentimiento del Usuario
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El uso de los servicios digitales de VAXA SYSTEMS S.A.C. implica que el usuario ha leído, comprendido y acepta expresamente los términos establecidos en la presente Política de Privacidad.
            </Typography>
          </Box>

          {/* Lema Corporativo */}
          <Box sx={{ mt: 6, p: 4, bgcolor: '#ecfdf5', borderRadius: 2, textAlign: 'center', border: '2px solid #059669' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#065f46', fontStyle: 'italic' }}>
              &ldquo; Digitalizamos tu gestión, potenciamos tu atención. &ldquo;
            </Typography>
          </Box>

          {/* Contact CTA */}
          <Box sx={{ mt: 4, p: 3, bgcolor: '#f9fafb', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#374151' }}>
              ¿Tienes dudas sobre nuestra política de privacidad?
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