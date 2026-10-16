# Lecciones y Errores Comunes — UniLab SDD

> Registro de problemas descubiertos durante el desarrollo. Consultar antes de implementar.

---

## Prisma

### ⚠️ `@@unique` con `where: { deleted_at: null }` (índice parcial)
- **Qué pasa:** Prisma genera el índice pero en tiempo de query **no lo aplica automáticamente** en los `findFirst`/`findMany`. Hay que filtrar siempre por `deleted_at: null` manualmente.
- **Solución:** Siempre usar `where: { ...activo }` del `base.repository` en las búsquedas de unicidad.
- **Afecta:** `usuarios.email`, `curso_autorizaciones.(id_curso, id_estudiante)`, `semillero_miembros.(id_semillero, id_estudiante)`, `calificaciones.(id_proyecto, id_usuario)`, `inscripciones.(id_evento, id_usuario)`, `asistencias.(id_inscripcion, id_jornada)`

### ⚠️ Relaciones inversas en `usuarios` — nombres de relación ambiguos
- **Qué pasa:** `usuarios` tiene múltiples relaciones hacia la misma tabla (e.g., `proyectos_como_creador` vs `proyectos_como_aprobador`). Prisma requiere el nombre de relación explícito.
- **Solución:** Al hacer `include` desde `usuarios` hacia `proyectos`, especificar la relación con su nombre exacto del schema.

### ⚠️ `previewFeatures = ["partialIndexes"]` requerido
- **Qué pasa:** Sin esta flag en el generator, los `@@unique` con `where:` no compilan.
- **Estado:** Ya está en el schema. No remover.

### ⚠️ Soft-delete en tablas con `@@id` compuesto
- **Qué pasa:** `proyecto_coordinadores`, `proyecto_autores`, `semillero_profesores` usan `@@id([col1, col2])` — no tienen `id_` autoincrement. El soft-delete se hace con `update({ where: { col1_col2: { col1, col2 } }, data: { deleted_at: new Date() } })`.
- **Solución:** El `where` debe usar el nombre del campo compuesto que genera Prisma (formato `col1_col2`).

---

## TypeScript / Express

### ⚠️ `noUnusedParameters: true` — parámetros de Express no usados
- **Qué pasa:** En middlewares con firma `(req, res, next)`, si `res` no se usa TypeScript falla.
- **Solución:** Prefijar con `_`: `_res`, `_next`. Patrón ya en uso en el proyecto (ver `verifyToken.ts`).

### ⚠️ Express 5 — `asyncHandler` necesario
- **Qué pasa:** En Express 5, los async handlers que lanzan excepciones **sí** las propagan al error handler automáticamente, pero el proyecto usa `asyncHandler` por consistencia y compatibilidad con el error handler.
- **Solución:** Siempre envolver controllers en `asyncHandler`.

### ⚠️ `req.user` no tipado por defecto
- **Qué pasa:** `req.user` no existe en el tipo base de Express. Se extiende en `src/types/express.d.ts`.
- **Solución:** Si se agregan campos al payload JWT, actualizar también `express.d.ts` y `types.ts` en `middlewares/auth/`.

---

## Zod 4.x

### ⚠️ `z.coerce.number()` para params de URL
- **Qué pasa:** Los params de Express llegan como `string`. Sin `coerce`, Zod 4 falla la validación de `number`.
- **Solución:** Usar `z.coerce.number().int().positive()` en schemas de `params`. Ya presente en `idParamSchema`.

### ⚠️ `.optional()` vs `.nullable()` vs `.nullish()`
- **Qué pasa:** Campos opcionales en body deben ser `.optional()`. Campos que pueden llegar como `null` desde el frontend necesitan `.nullable()`. Prisma devuelve `null` para opcionales — no `undefined`.
- **Solución:** Para campos que mapean a `String?` en Prisma, usar `.optional()` en el schema Zod de entrada pero esperar `null | undefined` en el service.

---

## Auth / Seguridad

