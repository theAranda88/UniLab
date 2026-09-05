# UniLab — Backend API

API REST de UniLab (proyectos, semilleros y eventos). Node.js, Express, Prisma y PostgreSQL.

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

## Postman

Importa `docs/postman_collection.json` y `docs/postman_environment.json`. Ejecuta **Iniciar sesión (Administrador)** para guardar el token.

## Arquitectura

```text
route → validate → auth → rol → controller → service → repository → Prisma
```

Guía del monorepo: [../README.md](../README.md).
