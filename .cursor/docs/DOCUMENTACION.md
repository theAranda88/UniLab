# 📚 Documentación — Parte Obligatoria del SDD

## Principio

**Toda funcionalidad nueva requiere documentación actualizada.** No es opcional. Es parte del workflow SDD.

- 🟢 **Swagger** — Para descubrimiento automático de API + testing interactivo
- 🟢 **Postman** — Para ejemplos + flujos reutilizables  
- 🟢 **i18n** — Descripciones y tags en español

**Ubicaciones:**
```
unilab_back/
├── src/docs/
│   ├── swagger.ts              ← Config principal
│   └── swagger/
│       ├── paths.ts            ← Endpoints (POST, GET, PUT, DELETE, etc.)
│       └── components.ts       ← Schemas (DTO, response, error)
└── docs/
    ├── postman_collection.json ← Colección con ejemplos
    ├── postman_environment.json ← Entorno local (npm run dev)
    ├── postman_environment.docker.json ← Entorno Docker Compose
    └── postman_environment.production.json ← Plantilla producción
```

---

## Cuándo Documentar

| Actividad | Swagger | Postman |
|-----------|---------|---------|
| Crear endpoint nuevo | ✅ OBLIGATORIO | ✅ OBLIGATORIO |
| Crear schema/modelo | ✅ OBLIGATORIO | — |
| Actualizar endpoint existente | ✅ OBLIGATORIO | ✅ Actualizar |
| Bug fix en endpoint | ✅ Si cambia behavior | ✅ Si cambia flow |

---

## Estructura Swagger

### 1️⃣ **Path en `src/docs/swagger/paths.ts`**

Formato:
```typescript
'/api/[recurso]': {
  get: {
    tags: ['[NombreModulo]'],
    summary: 'Breve descripción',
    description: 'Descripción completa. Roles requeridos, validaciones especiales.',
    security: [{ bearerAuth: [] }],  // o [] si es público
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID del recurso',
        example: 123
      }
    ],
    responses: {
      200: {
        description: 'Éxito',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/[NombreSchema]' }
          }
        }
      },
      400: err[400],
      401: err[401],
      403: err[403],
      404: err[404],
      422: err[422]
    }
  }
}
```

### 2️⃣ **Schema en `src/docs/swagger/components.ts`**

Formato:
```typescript
[NombreSchema]: {
  type: 'object',
  properties: {
    id_recurso: {
      type: 'integer',
      description: 'Identificador único',
      example: 123
    },
    nombre: {
      type: 'string',
      description: 'Nombre del recurso',
      minLength: 3,
      maxLength: 255,
      example: 'Mi Recurso'
    },
    descripcion: {
      type: 'string',
      nullable: true,
      description: 'Descripción opcional',
      example: 'Detalle del recurso'
    },
    estado: {
      type: 'string',
      enum: ['activo', 'inactivo'],
      description: 'Estado del recurso',
      example: 'activo'
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de creación',
      example: '2025-07-12T10:30:00Z'
    }
  },
  required: ['id_recurso', 'nombre', 'estado']
}
```

### 3️⃣ **Tags para Agrupar**

En `swagger.ts`, tags agrupa endpoints por módulo:
```typescript
tags: [
  { name: 'Auth', description: 'Autenticación' },
  { name: 'Eventos', description: 'Gestión de eventos' },
  { name: 'Usuarios', description: 'Gestión de usuarios' }
]
```

Cada endpoint usa: `tags: ['Eventos']` para aparecer en esa sección.

---

## Estructura Postman

### 1️⃣ **Carpeta por Módulo**

```
UniLab (Collection)
├── Auth
│   ├── Login
│   ├── Register
│   └── Cambiar Password
├── Eventos
│   ├── Listar Eventos
│   ├── Crear Evento
│   ├── Obtener Evento
│   └── Inscribirse
├── Usuarios
│   ├── Listar Usuarios
│   ├── Crear Usuario
│   └── Obtener Usuario
```

### 2️⃣ **Estructura de Request**

