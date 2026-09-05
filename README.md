# UniLab

Plataforma universitaria para gestionar **proyectos académicos**, semilleros y eventos (Uniautónoma del Cauca).

Monorepo: `unilab_back/` (API) y `unilab_front/` (portal y paneles). **Se trabaja con Docker.**

## Arranque (Docker)

Desde esta raíz:

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api npx prisma db seed
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api-docs |
| PostgreSQL | `localhost:5433` (`postgres` / `postgres`, BD `unilab`) |

Cuentas de prueba (contraseña `Password123!`): `admin@unilab.edu`, `profesor1@unilab.edu`, `estudiante1@unilab.edu`.

## Estructura

```text
unilab/
  docker-compose.yml   ← API + PostgreSQL + frontend
  unilab_back/         ← Node / Express / Prisma
  unilab_front/        ← Angular
  docs/                ← Flujos de eventos y proyectos
```

## Más detalle

- Backend: [unilab_back/README.md](unilab_back/README.md)
- Frontend: [unilab_front/README.md](unilab_front/README.md)
- Flujo de eventos: [docs/FLUJO-MODULO-EVENTOS.md](docs/FLUJO-MODULO-EVENTOS.md)
- Flujo de proyectos: [docs/FLUJO-MODULO-PROYECTOS.md](docs/FLUJO-MODULO-PROYECTOS.md)
