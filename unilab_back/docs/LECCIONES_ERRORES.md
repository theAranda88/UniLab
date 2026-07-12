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
- Solicitud (Estudiante) → `estado_solicitud: 'pendiente'`
- Resolución (Profesor del semillero) → `aceptado` | `rechazado`
- Autorización de publicación (Profesor) → `puede_publicar = true`

### ℹ️ Proyecto — estados válidos
`borrador` → `en_revision` → `aprobado` | `rechazado` → `publicado`

### ℹ️ Inscripciones — `estado_pago`
Solo aplica cuando `evento.requiere_pago = true`. Si `requiere_pago = false`, `estado_pago` debe ser `null`.
