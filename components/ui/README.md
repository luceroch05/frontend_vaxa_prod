# Componentes UI

Componentes base reutilizables para toda la aplicación.

## Uso

```tsx
import { Button, Input, Select, Card } from '@/components/ui';

// Button
<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" isLoading>Guardando...</Button>

// Input
<Input 
  label="Nombre" 
  placeholder="Ingresa tu nombre"
  error="Este campo es requerido"
/>

// Select
<Select label="País" required>
  <option value="">Selecciona...</option>
  <option value="pe">Perú</option>
  <option value="mx">México</option>
</Select>

// Card
<Card title="Título" headerActions={<Button>Acción</Button>}>
  Contenido de la tarjeta
</Card>
```

## Estructura

- `/components/ui/` - Componentes base (Button, Input, Select, Card, etc.)
- `/components/shared/` - Componentes compartidos (DataTable, FormWrapper, etc.)
- `/components/tenants/[tenant-id]/` - Componentes específicos por tenant