### ⚠️ `checkPrimerLogin` solo bloquea si hay usuario en `req.user`
- **Qué pasa:** El middleware verifica `req.user?.primer_login`. Si el token no se verificó antes (ruta pública), pasa sin bloquear.
- **Solución:** `checkPrimerLogin` siempre debe ir **después** de `verifyToken` en el stack de middlewares.

### ⚠️ `verifyTokenOpcional` no establece `req.user` si no hay token
- **Qué pasa:** Para rutas que necesitan comportamiento diferente con/sin auth, `verifyTokenOpcional` no llama a `next(error)` — simplemente llama `next()` sin usuario.
- **Solución:** En el controller/service verificar `req.user` con optional chaining antes de usarlo.

---

## Reglas de negocio

### ℹ️ `primer_login = true` → password generada aleatoriamente
- Al crear usuario por admin (`POST /usuarios`), la password es generada con `generarPasswordAleatoria()` y `primer_login = true`. La respuesta incluye la password en plano (una sola vez).

### ℹ️ Semillero — flujo de membresía
- Solicitud (Estudiante, solo para sí mismo) → `estado_solicitud: 'pendiente'`. Bloqueada si `semilleros_solicitudes_abiertas = false` o el semillero está inactivo.
- Resolución (solo el **profesor líder**) → `aprobado` | `rechazado`. Un rechazo revoca `puede_publicar`.
- Tras un rechazo, el estudiante puede volver a postularse (la membresía vuelve a `pendiente`).
- Autorización de publicación (profesor líder, solo a miembros `aprobado`) → `puede_publicar = true`.

### ℹ️ Proyecto — estados válidos
`borrador` → `en_revision` → `aprobado` | `rechazado` → `publicado`

### ℹ️ Inscripciones — `estado_pago`
Solo aplica cuando `evento.requiere_pago = true`. Si `requiere_pago = false`, `estado_pago` debe ser `null`.

---

## Seguridad y contratos con el front

### ⚠️ `include: { usuario: true }` expone `password_hash`
- **Qué pasa:** incluir un usuario completo en una relación devuelve todas sus columnas, incluido el hash de la contraseña. Pasó en `semillero.repository` (líder, profesores y miembros).
- **Solución:** incluir siempre usuarios con `select` acotado (`id_usuario`, `nombres`, `apellidos`, `email`).

### ⚠️ 403 para reglas de negocio rompe el front
- **Qué pasa:** el interceptor HTTP del front redirige **cualquier 403** a «Acceso denegado». Un 403 por «registro cerrado» sacaba al visitante del formulario.
- **Solución:** 403 solo para permisos de rol. Reglas de negocio y parámetros de configuración → **422** con mensaje claro.

### ⚠️ Volver a insertar en tablas con `@@id` compuesto y soft-delete
- **Qué pasa:** en `semillero_profesores`, retirar un profesor (soft-delete) y volver a asignarlo hacía fallar el `create` por clave duplicada.
- **Solución:** buscar con `findUnique` por la clave compuesta; si existe con `deleted_at`, restaurarlo (`deleted_at: null`) en lugar de crear.

---

## Herramientas

### ⚠️ `vitest` 4.x rompe `npm install` desde cero
- **Qué pasa:** con npm 10, una instalación limpia (como la del Dockerfile, sin lockfile) falla con `Cannot read properties of null (reading 'edgesOut')`.
- **Solución:** backend con `vitest@^3.2`; frontend con `vitest@~4.0.8` (Angular 21 necesita la 4). No subir sin probar `npm install` en una carpeta vacía.

### ⚠️ Migraciones a mano sin base de datos
- **Qué pasa:** sin PostgreSQL disponible no se puede usar `prisma migrate dev`.
- **Solución:** escribir el SQL en `prisma/migrations/<timestamp>_<nombre>/migration.sql` siguiendo el estilo de las existentes, validar con `npx prisma validate` y `npx prisma generate`. El contenedor lo aplica al arrancar (`migrate deploy`).

