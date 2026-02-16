'use client'

import { useState, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  SelectChangeEvent,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Security,
  Edit,
  CalendarToday,
  FolderOpen,
  TrendingUp,
  Extension,
  ExpandMore,
  WhatsApp,
  Menu as MenuIcon
} from '@mui/icons-material'
import emailjs from '@emailjs/browser'

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
            <Image
              src="/images/imagotipo vaxa.png"
              alt="Vaxa Logo"
              width={100}
              height={75}
              style={{ objectFit: 'contain' }}
            />
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
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

// Interfaces
interface FormData {
  nombre: string
  email: string
  celular: string
  centro: string
  tamano: string
  mensaje: string
  acepta: boolean
}

interface FormErrors {
  [key: string]: string
}

// Main Home Component
export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    celular: '',
    centro: '',
    tamano: '',
    mensaje: 'Estoy interesado en Vaxa y deseo más información.',
    acepta: false
  })
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ 
    type: '', 
    message: '' 
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Manejador para inputs de texto
  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (name && errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Manejador específico para Checkbox
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
    
    if (name && errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Manejador específico para Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (name && errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {}
    
    if (!formData.nombre.trim()) {
      tempErrors.nombre = "El nombre es obligatorio."
    }
    if (!formData.email.trim()) {
      tempErrors.email = "El correo es obligatorio."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = "El correo no es válido."
    }
    if (!formData.celular.trim()) {
      tempErrors.celular = "El número de teléfono es obligatorio."
    } else if (!/^\d{9}$/.test(formData.celular)) {
      tempErrors.celular = "El número de teléfono debe tener 9 dígitos."
    }
    if(!formData.centro.trim()){
      tempErrors.centro = "El nombre del centro es obligatorio."
    }
    if(!formData.tamano){
      tempErrors.tamano = "El tamaño del centro es obligatorio."
    }
    if(!formData.mensaje.trim()){
      tempErrors.mensaje = "El mensaje es obligatorio."
    }
    if (!formData.acepta) {
      tempErrors.acepta = "Debes aceptar la Política de Privacidad."
    }
    
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setFormStatus({ type: '', message: '' })

    try {
      const serviceId = 'service_86mzzho'
      const templateId = 'template_g3xnt9n'
      const publicKey = 'yZ3hxwjnd6qbT5XBf'

      const templateParams = {
        from_name: formData.nombre,
        from_email: formData.email,
        celular: formData.celular || 'No proporcionado',
        centro: formData.centro || 'No proporcionado',
        tamano: formData.tamano || 'No seleccionado',
        message: formData.mensaje || 'Sin mensaje adicional',
        reply_to: formData.email,
      }

      await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      )

      setFormStatus({
        type: 'success',
        message: '¡Mensaje enviado con éxito! Te responderemos en menos de 24 horas.'
      })

      setFormData({
        nombre: '',
        email: '',
        celular: '',
        centro: '',
        tamano: '',
        mensaje: 'Estoy interesado en Vaxa y deseo más información.',
        acepta: false
      })

    } catch (error) {
      console.error('Error al enviar:', error)
      setFormStatus({
        type: 'error',
        message: 'Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Seguridad y cumplimiento',
      description: 'Roles y permisos, auditoría, respaldos automáticos y estándares de protección de datos.'
    },
    {
      icon: <Edit sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Firmas y validación QR',
      description: 'Firmas digitales y verificación por código QR en informes y certificados.'
    },
    {
      icon: <CalendarToday sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Agenda y asistencia',
      description: 'Calendario por terapeuta, recordatorios y control de inasistencias.'
    },
    {
      icon: <FolderOpen sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Historias clínicas flexibles',
      description: 'Plantillas para psicología, lenguaje y ocupacional; notas SOAP y adjuntos.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Reportes y métricas',
      description: 'Indicadores de progreso, productividad y facturación en un clic.'
    },
    {
      icon: <Extension sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Integraciones',
      description: 'WhatsApp, correo, pagos y exportaciones a PDF/Excel.'
    }
  ]

  const faqs = [
    {
      question: '¿Necesito instalación?',
      answer: 'No. Vaxa es 100% web y funciona en cualquier navegador moderno.'
    },
    {
      question: '¿Puedo exportar mis datos?',
      answer: 'Sí. Puedes exportar historias, reportes y adjuntos cuando lo necesites.'
    },
    {
      question: '¿Ofrecen capacitación?',
      answer: 'Incluimos onboarding y material de soporte para tu equipo clínico y administrativo.'
    }
  ]

  return (
    <Box>
      <Navbar />
      
      {/* Hero Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(#fff, #f9fafb)' }} id="contacto">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="Software para centros terapéuticos"
                sx={{
                  bgcolor: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: 700,
                  fontSize: 12,
                  border: '1px solid #a7f3d0',
                  mb: 2
                }}
              />
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '2.125rem', md: '2.625rem' }, 
                  lineHeight: 1.1, 
                  mb: 1,
                  fontWeight: 700
                }}
              >
                Historias clínicas{' '}
                <Box component="span" sx={{ color: '#059669' }}>
                  electrónicas
                </Box>{' '}
                para equipos que crecen
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '56ch' }}>
                Vaxa digitaliza el registro clínico, agenda, firmas y reportes para que tu equipo se enfoque en lo más importante: el paciente.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  href="#contacto"
                  sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                >
                  Solicitar demo
                </Button>
                <Button variant="outlined" size="large" href="#features">
                  Ver características
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">✅ Sin instalación</Typography>
                <Typography variant="body2" color="text.secondary">✅ Multiusuario</Typography>
                <Typography variant="body2" color="text.secondary">✅ Backups automáticos</Typography>
              </Box>
            </Grid>
            
            {/* Formulario */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, boxShadow: '0 10px 20px rgba(2,6,23,.08), 0 2px 6px rgba(2,6,23,.06)' }}>
                <Typography variant="h5" gutterBottom>
                  Solicita información
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Te respondemos en menos de 24 horas hábiles.
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Nombre y apellido *"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleTextChange}
                        placeholder="Ej. Ana Pérez"
                        error={!!errors.nombre}
                        helperText={errors.nombre}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Correo electrónico *"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleTextChange}
                        placeholder="nombre@empresa.com"
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Celular (WhatsApp) *"
                        name="celular"
                        value={formData.celular}
                        onChange={handleTextChange}
                        placeholder="999999999"
                        error={!!errors.celular}
                        helperText={errors.celular}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Centro terapéutico *"
                        name="centro"
                        value={formData.centro}
                        onChange={handleTextChange}
                        placeholder="Nombre de tu institución"
                        error={!!errors.centro}
                        helperText={errors.centro}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth error={!!errors.tamano}>
                        <InputLabel id="tamano-label">Tamaño del centro *</InputLabel>
                        <Select
                          labelId="tamano-label"
                          name="tamano"
                          value={formData.tamano}
                          onChange={handleSelectChange}
                          label="Tamaño del centro *"
                          disabled={loading}
                        >
                          <MenuItem value="">Selecciona…</MenuItem>
                          <MenuItem value="1-3">1–3 terapeutas</MenuItem>
                          <MenuItem value="4-10">4–10 terapeutas</MenuItem>
                          <MenuItem value="10+">Más de 10 terapeutas</MenuItem>
                        </Select>
                        {errors.tamano && (
                          <FormHelperText>{errors.tamano}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Mensaje *"
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleTextChange}
                        error={!!errors.mensaje}
                        helperText={errors.mensaje}
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="acepta"
                        checked={formData.acepta}
                        onChange={handleCheckboxChange}
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Acepto la{' '}
                        <Button
                          variant="text"
                          size="small"
                          href="/politica-privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                        >
                          Política de Privacidad
                        </Button>{' '}
                        y los{' '}
                        <Button
                          variant="text"
                          size="small"
                          href="/terminos-condiciones"
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                        >
                          Términos y Condiciones
                        </Button>
                        . *
                      </Typography>
                    }
                    sx={{ mt: 2, mb: 2 }}
                  />
                  
                  {errors.acepta && (
                    <FormHelperText error sx={{ mb: 2 }}>
                      {errors.acepta}
                    </FormHelperText>
                  )}
                  
                  {formStatus.message && (
                    <Alert severity={formStatus.type === '' ? 'info' : formStatus.type} sx={{ mb: 2 }}>
                      {formStatus.message}
                    </Alert>
                  )}
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      bgcolor: '#059669', 
                      '&:hover': { bgcolor: '#047857' },
                      '&:disabled': { bgcolor: '#94a3b8' },
                      mb: 2 
                    }}
                  >
                    {loading ? 'Enviando…' : 'Enviar'}
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Protegido con cifrado TLS. No compartimos tus datos con terceros.
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<WhatsApp />}
                    href="https://wa.me/51974280156?text=Hola%20Vaxa%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n"
                    target="_blank"
                    rel="noopener"
                    disabled={loading}
                  >
                    Escribir por WhatsApp
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: 8, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}>
            Todo lo que necesitas para tu flujo terapéutico
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            Optimiza evaluación, intervención y seguimiento con herramientas pensadas para equipos clínicos.
          </Typography>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                <Card sx={{ height: '100%', p: 2, boxShadow: '0 10px 20px rgba(2,6,23,.08), 0 2px 6px rgba(2,6,23,.06)' }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Security Section */}
      <Box id="seguridad" sx={{ py: 8, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}>
                Seguridad de nivel empresarial
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                {[
                  'Cifrado en tránsito (TLS) y en reposo.',
                  'Control de acceso por roles, doble factor (2FA) y bitácoras de auditoría.',
                  'Copias de seguridad programadas y recuperación de versiones.',
                  'Hosting en la nube con alta disponibilidad.'
                ].map((item, index) => (
                  <Box component="li" key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" color="text.secondary">✔ {item}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant="contained"
                size="large"
                href="#contacto"
                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, mt: 2 }}
              >
                Solicitar ficha técnica
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: '#0b1020',
                  color: '#d1d5db',
                  borderRadius: 2,
                  p: 2,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  boxShadow: '0 10px 20px rgba(2,6,23,.08), 0 2px 6px rgba(2,6,23,.06)'
                }}
              >
                <pre>{`# Ejemplo de pseudocódigo de cifrado
POST /api/historia-clinica
Headers: Authorization: Bearer <token>
Body (AES-256-GCM): {...}`}</pre>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing CTA */}
      <Box id="precios" sx={{ py: 8, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}>
            Planes simples y escalables
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Paga solo por los terapeutas activos. Descuentos por volumen.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              href="#contacto"
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Cotizar ahora
            </Button>
            <Button variant="outlined" size="large" href="#contacto">
              Hablar con ventas
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{ py: 8, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="md">
          <Typography variant="h3" textAlign="center" gutterBottom sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}>
            Preguntas frecuentes
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      <Footer />
    </Box>
  )
}