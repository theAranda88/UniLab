# SDD ROUTER — Flujos de Trabajo Coordinados

Este archivo es tu **brújula** para navegar el sistema SDD de UniLab. Selecciona el skill que corresponda según el tipo de trabajo que necesitas hacer.

---

## ⚡ Flujos Principales

### 🔌 **BACKEND: CRUD Simple** → Skill: `backend-crud`

**Cuándo usarlo:**
- Crear nuevo modelo de datos que requiere tabla en BD
- Agregar nuevo módulo con operaciones básicas (crear, listar, actualizar, eliminar)
- Incluye: tabla Prisma → repository → service → controller → routes → Zod schema → Swagger

**Entrada conversacional:**
```
"Necesito agregar un nuevo modelo [NOMBRE] con campos [CAMPO1: tipo1, CAMPO2: tipo2, ...]. 
Roles que pueden acceder: [ROLES]. Relaciones con otras tablas: [SI HAY]."
```

**Salida esperada:**
- ✅ Schema Prisma actualizado
- ✅ Repository con queries CRUD
- ✅ Service con lógica de negocio (validaciones, soft-delete, permisos)
- ✅ Controller con endpoints tipados
- ✅ Routes registradas en index.ts
- ✅ Zod schemas en validation/schemas
- ✅ **Swagger documentado (paths + schemas)** ← OBLIGATORIO
- ✅ **Postman collection actualizado** ← OBLIGATORIO (ref: [DOCUMENTACION.md](./DOCUMENTACION.md))
- ✅ Frontend no incluido (separar del backend)

---

### 🎨 **FRONTEND: CRUD Simple** → Skill: `frontend-crud`

**Cuándo usarlo:**
- Crear módulo en frontend para consumir un modelo backend
- Incluye: servicio, listado, formulario, componentes de CRUD
- Usa Signals, i18n, reactive forms, standalone components

**Entrada conversacional:**
```
"Necesito un CRUD frontend para [MODELO]. 
Campos a mostrar: [CAMPO1, CAMPO2, ...]. 
Permisos/filtros especiales: [SI HAY]."
```

**Salida esperada:**
- ✅ Service con HttpClient tipado
- ✅ Componente de listado con Signals
- ✅ Componente de formulario con reactive forms
- ✅ Traducciones i18n agregadas a es.json y en.json
- ✅ Integración en app.routes.ts con lazy loading

---

### 🏗️ **BACKEND: Feature Compleja** → Skill: `backend-feature`

**Cuándo usarlo:**
- Implementar lógica de negocio compleja (ej. flujo de autorización de publicación en semillero)
- Requiere validaciones de cascada, transacciones, o múltiples entidades
- La tabla YA EXISTE en el esquema de BD

**Entrada conversacional:**
```
"Necesito implementar [DESCRIPCIÓN DE FLUJO]. 
Actores involucrados: [ROLES]. 
Estado inicial: [ESTADO]. Estado final: [ESTADO]. 
Validaciones: [LISTA]. Cambios en otras tablas: [SI HAY]."
```

**Salida esperada:**
- ✅ Lógica de negocio en service
- ✅ Endpoint nuevo en controller + routes
- ✅ Validaciones Zod
- ✅ **Swagger documentado** ← OBLIGATORIO (ref: [DOCUMENTACION.md](./DOCUMENTACION.md))
- ✅ **Postman collection actualizado** ← OBLIGATORIO
- ✅ Prueba conversacional de la lógica (confirmar casos de uso)

---

### 💻 **FRONTEND: Feature Compleja** → Skill: `frontend-feature`

**Cuándo usarlo:**
- Componente de interfaz compleja (ej. editor de contenido, modal con validaciones anidadas)
- Múltiples pasos, validaciones locales, o interacciones no-triviales
- Requiere varios componentes o servicios nuevos

**Entrada conversacional:**
```
"Necesito implementar [DESCRIPCIÓN]. 
Flujo del usuario: [PASOS]. Validaciones: [LISTA]. 
Estado previo/posterior: [CAMBIOS]."
```

