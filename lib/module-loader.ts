// Sistema de carga dinámica de módulos

import { getTenantConfig } from './tenants';

interface ModuleProps {
  tenantId: string;
  tenant: any;
  [key: string]: any;
}

/**
 * Carga un módulo para un tenant específico
 * 1. Intenta cargar módulo custom del tenant
 * 2. Si no existe, carga el módulo core
 */
export async function loadModule(
  moduleName: string,
  tenantId: string,
  props?: ModuleProps
) {
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} no encontrado`);
  }

  // Verificar si el módulo está habilitado (solo si está en la lista de modules)
  const moduleKey = moduleName.toLowerCase() as keyof typeof tenant.modules;
  if (moduleKey in tenant.modules && tenant.modules[moduleKey] === false) {
    throw new Error(`Módulo ${moduleName} no habilitado para ${tenantId}`);
  }

  // Intentar cargar módulo custom primero
  const hasCustomModule = tenant.customModules?.includes(moduleName);

  if (hasCustomModule) {
    try {
      const CustomModule = await import(
        `@/modules/extensions/${tenantId}/${moduleName}`
      );
      return CustomModule.default;
    } catch (error) {
      console.warn(
        `Módulo custom ${moduleName} no encontrado para ${tenantId}, usando core`
      );
    }
  }

  // Cargar módulo core (fallback)
  try {
    const CoreModule = await import(`@/modules/core/${moduleName}`);
    return CoreModule.default;
  } catch (error) {
    throw new Error(`Módulo ${moduleName} no encontrado en core`);
  }
}

/**
 * Verifica si un módulo está habilitado para un tenant
 */
export function isModuleEnabled(moduleName: string, tenantId: string): boolean {
  const tenant = getTenantConfig(tenantId);
  if (!tenant) return false;

  const moduleKey = moduleName.toLowerCase() as keyof typeof tenant.modules;
  return tenant.modules[moduleKey] === true;
}

