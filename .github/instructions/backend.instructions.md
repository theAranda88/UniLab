---
applyTo: "unilab_back/**"
---

# Backend — Node.js / TypeScript / Express / Prisma

## Stack verificado

- Node.js 20+, TypeScript (ES2022, Node16 module resolution, strict mode completo)
- Express 5, Zod 4, Prisma 7, PostgreSQL
- bcrypt 6, jsonwebtoken 9, uuid 14, swagger-jsdoc 6 + swagger-ui-express 5
- Sin framework de testing configurado aún — cuando se añadan tests, usar Vitest

## Arquitectura obligatoria

```
route → validate(Zod) → verifyToken → checkPrimerLogin → requireRole → controller → service → repository → Prisma
```

Ninguna capa invade la responsabilidad de otra:
- **Route**: solo conecta middlewares y controller. Sin lógica.
- **Controller**: llama al service, mapea el resultado a la respuesta HTTP. Sin lógica de negocio.
- **Service**: lógica de negocio y reglas de dominio. Lanza `AppError` para errores controlados.
- **Repository**: consultas Prisma puras. Sin lógica de negocio.

## Patrones de código establecidos

### AppError
```typescript
throw new AppError('mensaje descriptivo en español', codigoHTTP);
```
Nunca lances `new Error()` genérico desde un service o controller.

### asyncHandler
Todos los controllers usan `asyncHandler` del utilitario existente:
```typescript
export const miController = {
  accion: asyncHandler(async (req: Request, res: Response) => { ... })
};
```

### Soft-delete
- Nunca uses `prisma.tabla.delete()` ni `deleteMany()`.
- Eliminar = `prisma.tabla.update({ where: { id }, data: { deleted_at: new Date() } })`.
- Todo `findMany`/`findFirst` filtra por `deleted_at: null` via el helper `activo` de `base.repository.ts`:
  ```typescript
  import { activo } from './base.repository';
  // uso: where: { ...activo }
  ```

### Validación Zod
- Todos los schemas en `src/middlewares/validation/schemas/index.ts`.
- Usar `validate(schema)` para body (default) o `validate(schema, 'params')`/`validate(schema, 'query')` para otros.
- IDs de URL: `z.coerce.number().int().positive()` con el helper `idParamSchema` ya existente.

### Auth en routes
```typescript
router.get('/ruta', verifyToken, checkPrimerLogin, requireRole(['Profesor', 'Coordinador']), controller.accion);
```

### Nomenclatura
- Nombres en español, consistentes con el modelo Prisma (nombres de tablas, campos).
- Services: `nombreService.accion(params)` — objeto exportado, no clase.
- Repositories: `nombreRepository.metodo(params)` — objeto exportado, no clase.
- Controllers: `nombreController.accion` — objeto exportado con `asyncHandler`.
- Routes: archivo `nombre.routes.ts`, router exportado por default.

## Prisma — convenciones críticas

- Soft-delete en toda operación de borrado (ver arriba).
- Cascada lógica (ej. eliminar escuela → soft-delete sus cursos) va en el **service**, nunca en la BD.
- El modelo de datos canónico es `00-esquema-bd-referencia.md` en la raíz. Si necesitas un campo/tabla nuevo, pregunta antes de modificar `schema.prisma`.
- Índices únicos parciales para unicidad con soft-delete: `WHERE deleted_at IS NULL`.

## Swagger

Documenta cada endpoint nuevo en `src/docs/swagger/paths.ts` (o en el archivo de paths correspondiente al módulo). Usa JSDoc con anotaciones `@openapi` o actualiza directamente el objeto paths. Mantén los schemas en `src/docs/swagger/components.ts`.

## Estructura de archivos para funcionalidad nueva

```
src/middlewares/validation/schemas/index.ts   ← agregar schema Zod
src/models/nombre.repository.ts               ← consultas Prisma
src/services/nombre.service.ts                ← lógica de negocio
src/controllers/nombre.controller.ts          ← delegación HTTP
src/routes/nombre.routes.ts                   ← middlewares + controller
src/routes/index.ts                           ← registrar la route
src/docs/swagger/paths.ts                     ← documentar el endpoint
```