Cada request incluye:
```json
{
  "name": "Crear Evento",
  "request": {
    "method": "POST",
    "header": [
      { "key": "Authorization", "value": "Bearer {{token}}" },
      { "key": "Content-Type", "value": "application/json" }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\"nombre_evento\": \"Conferencia 2025\", ...}"
    },
    "url": {
      "raw": "{{base_url}}/api/eventos",
      "host": ["{{base_url}}"],
      "path": ["api", "eventos"]
    }
  }
}
```

### 3️⃣ **Variables de Entorno (`postman_environment.json`)**

```json
{
  "name": "UniLab",
  "values": [
    { "key": "base_url", "value": "http://localhost:3000", "enabled": true },
    { "key": "token", "value": "", "enabled": true },
    { "key": "id_evento", "value": "1", "enabled": true },
    { "key": "id_usuario", "value": "5", "enabled": true }
  ]
}
```

Usa con: `{{base_url}}`, `{{token}}`, `{{id_evento}}`, etc.

---

## Pasos para Documentar Nuevo Endpoint

### Paso 1: Agregar Path a Swagger

Archivo: `src/docs/swagger/paths.ts`

```typescript
// Agregar al objeto paths:

'/api/eventos/{id}/jornadas': {
  post: {
    tags: ['Eventos'],
    summary: 'Crear jornada para evento',
    description: '**Rol requerido:** Administrador. Crea una nueva jornada dentro de un evento.',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID del evento',
        example: 1
      }
    ],
    requestBody: jsonBody('#/components/schemas/JornadaCreateRequest'),
    responses: {
      201: {
        description: 'Jornada creada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JornadaResponse' }
          }
        }
      },
      400: err[400],
      401: err[401],
      403: err[403],
      404: err[404],
      422: err[422]
    }
  }
}
```

### Paso 2: Agregar Schemas a Swagger

Archivo: `src/docs/swagger/components.ts`

```typescript
export const schemas = {
  // ... schemas existentes ...
  
  JornadaCreateRequest: {
    type: 'object',
    properties: {
      fecha: {
        type: 'string',
        format: 'date',
        description: 'Fecha de la jornada (YYYY-MM-DD)',
        example: '2025-08-15'
      },
      hora_inicio: {
        type: 'string',
        description: 'Hora de inicio (HH:mm)',
        example: '09:00'
      },
      hora_fin: {
        type: 'string',
        description: 'Hora de fin (HH:mm)',
        example: '12:00'
      },
      lugar: {
        type: 'string',
        description: 'Lugar donde se realiza',
        example: 'Salón 301'
      }
    },
    required: ['fecha', 'hora_inicio', 'hora_fin']
  },

  JornadaResponse: {
    type: 'object',
    properties: {
      id_jornada: { type: 'integer', example: 42 },
      id_evento: { type: 'integer', example: 1 },
      fecha: { type: 'string', format: 'date', example: '2025-08-15' },
      hora_inicio: { type: 'string', example: '09:00' },
      hora_fin: { type: 'string', example: '12:00' },
      lugar: { type: 'string', example: 'Salón 301' },
      created_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'integer', example: 3 }
    }
  }
}
```

### Paso 3: Agregar a Postman

Archivo: `docs/postman_collection.json`

```json
{
  "name": "Crear Jornada",
  "request": {
    "method": "POST",
    "header": [
      { "key": "Authorization", "value": "Bearer {{token}}" },
      { "key": "Content-Type", "value": "application/json" }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\"fecha\": \"2025-08-15\", \"hora_inicio\": \"09:00\", \"hora_fin\": \"12:00\", \"lugar\": \"Salón 301\"}"
    },
    "url": {
      "raw": "{{base_url}}/api/eventos/{{id_evento}}/jornadas",
      "host": ["{{base_url}}"],
      "path": ["api", "eventos", "{{id_evento}}", "jornadas"]
    }
  }
}
```

### Paso 4: Probar en Swagger UI

```bash
cd unilab_back && npm run dev
# Ir a: http://localhost:3000/api-docs/
# Buscar "Crear Jornada" bajo "Eventos"
# Probar directamente desde UI
```