**Salida esperada:**
- ✅ Componente(s) standalone
- ✅ Servicios con lógica de estado
- ✅ Validaciones en reactive forms
- ✅ i18n para todos los textos
- ✅ Prueba funcional (entrada → salida esperada)

---

### 🔐 **FLUJO DE AUTENTICACIÓN** → Skill: `auth-flow`

**Cuándo usarlo:**
- Modificar login, cambio de contraseña, roles, o control de acceso
- Afecta la tabla `usuarios`, `roles`, o los middlewares `verifyToken` / `checkPrimerLogin` / `requireRole`

**Entrada conversacional:**
```
"Necesito ajustar [COMPONENTE DE AUTH]. 
Cambio: [DESCRIPCIÓN]. 
Roles afectados: [ROLES]. 
¿Cambia primer_login? [SI/NO]. 
¿Cambia token? [SI/NO]."
```

**Salida esperada:**
- ✅ Cambios en backend + middleware + service de auth
- ✅ Cambios en frontend: componentes de login, cambio de contraseña
- ✅ JWT/token actualizado (si aplica)
- ✅ Tests conversacionales de permiso por rol
- ✅ Confirmación: qué sucede si un usuario no autorizado intenta acceder

---

### 🔗 **BACKEND → FRONTEND INTEGRATION (i18n)** → Skill: `backend-to-frontend-integration`

**Cuándo usarlo:**
- Backend COMPLETAMENTE funcional existe (todos los endpoints)
- Necesitas frontend que lo consume CORRECTAMENTE
- Hay permisos por rol (Admin, Profesor, Estudiante, etc.)
- Necesitas VALIDACIÓN CRUZADA (frontend respeta permisos backend)
- Quieres UI DIFERENCIADA por rol (botones, secciones distintas)

**Entrada conversacional:**
```
"Necesito: backend-to-frontend-integration

Módulo: [NOMBRE - ej: Eventos]
Backend: [RUTA archivo principal]

Roles y permisos:
- Admin: puede [ACCIONES]
- Profesor: puede [ACCIONES]
- Estudiante: puede [ACCIONES]

UI esperada: [DESCRIPCIÓN O IMAGEN]
(Opcionalmente comparte mockup/wireframe)"
```

**Salida esperada:**
- ✅ Análisis automático de endpoints backend
- ✅ Extracción de roles y permisos desde `requireRole()`
- ✅ Service con validación de permisos por rol
- ✅ Componentes diferenciados por rol (Admin ve crear, Profesor ve solo listar, etc.)
- ✅ Doble validación: frontend + backend coinciden
- ✅ i18n completado (textos + errores de permisos traducidos)
- ✅ Frontend compila, permisos validados end-to-end

---

**Cuándo usarlo:**
- Agregar nuevo componente/página que necesita traducciones
- Traducir sección existente
- Cambiar idioma por defecto o agregar idioma nuevo

**Entrada conversacional:**
```
"Necesito traducir [COMPONENTE/SECCIÓN]. 
Idiomas: [IDIOMAS]. 
Nuevas claves a traducir: [LISTA O COMPONENTE]."
```

**Salida esperada:**
- ✅ Nuevas claves en es.json y en.json
- ✅ Template usando {{ 'namespace.key' | translate }}
- ✅ Archivo compilado sin errores
- ✅ Verificación en navegador (página recargada en español/inglés)

---

### 🐛 **DEBUG / FIX** → Skill: `debug-fix`

**Cuándo usarlo:**
- Reportas un error específico
- El sistema no compila, tiene comportamiento inesperado, o test falla

**Entrada conversacional:**
```
"[SÍNTOMA]. Pasos para reproducir: [PASOS]. 
Contexto: [BACKEND/FRONTEND]. 
Entorno: [DESARROLLO/PRODUCCIÓN]. 
Mensaje de error (si hay): [ERROR]."
```

**Salida esperada:**
- ✅ Diagnóstico: explicación de por qué falla
- ✅ Raíz: identificación de la causa real
- ✅ Solución: cambio mínimo necesario (no parches cosméticos)
- ✅ Validación: cómo verificar que está arreglado

