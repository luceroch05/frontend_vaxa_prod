// Datos estáticos en memoria para sistemas-vaxa

import type { Empresa, UsuarioEmpresa, ConfiguracionSistema } from '../types';

// Datos de empresas registradas (clientes que solicitan sistemas de certificación)
export const EMPRESAS_MOCK: Empresa[] = [
  {
    id: '1',
    nombre: 'Instituto TechPro Capacitaciones',
    ruc: '20123456789',
    email: 'contacto@techpro.edu.pe',
    telefono: '+51 999 888 777',
    direccion: 'Av. Javier Prado 1234, San Isidro',
    pais: 'Perú',
    slug: 'techpro-capacitaciones',
    tipo: 'certificados',
    estado: 'activo',
    planId: 'intermedio',
    logoUrl: '/videologo.png',
    logoSubidoPor: 'admin@techpro.edu.pe',
    logoFechaSubida: '2024-01-10',
    logoBloqueado: true,
    firmas: [
      {
        id: 'f1',
        nombre: 'Dr. Carlos Ruiz Méndez',
        cargo: 'Director General',
        url: '/firma1.png',
        subidoPor: 'admin@techpro.edu.pe',
        fechaSubida: '2024-01-10',
        bloqueado: true,
      },
      {
        id: 'f2',
        nombre: 'Ing. Ana Torres Silva',
        cargo: 'Coordinadora Académica',
        url: '/firma2.png',
        subidoPor: 'admin@techpro.edu.pe',
        fechaSubida: '2024-01-10',
        bloqueado: true,
      },
    ],
    usuariosActivos: 3,
    certificadosGenerados: 145,
    fechaCreacion: '2024-01-10',
    fechaUltimaActividad: '2026-01-30',
    contactoPrincipal: {
      nombre: 'María González',
      email: 'maria.gonzalez@techpro.edu.pe',
      cargo: 'Gerente de Operaciones',
    },
  },
  {
    id: '2',
    nombre: 'Academia Digital Innova',
    ruc: '20987654321',
    email: 'info@innovadigital.com',
    telefono: '+51 987 654 321',
    direccion: 'Calle Los Olivos 567, Miraflores',
    pais: 'Perú',
    slug: 'innova-digital',
    tipo: 'certificados',
    estado: 'activo',
    planId: 'basico',
    logoUrl: undefined,
    logoBloqueado: false,
    firmas: [],
    usuariosActivos: 1,
    certificadosGenerados: 28,
    fechaCreacion: '2026-01-15',
    fechaUltimaActividad: '2026-01-29',
    contactoPrincipal: {
      nombre: 'Roberto Sánchez',
      email: 'roberto@innovadigital.com',
      cargo: 'Director',
    },
  },
];

// Sistemas de Vaxa (los sistemas que ofrece Vaxa, no las empresas clientes)
export const SISTEMAS_MOCK: Empresa[] = [
  {
    id: 'cert-1',
    nombre: 'Sistema de Certificaciones',
    ruc: '20600000001',
    email: 'certificaciones@vaxa.com',
    telefono: '+51 999 999 999',
    direccion: 'Av. Principal 123, Lima',
    pais: 'Perú',
    slug: 'certificaciones',
    tipo: 'certificados',
    estado: 'activo',
    planId: 'avanzado',
    logoUrl: '/vaxa-logo.png',
    logoBloqueado: false,
    firmas: [],
    usuariosActivos: 5,
    certificadosGenerados: 173,
    fechaCreacion: '2024-01-01',
    fechaUltimaActividad: '2026-01-30',
    contactoPrincipal: {
      nombre: 'Admin Vaxa',
      email: 'admin@vaxa.com',
      cargo: 'Administrador',
    },
  },
];

// Usuarios de empresas (usuarios que pueden acceder al sistema de cada empresa)
export const USUARIOS_EMPRESAS_MOCK: UsuarioEmpresa[] = [
  // Usuarios de Instituto TechPro
  {
    id: '1',
    empresaId: '1',
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@techpro.edu.pe',
    rol: 'admin',
    estado: 'activo',
    fechaCreacion: '2024-01-10',
    ultimoAcceso: '2026-01-30',
    creadoPor: 'admin@vaxa.com',
  },
  {
    id: '2',
    empresaId: '1',
    nombre: 'Carlos',
    apellido: 'Ruiz',
    email: 'carlos.ruiz@techpro.edu.pe',
    rol: 'operador',
    estado: 'activo',
    fechaCreacion: '2024-01-12',
    ultimoAcceso: '2026-01-29',
    creadoPor: 'admin@vaxa.com',
  },
  {
    id: '3',
    empresaId: '1',
    nombre: 'Ana',
    apellido: 'Torres',
    email: 'ana.torres@techpro.edu.pe',
    rol: 'operador',
    estado: 'activo',
    fechaCreacion: '2024-01-15',
    ultimoAcceso: '2026-01-28',
    creadoPor: 'admin@vaxa.com',
  },
  // Usuarios de Academia Innova
  {
    id: '4',
    empresaId: '2',
    nombre: 'Roberto',
    apellido: 'Sánchez',
    email: 'roberto@innovadigital.com',
    rol: 'admin',
    estado: 'activo',
    fechaCreacion: '2026-01-15',
    ultimoAcceso: '2026-01-29',
    creadoPor: 'admin@vaxa.com',
  },
];

// Alias para compatibilidad
export const USUARIOS_MOCK = USUARIOS_EMPRESAS_MOCK.map(u => ({
  ...u,
  sistemaId: u.empresaId,
}));

// Configuración de sistemas
export const CONFIGURACIONES_MOCK: ConfiguracionSistema[] = [
  {
    sistemaId: '1',
    logo: {
      url: '/videologo.png',
      bloqueado: true,
      fechaBloqueo: '2024-01-15',
    },
    firmas: [
      {
        id: 'f1',
        nombre: 'Dr. Carlos Ruiz',
        cargo: 'Director General',
        url: '/firma1.png',
        bloqueado: true,
        fechaBloqueo: '2024-01-15',
      },
      {
        id: 'f2',
        nombre: 'Ing. Ana Torres',
        cargo: 'Coordinadora de Capacitación',
        url: '/firma2.png',
        bloqueado: true,
        fechaBloqueo: '2024-01-15',
      },
    ],
    colores: {
      primario: '#ea6733',
      secundario: '#b63b19',
    },
  },
];
