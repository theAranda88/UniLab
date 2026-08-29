---
name: backend-crud
description: Crea tabla Prisma y CRUD backend completo (repository, service, controller, routes, Zod, Swagger, Postman). Usar cuando el usuario pide backend-crud, nueva tabla, nuevo módulo backend o CRUD simple.
---

# Skill: Backend CRUD Simple

## Descripción
Crear un nuevo modelo de datos en el backend con operaciones CRUD básicas (Crear, Listar, Actualizar, Eliminar).

**Incluye:** Tabla Prisma → Repository → Service → Controller → Routes → Validación Zod → Swagger

---

## Cuándo Usarlo

✅ **Usar este skill si:**
- Necesitas agregar una tabla nueva a la BD
- Requiere operaciones básicas (GET todos, GET por ID, POST, PUT, DELETE)
- La tabla tiene relaciones simples con otras tablas
- La lógica de negocio es directa (sin cascadas complejas, sin autorizaciones multi-step)

❌ **NO usar si:**
- La funcionalidad requiere lógica de negocio compleja → usa `backend-feature`
- Solo necesitas modificar algo existente → usa `refactor`
- Es un fix de bug → usa `debug-fix`

---

## Entrada Conversacional Esperada

```
"Necesito agregar un nuevo modelo [NOMBRE] con campos [CAMPO1: tipo, CAMPO2: tipo, ...].
Roles que pueden acceder: [ROLES].
Relaciones con otras tablas: [SI HAY].
¿Hay validaciones especiales?: [SI/NO y cuáles]."
```

### Ejemplo Concreto
```
"Necesito agregar un modelo 'Evento' con campos:
- nombre: string (requerido)
- descripcion: text (opcional)
- fecha_evento: timestamp (requerido)
- ubicacion: string (requerido)
- id_coordinador: integer FK -> usuarios (requerido)
- capacidad: integer (requerido, > 0)

Roles que pueden crear: Coordinador, Administrador.
Roles que pueden listar: todos.
Roles que pueden actualizar: creador + Administrador.

¿Hay validaciones?: Sí, capacidad mínima 1, fecha_evento > hoy."
```

---

## Proceso SDD

### 1️⃣ **SPEC** (Agent Guía)
El skill presentará en 1 párrafo:
- **Qué:** tabla con campos tipados
- **Dónde:** qué módulo en la BD (tabla nueva o adición a existente)
- **Quién:** roles que pueden acceder (por operación: CREATE, READ, UPDATE, DELETE)
- **Validaciones:** reglas de negocio o restricciones
- **Relaciones:** FK con otras tablas
- **Soft-delete:** siempre `deleted_at` en la tabla nueva
- **Auditoría:** siempre `created_at`, `updated_at`, `created_by`

**El agent espera tu confirmación o corrección antes de proceder.**

### 2️⃣ **CONFIRMACIÓN** (Usuario)
Confirma o ajusta la SPEC. Si hay ambigüedad:
- El agent hace UNA sola pregunta específica
- No avanza hasta tener certeza

### 3️⃣ **IMPLEMENTACIÓN Backend** (Agent Ejecuta)

#### 🔹 Paso 1: Actualizar schema Prisma
- Crear modelo `[Nombre]` en `schema.prisma`
- Incluir campos auditoria: `created_at`, `updated_at`, `created_by`, `deleted_at`
- Definir relaciones FK
- Crear índices únicos parciales si aplica (WHERE deleted_at IS NULL)

#### 🔹 Paso 2: Migración Prisma
```bash
cd unilab_back && npm run prisma:migrate
```
Genera migración SQL automática.

#### 🔹 Paso 3: Crear Repository
Archivo: `unilab_back/src/models/[nombre].repository.ts`

Métodos base (reutiliza patrón de otros):
- `crearUno(data)` — insert + return el registro creado
- `listarActivos(filtros?, paginacion?)` — SELECT con WHERE deleted_at IS NULL
- `obtenerPorId(id)` — SELECT por PK + filtro activo
- `actualizarUno(id, data)` — UPDATE + return actualizado
- `eliminarUno(id)` — UPDATE deleted_at = NOW() (soft-delete)

Todos filtran `deleted_at: null` automáticamente.

#### 🔹 Paso 4: Crear Service
Archivo: `unilab_back/src/services/[nombre].service.ts`

