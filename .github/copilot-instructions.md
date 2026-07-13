# UniLab — Instrucciones Globales del Agente

## Proyecto

Plataforma universitaria para gestión de proyectos académicos, semilleros de investigación y eventos.
Monorepo con dos carpetas raíz: `unilab_back/` (Node.js/TypeScript/Express/Prisma) y `unilab_front/` (Angular 17+).

- Modelo de datos canónico: `00-esquema-bd-referencia.md` en la raíz. Es la fuente de verdad. Si una funcionalidad requiere un campo o tabla que no está ahí, PREGUNTA antes de tocar `schema.prisma`.
- **Sistema SDD coordinado:** Ver `.github/INDEX.md` para flujos de trabajo y skills (8 skills específicas para diferentes tipos de funcionalidades).

---

## 🎯 Inicio Rápido — Sistema SDD

Este proyecto usa un **sistema SDD (Spec Driven Development) coordinado** con skills especializadas:

1. **Lee:** `.github/QUICK_START.md` (2 min)
2. **Elige:** Un skill de la tabla (backend-crud, frontend-crud, auth-flow, etc.)
3. **Chat:** Describe tu necesidad siguiendo el formato del skill
4. **Agent:** Guía SPEC → Confirmación → Implementación

Documentación completa: `.github/INDEX.md`

---

## Modo de trabajo — SDD (Spec Driven Development)

Antes de escribir código, define la especificación:

1. **SPEC** — qué hace la funcionalidad (input → proceso → output), qué entidades involucra, qué reglas de negocio aplican, qué endpoints y componentes se necesitan, qué casos límite manejar.
2. **CONFIRMACIÓN** — presenta la spec en un párrafo y espera confirmación. Si hay ambigüedad, haz UNA sola pregunta directa.
3. **IMPLEMENTACIÓN** — backend completo primero, luego frontend, luego tests.
4. **Una funcionalidad a la vez** — no mezcles varias en un mismo bloque de código.

---

## Reglas no negociables

- **Sin archivos `.md`** — no generes documentos de análisis, reportes ni resúmenes. La comunicación es conversacional.
- **Sin commits ni git** — no ejecutes `git add`, `git commit`, `git push` ni nada de control de versiones.
- **Sin sobre-ingeniería** — la solución más simple que funciona correctamente es la correcta.
- **Sin parches sobre parches** — si una corrección requiere refactorizar, propón el refactor mínimo y espera confirmación.
- **Sin suposiciones silenciosas** — si no puedes inferir algo del código real, pregunta.
- **Consistencia** — antes de crear un helper, util, componente o patrón nuevo, busca si ya existe algo similar. Reutiliza.

---

## Dominio y roles

Cinco roles fijos: `Administrador`, `Coordinador`, `Profesor`, `Estudiante`, `Externo`.

Regla crítica de `primer_login`: si `primer_login = true`, el usuario solo puede acceder al endpoint `POST /api/auth/cambiar-password`. Cualquier otra ruta devuelve 403. El middleware `checkPrimerLogin` ya implementa esto en el back.

---

## Códigos HTTP estándar del proyecto

| Código | Cuándo |
|--------|--------|
| 200 | Éxito con cuerpo |
| 201 | Recurso creado |
| 204 | Éxito sin cuerpo |
| 400 | Validación Zod fallida |
| 401 | Sin token o token inválido |
| 403 | Sin permiso o `primer_login` bloqueado |
| 404 | No encontrado o soft-deleted |
| 409 | Conflicto de unicidad |
| 422 | Regla de negocio violada |
| 500 | Error no controlado |

---

## Comportamiento en correcciones de bugs

1. Diagnostica en voz alta por qué falla antes de proponer solución.
2. Propón la corrección de raíz, no el parche mínimo.
3. Si la corrección toca más de un archivo o capa, menciónalo antes de ejecutar.
4. Ejecuta solo después de confirmación.
