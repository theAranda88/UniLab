# UniLab — Frontend

Portal público y paneles de gestión (Angular 17+). Forma parte del monorepo UniLab y **se trabaja con Docker** desde la raíz del repositorio.

## Arranque (Docker)

En la **raíz del monorepo** (`unilab/`), no en esta carpeta:

```bash
cp .env.example .env
docker compose up -d --build
```

Frontend: http://localhost:8080 (el contenedor `front` sirve la app en el puerto `FRONT_PORT`).

## Desarrollo local (opcional)

Solo si no usa Docker para el front. La API y PostgreSQL siguen pudiendo ir en Docker.

```bash
npm install
npm start
```

App en http://localhost:4200. Apunte el proxy / URL de API a `http://localhost:3000`.

## Stack

Angular standalone, Signals, Reactive Forms, i18n (`@ngx-translate`).

Guía del monorepo: [../README.md](../README.md).
