# UniLab — Backend API

Backend modular de la plataforma universitaria UniLab (proyectos, semilleros y eventos).

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y configura:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `PORT` | Puerto HTTP (default: 3000) |

## Base de datos

```bash
# Aplicar migraciones
npm run prisma:migrate

# Generar cliente Prisma
npm run prisma:generate

# Sembrar datos de prueba
npm run prisma:seed
```

## Desarrollo

```bash
npm run dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`

## Usuarios de prueba (seed)

Contraseña para todos: `Password123!`

| Rol | Email |
|-----|-------|
| Administrador | admin@unilab.edu |
| Coordinador | coordinador@unilab.edu |
| Profesor | profesor1@unilab.edu |
| Estudiante | estudiante1@unilab.edu |
| Externo | externo@unilab.edu |

## Documentación

Guía completa para colaboradores (clonación, BD, migraciones, seed y consumo desde frontend): **[docs/README.md](docs/README.md)**

## Postman

Importa `docs/postman_collection.json` y `docs/postman_environment.json`. Ejecuta **Iniciar sesión (Administrador)** para guardar el token automáticamente.

## Arquitectura

```
route → validate → auth → rol → controller → service → repository → Prisma
```

Ver `src/services/README.md` para más detalle.
