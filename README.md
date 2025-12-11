# Sistema Multi-Tenant para Centros de Terapia

Sistema web desarrollado con Next.js 16, TypeScript y Tailwind CSS, diseñado con arquitectura multi-tenant modular para gestionar múltiples centros de terapia en una sola aplicación.

## 🏗️ Arquitectura

### Multi-Tenant Modular

El sistema utiliza una arquitectura modular que permite:
- **Módulos core compartidos**: Componentes base reutilizables
- **Módulos custom por tenant**: Cada empresa puede tener módulos personalizados
- **Un solo backend**: Todas las empresas usan el mismo backend NestJS
- **Aislamiento de datos**: El backend filtra automáticamente por `tenant-id`

### Estructura del Proyecto

```
/
├── app/                      # Rutas de Next.js (App Router)
│   ├── [tenant]/             # Rutas dinámicas por tenant
│   │   ├── layout.tsx        # Layout específico por tenant
│   │   ├── page.tsx           # Página principal
│   │   ├── dashboard/         # Dashboard del tenant
│   │   ├── pacientes/         # Gestión de pacientes
│   │   ├── citas/             # Gestión de citas
│   │   └── terapeutas/        # Gestión de terapeutas
│   └── page.tsx               # Página principal (selector de tenants)
│
├── modules/                   # Sistema de módulos
│   ├── core/                  # Módulos base compartidos
│   │   ├── Dashboard/
│   │   ├── Pacientes/
│   │   ├── Citas/
│   │   ├── Terapeutas/
│   │   └── Home/
│   └── extensions/            # Módulos custom por tenant
│       └── empresa-demo/
│           ├── Dashboard/    # Dashboard custom
│           └── Home/          # Home custom
│
├── components/                # Componentes reutilizables
│   ├── ui/                    # Componentes UI base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Card.tsx
│   └── shared/               # Componentes compartidos
│       └── DataTable.tsx
│
├── lib/                       # Utilidades y configuración
│   ├── tenants.ts            # Configuración de tenants
│   ├── module-loader.ts      # Sistema de carga de módulos
│   └── api/                  # Cliente API
│       ├── client.ts          # Cliente HTTP base
│       └── services/          # Servicios por entidad
│           ├── pacientes.ts
│           ├── citas.ts
│           └── terapeutas.ts
│
└── hooks/                     # Custom hooks
    └── usePacientes.ts
```

## 🚀 Getting Started

### Prerrequisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun

### Instalación

1. Clonar el repositorio
```bash
git clone <repo-url>
cd vaxa_web_new
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
# Crear archivo .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Ejecutar servidor de desarrollo
```bash
npm run dev
```

5. Abrir en el navegador
```
http://localhost:3000
```

## 📖 Uso

### Acceder a un Tenant

1. **Página principal**: Selecciona un tenant desde la lista
2. **URL directa**: `http://localhost:3000/empresa-demo`
3. **Navegación**: Cada tenant tiene su propia navegación

### Tenants Disponibles

- `empresa-demo`: Centro de Terapia Demo (tiene módulos custom)
- `centro-abc`: Centro ABC (usa módulos core)

### Agregar un Nuevo Tenant

1. Editar `lib/tenants.ts`:
```typescript
' nuevo-tenant': {
  id: 'nuevo-tenant',
  name: 'Nuevo Centro',
  primaryColor: 'purple',
  modules: {
    dashboard: true,
    pacientes: true,
    citas: true,
    terapeutas: true,
  },
  customModules: [], // O ['Dashboard'] si tiene custom
}
```

2. Acceder a: `http://localhost:3000/nuevo-tenant`

## 🔧 Desarrollo

### Crear un Módulo Core

```typescript
// modules/core/NuevoModulo/index.tsx
import { TenantConfig } from '@/lib/tenants';

interface NuevoModuloProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function NuevoModulo({ tenantId, tenant }: NuevoModuloProps) {
  return <div>Contenido del módulo</div>;
}
```

### Crear un Módulo Custom

1. Crear carpeta: `modules/extensions/[tenant-id]/[ModuleName]/`
2. Crear `index.tsx` con el componente
3. Agregar a `customModules` en `lib/tenants.ts`:
```typescript
customModules: ['ModuleName']
```

### Usar Componentes UI

```typescript
import { Button, Input, Select, Card } from '@/components/ui';

<Button variant="primary" size="md">Click me</Button>
<Input label="Nombre" placeholder="Ingresa nombre" />
<Select label="País">
  <option>Perú</option>
</Select>
<Card title="Título">Contenido</Card>
```

### Hacer Llamadas API

```typescript
import { pacientesService } from '@/lib/api';

// En Server Components
const pacientes = await pacientesService.getAll(tenantId, token);

// En Client Components
const { pacientes, loading, error } = usePacientes({
  tenantId,
  token,
});
```

## 🔌 Integración con Backend

### Configuración

El sistema envía automáticamente el header `x-tenant-id` en todas las peticiones. El backend NestJS debe:

1. **Leer el header** `x-tenant-id` en cada request
2. **Filtrar queries** por `tenant_id`
3. **Validar** que los recursos pertenezcan al tenant
4. **Asignar** `tenant_id` automáticamente al crear

### Ejemplo en NestJS

```typescript
// Interceptor que lee x-tenant-id
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    
    // Filtrar por tenantId en todas las queries
    // ...
  }
}
```

## 📁 Estructura Detallada

### `/app/[tenant]`
Rutas dinámicas de Next.js. Cada tenant tiene sus propias páginas que cargan módulos dinámicamente.

### `/modules/core`
Módulos base compartidos por todos los tenants. Si un tenant no tiene módulo custom, usa el core.

### `/modules/extensions`
Módulos personalizados por tenant. Sobrescriben los módulos core cuando están configurados.

### `/components/ui`
Componentes UI base reutilizables (Button, Input, Select, Card, etc.)

### `/lib/api`
Cliente HTTP y servicios para llamadas al backend. Incluye automáticamente `x-tenant-id` en todas las peticiones.

## 🎨 Tecnologías

- **Next.js 16**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utility-first
- **NextAuth.js**: Autenticación (configurar cuando sea necesario)

## 📝 Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

## 🔐 Variables de Entorno

```env
# URL del backend NestJS
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth (cuando lo configures)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key
```

## 📚 Documentación Adicional

- [API Client](./lib/api/README.md) - Documentación del cliente API
- [Componentes UI](./components/ui/README.md) - Documentación de componentes

## 🤝 Contribuir

1. Crear una rama para la feature
2. Hacer los cambios
3. Crear un Pull Request

## 📄 Licencia

[Tu licencia aquí]

---

**Desarrollado con ❤️ para gestión de centros de terapia**
