# UniLab · Eduinova

Plataforma de la **Corporación Universitaria Autónoma del Cauca** para gestionar proyectos académicos, escuelas y cursos, semilleros de investigación y eventos.

Monorepo: `unilab_back/` (API) y `unilab_front/` (portal público y paneles). **Se trabaja con Docker.**

## Arranque (Docker)

Desde esta raíz:

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api npx prisma db seed   # primera vez o BD vacía
```

Las migraciones de Prisma se aplican solas al arrancar el contenedor `api`.

| Servicio | URL |
|----------|-----|
| Portal y paneles | http://localhost:8080 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api-docs |
| PostgreSQL | `localhost:5433` (`postgres` / `postgres`, BD `unilab`) |

### Login con Google (OAuth)

1. Copia el **Client ID** OAuth (tipo *Aplicación web*) en `.env` como `GOOGLE_CLIENT_ID` (debe coincidir con `unilab_front/src/app/core/config/google.config.ts`).
2. En [Google Cloud Console](https://console.cloud.google.com/) → **APIs y servicios** → **Credenciales** → tu client ID → **Orígenes autorizados de JavaScript**, añade al menos:
   - `http://localhost:8080` (portal con Docker)
   - `http://localhost:4200` (solo si desarrollas el front con `npm start`)
3. Mantén `CORS_ORIGINS=http://localhost:8080` en `.env` al usar Docker.

Detalle del error *«The given origin is not allowed…»*: [docs/PENDIENTES-BACKEND.md](docs/PENDIENTES-BACKEND.md) §10.

> Si ya tienes una base de datos levantada en otro puerto (p. ej. 5434), arranca con `POSTGRES_PORT=5434 docker compose up -d` para que Compose no la recree.

Cuentas de prueba (contraseña `Password123!`):

| Rol | Correo | Entra a |
|-----|--------|---------|
| Administrador | `admin@unilab.edu` | `/admin` |
| Coordinador | `coordinador@unilab.edu` | `/coord` |
| Profesor | `profesor1@unilab.edu` | `/prof` |
| Estudiante | `estudiante1@unilab.edu` | portal (`/mis-proyectos`, `/semilleros`) |
| Externo | `externo@unilab.edu` | portal |

## Qué incluye

| Módulo | Portal público | Panel |
|--------|----------------|-------|
| Escuelas y cursos | Escuelas con sus programas y proyectos | Admin/Coord: escuelas · Admin: cursos (CRUD) · Profesor: cursos (consulta) |
| Proyectos | Proyectos recientes, ficha con enlaces, calificación y comentarios | Estudiante: crea y envía a revisión · Profesor (sus proyectos), Admin y Coord (todos): revisan y publican |
| Semilleros | Estudiante: solicita ingreso | Admin: CRUD y profesores · Profesor líder: resuelve solicitudes y autoriza publicación · Coord: consulta |
| Eventos | Agenda en el inicio, listado y detalle, inscripción y asistencia por QR | Admin: eventos, jornadas, evidencias · Coord: reportes y asistencia |
| Reportes | — | Admin/Coord: resumen global y exportación a Excel |
| Configuración | Aviso del portal, registro abierto/cerrado | Admin: parámetros sin redesplegar |

## Pruebas

```bash
cd unilab_back  && npm test                    # unitarias, sin base de datos
cd unilab_front && npm test -- --watch=false   # Vitest vía ng test
```

## Estructura

```text
unilab/
  docker-compose.yml   ← API + PostgreSQL + frontend
  unilab_back/         ← Node / Express / Prisma
  unilab_front/        ← Angular
  docs/                ← Flujos, requisitos (SRS) y pendientes de backend
```

## Documentación

- Backend: [unilab_back/README.md](unilab_back/README.md)
- Frontend: [unilab_front/README.md](unilab_front/README.md)
- Requisitos: [docs/UniLab_SRS_v1.docx](docs/UniLab_SRS_v1.docx)
- **Pendientes para backend:** [docs/PENDIENTES-BACKEND.md](docs/PENDIENTES-BACKEND.md)
- Flujo de eventos: [docs/FLUJO-MODULO-EVENTOS.md](docs/FLUJO-MODULO-EVENTOS.md)
- Flujo de proyectos: [docs/FLUJO-MODULO-PROYECTOS.md](docs/FLUJO-MODULO-PROYECTOS.md)