Incluye:
- Validaciones de negocio (ej. capacidad > 0)
- Verificación de permisos (quién puede hacer qué)
- Transacciones si hay múltiples operaciones
- Manejo de errores con `AppError`

```typescript
export const [nombre]Service = {
  crear: async (data: [NombreCreateInput], userId: number, userRole: string) => {
    // Validación de permiso
    if (!['Coordinador', 'Administrador'].includes(userRole)) {
      throw new AppError('No tienes permiso para crear eventos', 403);
    }
    // Validación de negocio
    if (data.capacidad < 1) {
      throw new AppError('Capacidad debe ser mayor a 0', 422);
    }
    // Crear
    return [nombre]Repository.crearUno({ ...data, created_by: userId });
  },
  // ... más métodos
};
```

#### 🔹 Paso 5: Crear Controller
Archivo: `unilab_back/src/controllers/[nombre].controller.ts`

Endpoints:
- `POST /api/[nombres]` → crear
- `GET /api/[nombres]` → listar con paginación
- `GET /api/[nombres]/:id` → obtener por ID
- `PUT /api/[nombres]/:id` → actualizar
- `DELETE /api/[nombres]/:id` → eliminar (soft-delete)

```typescript
export const [nombre]Controller = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const { user } = req; // del middleware verifyToken
    const resultado = await [nombre]Service.crear(req.body, user.id, user.role);
    res.status(201).json(resultado);
  }),
  // ... más endpoints
};
```

#### 🔹 Paso 6: Crear Zod Schema
Archivo: `unilab_back/src/middlewares/validation/schemas/index.ts`

Agregar:
```typescript
export const [nombre]CreateSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().optional(),
  fecha_evento: z.coerce.date(),
  ubicacion: z.string().min(1),
  capacidad: z.number().int().positive(),
  // ... otros campos
});

export const [nombre]UpdateSchema = [nombre]CreateSchema.partial();
```

#### 🔹 Paso 7: Registrar Routes
Archivo: `unilab_back/src/routes/[nombre].routes.ts`

```typescript
const router = Router();

router.post(
  '/',
  validate([nombre]CreateSchema),
  verifyToken,
  requireRole(['Coordinador', 'Administrador']),
  [nombre]Controller.crear
);

router.get(
  '/',
  verifyToken,
  [nombre]Controller.listar
);

// ... más rutas

export default router;
```

Registrar en `src/routes/index.ts`:
```typescript
import [nombre]Routes from './[nombre].routes';
router.use('/api/[nombres]', [nombre]Routes);
```

#### 🔹 Paso 8: Documentar Swagger (OBLIGATORIO)
Archivo: `unilab_back/src/docs/swagger/paths.ts`

Agregar documentación OpenAPI para TODOS los endpoints. Ref: [`.github/DOCUMENTACION.md`](../../.github/DOCUMENTACION.md)

```typescript
'/api/[nombres]': {
  post: {
    tags: ['[Nombre]'],
    summary: 'Crear nuevo [nombre]',
    description: '**Rol requerido:** Coordinador, Administrador. [Descripción completa].',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/[Nombre]Create' }
        }
      }
    },
    responses: {
      '201': { description: '[Nombre] creado' },
      '400': { description: 'Validación fallida' },
      '403': { description: 'Sin permiso' },
      '422': { description: 'Regla de negocio violada' }
    }
  },
  get: {
    tags: ['[Nombre]'],
    summary: 'Listar [nombres]',
    description: '**Rol requerido:** Todos autenticados. Retorna array paginado.',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': { description: 'Lista de [nombres]' },
      '401': { description: 'Sin token' }
    }
  },
  // ... PUT, DELETE (todos los métodos)
}
```

**También agregar schema:**

Archivo: `unilab_back/src/docs/swagger/components.ts`

```typescript
[Nombre]Create: {
  type: 'object',
  properties: {
    campo1: { type: 'string', description: 'Descripción', example: 'valor' },
    campo2: { type: 'number', description: 'Descripción', example: 100 }
  },
  required: ['campo1', 'campo2']
},
[Nombre]Response: {
  allOf: [
    { $ref: '#/components/schemas/[Nombre]Create' },
    {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 123 },
        created_at: { type: 'string', format: 'date-time' },
        created_by: { type: 'integer', example: 3 }
      }
    }
  ]
}
```

