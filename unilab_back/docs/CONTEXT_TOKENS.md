# Guía de Ahorro de Tokens — UniLab SDD

> Uso interno del agente. No modificar manualmente.

## Stack resumido (para no releer package.json)

- **Runtime:** Node.js + TypeScript (ES2022, module Node16, strict mode total)
- **Framework:** Express 5.x
- **ORM:** Prisma 7.x + adapter-pg → PostgreSQL
- **Auth:** JWT (jsonwebtoken 9.x), bcrypt 6.x
- **Validación:** Zod 4.x
- **Docs:** swagger-jsdoc + swagger-ui-express
- **Dev:** ts-node-dev, tsx

## Flujo estándar de una ruta (no releer cada vez)

```
verifyToken → checkPrimerLogin → requireRole([...]) → validate(schema) → controller → service → repository → Prisma
```

## Patrones fijos (aplicar sin buscar)

| Elemento | Patrón |
|---|---|
| Soft-delete | `updated_at: new Date()` NO; usar `prisma.tabla.update({ data: { deleted_at: new Date() } })` |
| Filtro activo | `import { activo } from './base.repository'` → `where: { ...activo }` |
| Error de negocio | `throw new AppError('mensaje', codigoHTTP)` |
| Wrapper async | `asyncHandler(async (req, res) => { ... })` |
| Validación body | `validate(schema)` → `validate(schema, 'params')` → `validate(schema, 'query')` |
| Rol guard | `requireRole(['NombreRol'])` — roles exactos del seed |

## Roles del sistema (nombres exactos en BD)

`Administrador` · `Coordinador` · `Profesor` · `Estudiante` · `Externo`

## Modelos Prisma — nombres exactos de tablas

`usuarios` · `roles` · `perfiles_coordinador` · `perfiles_profesor` · `perfiles_estudiante` · `perfiles_externo`  
`escuelas` · `cursos` · `curso_autorizaciones` · `proyectos` · `proyecto_coordinadores` · `proyecto_autores`  
`calificaciones` · `comentarios` · `proyecto_vistas`  
`semilleros` · `semillero_profesores` · `semillero_miembros`  
`eventos` · `evento_jornadas` · `inscripciones` · `asistencias`

## Códigos HTTP usados en el proyecto

| Caso | Código |
|---|---|
| OK | 200 |
| Creado | 201 |
| Sin contenido | 204 |
| Validación Zod fallida | 400 |
| Sin token / token inválido | 401 |
| Sin permiso / primer_login | 403 |
| No encontrado (soft-deleted incluido) | 404 |
| Conflicto de unicidad | 409 |
| Regla de negocio violada | 422 |
| Error no controlado | 500 |

## Archivos clave por capa (rutas relativas desde src/)

| Capa | Archivo |
|---|---|
| Entry point | `index.ts` |
| Router raíz | `routes/index.ts` |
| Error handler | `middlewares/errorHandler.ts` |
| Auth middleware | `middlewares/auth/verifyToken.ts` |
| Primer login | `middlewares/auth/checkPrimerLogin.ts` |
| Roles | `middlewares/roles/requireRole.ts` |
| Validación | `middlewares/validation/validate.ts` |
| Schemas Zod | `middlewares/validation/schemas/index.ts` |
| Filtro soft-delete | `models/base.repository.ts` |
| AppError | `utils/AppError.ts` |
| asyncHandler | `utils/asyncHandler.ts` |

## Convención de nombres de archivo

- Repositories: `[dominio].repository.ts`
- Services: `[dominio].service.ts`
- Controllers: `[dominio].controller.ts`
- Routes: `[dominio].routes.ts`
- Todo en español snake_case alineado con nombres de tablas Prisma

## No hay frontend Angular en este workspace

El workspace actual es solo el backend. Cuando se trabaje el frontend, este archivo se actualiza con su stack.
