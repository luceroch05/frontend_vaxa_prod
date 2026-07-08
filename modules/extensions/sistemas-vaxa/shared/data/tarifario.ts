// Catálogo fijo del tarifario de créditos (fuente única).
// Los PLANES salen de la BD (GET /api/admin/planes); esto es solo lo que no
// vive en la tabla planes: paquetes de créditos y tramos de crédito individual.

/** Paquete de créditos: precio total con descuento por volumen. */
export interface PaqueteCredito {
  id: string;
  planSlug: string;   // plan al que "pertenece" el paquete (filtro por plan del cliente)
  nombre: string;
  creditos: number;
  precio: number;     // S/ total del paquete
}

/** Tarifario Oficial 2026 (valores reales del usuario). */
export const PAQUETES_CREDITOS: PaqueteCredito[] = [
  { id: 'p100', planSlug: 'basico',       nombre: 'Paquete Básico',       creditos: 100, precio: 270 },
  { id: 'p300', planSlug: 'profesional',  nombre: 'Paquete Profesional',  creditos: 300, precio: 750 },
  { id: 'p700', planSlug: 'empresarial',  nombre: 'Paquete Empresarial',  creditos: 700, precio: 1500 },
];

/** Costo por certificado de un paquete (precio / créditos). */
export const costoPorCertificado = (p: { precio: number; creditos: number }) => p.precio / p.creditos;

/** Tramo de crédito suelto (compra pequeña, escalonada). */
export interface TramoCredito { desde: number; hasta: number; precio: number; }

export const CREDITOS_INDIVIDUALES: TramoCredito[] = [
  { desde: 1,  hasta: 49, precio: 3.00 },
  { desde: 50, hasta: 99, precio: 2.85 },
];

/** Usuario extra (fuera del cupo del plan). */
export const USUARIO_EXTRA = { activacion: 50, mensual: 5 };

/**
 * Servicios de pago único / anual que NO viven en la tabla `planes` ni en
 * `creditos_paquetes`. Fuente única compartida por Cotizaciones y Facturación.
 * TODO: migrar a BD (tabla `catalogo_servicios`) para poder editarlos sin deploy.
 */
export interface ServicioCatalogo { id: string; label: string; precio: number; grupo: string; }

/** Planes de desarrollo web (pago único). */
export const WEB_PLANES: ServicioCatalogo[] = [
  { id: 'WEB-EMP', label: 'Plan Emprendedor (desarrollo web)', precio: 300, grupo: 'Desarrollo Web' },
  { id: 'WEB-NEG', label: 'Plan Negocios (desarrollo web)', precio: 500, grupo: 'Desarrollo Web' },
];

/** Dominios (anual). */
export const DOMINIOS: ServicioCatalogo[] = [
  { id: 'DOM-COM',   label: 'Dominio .com (anual)',    precio: 120, grupo: 'Dominios' },
  { id: 'DOM-COMPE', label: 'Dominio .com.pe (anual)', precio: 150, grupo: 'Dominios' },
  { id: 'DOM-PE',    label: 'Dominio .pe (anual)',     precio: 150, grupo: 'Dominios' },
];

/** Hosting (anual). */
export const HOSTING: ServicioCatalogo[] = [
  { id: 'HOST-EMP', label: 'Hosting Individual (Plan Emprendedor, anual)', precio: 100, grupo: 'Hosting' },
  { id: 'HOST-NEG', label: 'Hosting Business (Plan Negocios, anual)',      precio: 150, grupo: 'Hosting' },
];