---

### 📊 **REFACTOR / MANTENIMIENTO** → Skill: `refactor`

**Cuándo usarlo:**
- Mejorar código existente sin cambiar su comportamiento
- Reducir deuda técnica
- Reorganizar estructura

**Entrada conversacional:**
```
"El módulo [MÓDULO] necesita refactoring porque [RAZÓN].
Área afectada: [ARCHIVO/CARPETA]. 
Beneficio esperado: [MEJORA]."
```

**Salida esperada:**
- ✅ Cambios mínimos pero significativos
- ✅ Comportamiento externo sin cambios
- ✅ Código más legible, reutilizable, o performante
- ✅ Confirmación antes de ejecutar

---

## 🎯 Cómo usar este ROUTER

1. **Identifica tu caso** — Lee las 8 opciones arriba y selecciona la que más se parece
2. **Invoca el skill** — En el chat conversatorio, escribe:
   ```
   "Necesito: [NOMBRE DEL SKILL]
   Descripción: [TU CASO EN DETALLE USANDO EL FORMATO SUGERIDO]"
   ```
3. **El skill guía el SDD** — El skill correspondiente:
   - Define la SPEC con precisión
   - Pide confirmación antes de codificar
   - Ejecuta el backend completo primero (si aplica)
   - Luego frontend
   - Valida el resultado
4. **Iteración — Si falta algo, comunica en el chat** y el skill se adapta

---

## 📋 Referencia Rápida: Cuándo Usar Cada Skill

| Necesidad | Skill | Backend | Frontend | Complejidad |
|-----------|-------|---------|----------|-------------|
| Tabla + CRUD básico | `backend-crud` | ✅ | ❌ | Baja |
| Listado + Formulario | `frontend-crud` | ❌ | ✅ | Baja |
| Backend exists, crear UI con permisos por rol | `backend-to-frontend-integration` | Analiza | ✅ | Media |
| Validación compleja, cascadas | `backend-feature` | ✅ | ❌ | Alta |
| Modal multi-paso, estado complejo | `frontend-feature` | ❌ | ✅ | Alta |
| Login, cambio password, roles | `auth-flow` | ✅ | ✅ | Alta |
| Nuevas traducciones | `i18n-feature` | ❌ | ✅ | Baja |
| Error o comportamiento inesperado | `debug-fix` | ✅ | ✅ | Variable |
| Mejorar código sin cambiar comportamiento | `refactor` | ✅ | ✅ | Variable |

---

## 🔗 Contexto Siempre Vigente

- **Esquema de BD**: [`00-esquema-bd-referencia.md`](../../00-esquema-bd-referencia.md) — LA FUENTE DE VERDAD
- **Instrucciones globales**: [`unilab-global.mdc`](../rules/unilab-global.mdc)
- **Backend**: [`../rules/backend.mdc`](../rules/backend.mdc)
- **Frontend**: [`../rules/frontend.mdc`](../rules/frontend.mdc)
- **Roles del sistema**: Administrador, Coordinador, Profesor, Estudiante, Externo (fijos, no cambiar)
- **Códigos HTTP**: 200, 201, 204 (éxito), 400, 401, 403, 404, 409, 422, 500 (error)

---

## ⚙️ Reglas Transversales (Aplican a Todos los Skills)

1. **SDD primero** — Especificación antes de código. Espera confirmación.
2. **Conversacional, no documental** — No se generan `.md` de análisis. Todo es en el chat.
3. **Modularidad** — Una funcionalidad a la vez. No mezcles módulos en un mismo cambio.
4. **Consistencia** — Busca similares antes de crear nuevo. Reutiliza.
5. **Soft-delete obligatorio** — Nunca borrado físico en backend.
6. **i18n obligatorio** — Ningún texto quemado en templates.
7. **Sin parches** — Si necesita refactor, propón el mínimo y espera OK.

---

**¿Listo para empezar? Elige un skill arriba, sigue su formato de entrada, y comienza el flujo SDD.**
