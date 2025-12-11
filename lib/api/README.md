# API Client - Multi-Tenant

Estructura para llamadas a la API del backend NestJS con arquitectura multi-tenant.

## Arquitectura

- ✅ **Un solo backend** para todas las empresas
- ✅ **tenant-id en headers**: Todas las llamadas incluyen `x-tenant-id`
- ✅ **Backend filtra datos**: El backend NestJS filtra automáticamente por tenant-id
- ✅ **Aislamiento de datos**: Cada empresa solo ve sus propios datos

## Cómo Funciona

```
Frontend (Next.js)                    Backend (NestJS)
     │                                      │
     │  GET /api/pacientes                 │
     │  Headers: x-tenant-id: empresa-demo  │
     ├──────────────────────────────────────>│
     │                                      │ Filtra por tenant-id
     │                                      │ SELECT * FROM pacientes 
     │                                      │ WHERE tenant_id = 'empresa-demo'
     │                                      │
     │  [pacientes de empresa-demo]         │
     │<──────────────────────────────────────┤
     │                                      │
```

## Uso

```tsx
import { pacientesService } from '@/lib/api';

// Siempre pasar el tenantId - el backend lo necesita
const pacientes = await pacientesService.getAll(tenantId, token);
```

## Variables de Entorno

```env
# URL del backend (único para todos los tenants)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Ejemplos de Uso

### 1. En Módulos (Server Components)

```tsx
// modules/core/Pacientes/index.tsx
import { pacientesService } from '@/lib/api';

export default async function Pacientes({ tenantId, tenant }) {
  const token = await getToken(); // Obtener token de sesión
  
  // El backend filtra automáticamente por tenant-id
  const pacientes = await pacientesService.getAll(tenantId, token);
  
  return (
    <div>
      {pacientes.map(p => (
        <div key={p.id}>{p.nombre}</div>
      ))}
    </div>
  );
}
```

### 2. En Componentes Client

```tsx
'use client';

import { usePacientes } from '@/hooks/usePacientes';

export default function PacientesList({ tenantId, token }) {
  const { pacientes, loading, error } = usePacientes({
    tenantId, // Siempre necesario
    token,
  });

  // ...
}
```

### 3. Crear/Actualizar con tenant-id

```tsx
// Crear paciente - el backend asigna el tenant-id automáticamente
const nuevo = await pacientesService.create({
  nombre: 'Juan',
  apellido: 'Pérez',
}, tenantId, token); // El backend usa el tenant-id del header

// Actualizar - el backend valida que pertenezca al tenant
await pacientesService.update(id, {
  nombre: 'Juan Carlos',
}, tenantId, token);
```

## Flujo de Llamadas

```
1. Frontend: pacientesService.getAll(tenantId, token)
   ↓
2. Cliente agrega header: x-tenant-id: empresa-demo
   ↓
3. Petición HTTP al backend único
   ↓
4. Backend NestJS lee header x-tenant-id
   ↓
5. Backend filtra datos: WHERE tenant_id = 'empresa-demo'
   ↓
6. Retorna solo datos de ese tenant
```

## Estructura

```
/lib/api
   /client.ts              ← Cliente que agrega x-tenant-id automáticamente
   /services/
      /pacientes.ts       ← Servicios que siempre incluyen tenantId
      /citas.ts
      /terapeutas.ts
```

## Backend NestJS

El backend debe:
1. Leer el header `x-tenant-id` en cada request
2. Filtrar queries por `tenant_id`
3. Validar que los recursos pertenezcan al tenant
4. Asignar `tenant_id` automáticamente al crear

Ejemplo en NestJS:
```typescript
// Interceptor que lee x-tenant-id
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    // Filtrar por tenantId en todas las queries
  }
}
```

## Ventajas

1. **Un solo backend**: Más simple de mantener
2. **Aislamiento automático**: Cada empresa solo ve sus datos
3. **Escalable**: Fácil agregar nuevas empresas
4. **Seguro**: El backend valida siempre el tenant-id
