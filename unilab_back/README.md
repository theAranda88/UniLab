# UniLab — Backend API

API REST de UniLab (Corporación Universitaria Autónoma del Cauca): escuelas y cursos, proyectos, semilleros, eventos, reportes y configuración. Node.js, Express 5, Prisma 7 y PostgreSQL.

**Se trabaja con Docker** desde la raíz del monorepo (`unilab/`). Este README cubre ese flujo; el detalle largo está en [docs/README.md](docs/README.md).

## Arranque (Docker)

En la **raíz del monorepo**, no en esta carpeta:

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api npx prisma db seed
```

| Servicio | URL |
|----------|-----|
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api-docs |
| Health | http://localhost:3000/health |
| PostgreSQL (host) | `localhost:5433` |

El contenedor `api` habla con `db` en el puerto interno **5432**. En el host el mapeo por defecto es **5433**.

Al arrancar, el contenedor ejecuta `prisma migrate deploy`: las migraciones nuevas se aplican solas.

## Desarrollo local (opcional)

Si corre Node en el host (PostgreSQL puede seguir en Docker):

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
npm run dev
```

Ajuste `DATABASE_URL` al puerto del host (`5433` con Compose, `5432` si PostgreSQL es nativo).

## Usuarios de prueba (seed)

Contraseña para todos: `Password123!`

| Rol | Email |
|-----|-------|
| Administrador | admin@unilab.edu |
| Coordinador | coordinador@unilab.edu |
| Profesor | profesor1@unilab.edu |
| Estudiante | estudiante1@unilab.edu |
| Externo | externo@unilab.edu |

## Módulos y endpoints

Documentación completa en Swagger (`/api-docs`). Resumen por módulo:

| Módulo | Ruta base | Quién |
|--------|-----------|-------|
| Autenticación | `/api/auth` | Login, Google, registro, cambio de contraseña, completar perfil |
| Usuarios | `/api/usuarios` | Administrador |
| Escuelas y cursos | `/api/escuelas`, `/api/cursos` | Lectura autenticada · escuelas: Admin/Coord · cursos: Admin |
| Proyectos | `/api/proyectos` | Según rol; calificación y comentarios para cualquier usuario autenticado |
| Semilleros | `/api/semilleros` | CRUD Admin · solicitud Estudiante · resolución y publicación Profesor líder |
| Eventos | `/api/eventos`, `/api/jornadas`, `/api/inscripciones` | Admin (gestión) · Coord (reportes) |
| Reportes globales | `/api/reportes/resumen`, `/api/reportes/resumen/export/excel` | Admin, Coordinador |
| Configuración | `/api/configuracion` (GET/PATCH) | Administrador |
| Público | `/api/public/*` | Sin sesión: escuelas, cursos, proyectos, eventos, inscripción, asistencia, configuración |

**Configuración del sistema** (tabla `configuracion_sistema`, migración `20261015000000_configuracion_sistema`):
- Parámetros editables sin redesplegar: `registro_abierto`, `semilleros_solicitudes_abiertas` y `mensaje_portal`.
- El catálogo de claves y sus valores por defecto está en `configuracion.service.ts`.
- Las reglas de negocio que dependen de ellos responden **422**, porque el front redirige cualquier 403 a «Acceso denegado».

**Seguridad:** las consultas de semilleros devuelven usuarios con un `select` acotado (sin `password_hash`).

## Pruebas

```bash
npm test          # una pasada (vitest)
npm run test:watch
```

Pruebas unitarias en `tests/`: servicios (semilleros, cursos, configuración, reportes), middlewares y esquemas Zod. Simulan repositorios y Prisma, así que **no necesitan base de datos**.

`vitest` está en la versión 3.2. Con la 4.x, la instalación limpia de npm 10 falla con `Cannot read properties of null (reading 'edgesOut')`, y con ella la build de Docker.

## Postman

Importa `docs/postman_collection.json` y `docs/postman_environment.json`. Ejecuta **Iniciar sesión (Administrador)** para guardar el token.

## Arquitectura

```text
route → validate → auth → rol → controller → service → repository → Prisma
```

Guía del monorepo: [../README.md](../README.md) · Pendientes para este equipo: [../docs/PENDIENTES-BACKEND.md](../docs/PENDIENTES-BACKEND.md).