#### 🔹 Paso 9: Documentar Postman (OBLIGATORIO)
Archivo: `unilab_back/docs/postman_collection.json`

Agregar carpeta `[Nombre]` con requests (POST, GET, GET/:id, PUT, DELETE):

```json
{
  "name": "[Nombre]",
  "item": [
    {
      "name": "Listar [nombres]",
      "request": {
        "method": "GET",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
        "url": { "raw": "{{base_url}}/api/[nombres]", "host": ["{{base_url}}"], "path": ["api", "[nombres]"] }
      }
    },
    {
      "name": "Crear [nombre]",
      "request": {
        "method": "POST",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
        "body": { "mode": "raw", "raw": "{\"campo1\": \"valor1\", \"campo2\": 100}" },
        "url": { "raw": "{{base_url}}/api/[nombres]" }
      }
    },
    {
      "name": "Obtener [nombre]",
      "request": {
        "method": "GET",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
        "url": { "raw": "{{base_url}}/api/[nombres]/{{id_[nombre]}}" }
      }
    }
  ]
}
```

Verifica que variables como `{{base_url}}`, `{{token}}`, `{{id_[nombre]}}` estén en `postman_environment.json`.

### 4️⃣ **VALIDACIÓN** (Agent + Usuario)

Agent compila backend y valida:
```bash
npm run build
```

Pruebas conversacionales:
- ✅ Endpoint POST: crear un registro → retorna 201 + datos
- ✅ Endpoint GET: listar → retorna 200 + array
- ✅ Endpoint GET /:id: obtener uno → retorna 200 + registro
- ✅ Endpoint PUT /:id: actualizar → retorna 200 + actualizado
- ✅ Endpoint DELETE /:id: eliminar → retorna 204 o 200
- ✅ Soft-delete verificado: registro no aparece en GET pero existe en BD
- ✅ Permisos: usuario sin rol intenta crear → retorna 403
- ✅ Validación Zod: envía datos inválidos → retorna 400 con mensaje

---

## Checklist de Salida

- [ ] Tabla agregada en `schema.prisma` con auditoria + soft-delete
- [ ] Migración Prisma ejecutada exitosamente
- [ ] Repository con métodos CRUD (todos filtran `deleted_at`)
- [ ] Service con validaciones de negocio + permisos
- [ ] Controller con 5 endpoints (POST, GET, GET/:id, PUT, DELETE)
- [ ] Routes registradas en `src/routes/index.ts`
- [ ] Zod schemas creados y vinculados en rutas
- [ ] **Swagger documentado COMPLETO** (path + schema para todos los endpoints)
- [ ] **Postman collection actualizado** (con requests de ejemplo y variables)
- [ ] Backend compila sin errores: `npm run build`
- [ ] Permisos por rol funciona correctamente
- [ ] Soft-delete verificado (registro no en SELECT, pero en BD)
- [ ] Swagger UI funciona: http://localhost:3000/api-docs (endpoint visible)
- [ ] Postman requests funciona (copiar token, probar cada request)

---

## No Incluye Este Skill

❌ Frontend (se hace con `frontend-crud`)  
❌ Tests unitarios (no configurados aún)  
❌ Lógica de negocio compleja (usar `backend-feature`)

---

## Ejemplo Completo Referencia

Ver módulo existente `Semillero` en:
- `unilab_back/prisma/schema.prisma` → búscar `model Semillero`
- `unilab_back/src/models/semillero.repository.ts`
- `unilab_back/src/services/semillero.service.ts`
- `unilab_back/src/controllers/semillero.controller.ts`
- `unilab_back/src/routes/semillero.routes.ts`

---

## Tips & Trampas Comunes

⚠️ **Olvidar soft-delete en todas las operaciones** — Revisa que TODO `findMany`/`findFirst` filtre por `deleted_at: null`  
⚠️ **No incluir `created_by` en inserts** — Siempre pasa el `userId` del token  
⚠️ **Olvidar registrar route en index.ts** — El endpoint no funciona si no está aquí  
⚠️ **Validaciones solo en Zod** — También valida en el service (ej. "capacidad > 0")  
⚠️ **Swagger desactualizado** — Documenta mientras codificas, no al final

---

**¿Listo? Sigue el formato de entrada arriba en el chat y comienza el SDD. El agent guiará cada paso.**