---

## Checklist de Documentación

Para CUALQUIER skill que cree endpoint:

- [ ] Path agregado a `src/docs/swagger/paths.ts`
- [ ] Esquemas agregados a `src/docs/swagger/components.ts`
- [ ] Tag correcto (ej: `['Eventos']`)
- [ ] `summary` conciso (< 80 caracteres)
- [ ] `description` en español
- [ ] `security` definido (si requiere `bearerAuth` o es público `[]`)
- [ ] `parameters` documentados (path, query)
- [ ] `requestBody` con ref a schema
- [ ] `responses` con 200 y códigos de error (400, 401, 403, 404, 422)
- [ ] Request agregado a Postman (con variables `{{...}}`)
- [ ] Variables de entorno en `postman_environment.json` (si nueva)
- [ ] Probar en Swagger UI (http://localhost:3000/api-docs/)
- [ ] Probar en Postman (importar collection)

---

## Ejemplo Completo: Nuevo Endpoint

### Backend (código)
```typescript
// routes/evento.routes.ts
router.post(
  '/:id/jornadas',
  verifyToken,
  requireRole(['Administrador']),
  validate(jornadaSchema),
  eventoController.crearJornada
);
```

### Documentación (Swagger)
```typescript
'/api/eventos/{id}/jornadas': {
  post: {
    tags: ['Eventos'],
    summary: 'Crear jornada',
    // ... (completo arriba)
  }
}
```

### Documentación (Postman)
```json
{
  "name": "Crear Jornada",
  "request": {
    "method": "POST",
    "url": "{{base_url}}/api/eventos/{{id_evento}}/jornadas",
    "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
    "body": { "mode": "raw", "raw": "{...}" }
  }
}
```

### Resultado
✅ Endpoint funciona  
✅ Swagger documenta  
✅ Postman facilita testing  
✅ Desarrolladores entienden cómo usar

---

## Por Qué Documentar

1. **Descubrimiento** — Nuevos devs entienden qué endpoints existen
2. **Testing Interactivo** — Swagger UI + Postman for manual testing
3. **Contrato** — Frontend sabe exactamente qué esperar (schema)
4. **Validación** — Validaciones documentadas == más claras
5. **Colaboración** — No hay preguntas "¿cómo se usa X endpoint?"

---

## Integración con Skills SDD

Cada skill ahora incluye:

### En `backend-crud` Skill:
```
#### 🔹 Paso 8: Documentar Swagger ← OBLIGATORIO
[Agregar path + schema]

#### 🔹 Paso 9: Documentar Postman ← OBLIGATORIO
[Agregar request con ejemplos]
```

### En `backend-to-frontend-integration` Skill:
```
#### 🔹 Paso 5: Validar Documentación
[Frontend consume endpoints documentados]
```

### En `debug-fix` Skill:
```
#### 🔹 Paso 3: Actualizar Documentación
[Si cambió behavior del endpoint]
```

---

## Herramientas

| Herramienta | Para Qué | URL |
|-------------|----------|-----|
| **Swagger UI** | Probar endpoints interactivamente | http://localhost:3000/api-docs |
| **Postman** | Colecciones reutilizables + testing | Import `postman_collection.json` |
| **VS Code** | Editar JSON schemas | `src/docs/swagger/` |

---

## Tips

⚠️ **Mantén Swagger y Postman sincronizados** — Si cambias un endpoint, actualiza ambos  
⚠️ **Usa variables Postman `{{...}}`** — No hardcodes URLs/IDs  
⚠️ **Describe roles requeridos** — En `description` menciona `requireRole(['Admin', ...])`  
⚠️ **Ejemplos reales** — `example: 123` no `example: "id"`, `example: "2025-07-12T10:30:00Z"` no `"date"`  
⚠️ **Códigos HTTP completos** — No solo 200, incluye 400, 401, 403, 404, 422

---

**Documentación es código. Mantenla actualizada. Es parte del SDD.**
