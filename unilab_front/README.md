# UniLab — Frontend

Portal público y paneles de gestión de Eduinova (Corporación Universitaria Autónoma del Cauca). Angular 21 standalone. Forma parte del monorepo UniLab y **se trabaja con Docker** desde la raíz del repositorio.

## Arranque (Docker)

En la **raíz del monorepo**, no en esta carpeta:

```bash
cp .env.example .env
docker compose up -d --build
```

Frontend: http://localhost:8080 (nginx sirve la build en el puerto `FRONT_PORT`).

`nginx.conf` no deja guardar en caché `index.html` y sí los JS/CSS con hash. Así, tras cada despliegue el navegador carga la versión nueva con una recarga normal (no hace falta Ctrl+F5).

## Desarrollo local (opcional)

Solo si no usa Docker para el front. La API y PostgreSQL pueden seguir en Docker.

```bash
npm install
npm start
```

App en http://localhost:4200. La URL base de la API está en `src/environments/environment.ts` (`environment.apiUrl`, por defecto `http://localhost:3000/api`). En build de producción se usa `environment.prod.ts` vía `angular.json` → `fileReplacements`.

## Estructura de la app

| Zona | Rutas | Para quién |
|------|-------|-----------|
| Portal público | `/`, `/escuelas/:id`, `/proyectos/:id`, `/eventos` | Cualquier visitante |
| Portal con sesión | `/mis-proyectos`, `/semilleros` | Estudiante |
| Acceso | `/login`, `/registro`, `/recuperar-contrasena` | Visitantes |
| Panel | `/admin`, `/coord`, `/prof` | Administrador, Coordinador, Profesor |

**Portal:**
- Navbar con la sección activa según lo que se ve en pantalla (Inicio / Proyectos / Eventos).
- Inicio con escuelas, proyectos recientes y agenda de eventos.
- Ficha de proyecto con enlaces públicos (YouTube, Spotify, GitHub… detectados por dominio), calificación y comentarios con respuestas («Responder»).

**Panel:**
- Barra lateral con grupos plegables (`core/config/nav-by-role.ts`); las opciones sin backend aparecen como «Pronto».
- Dashboard por rol con cifras reales.
- Fichas en dos columnas.
- Visor de imágenes con zoom.

Componentes compartidos destacados (`shared/ui`):

| Componente | Uso |
|------------|-----|
| `image-lightbox` | Visor a pantalla completa con zoom, arrastre y pellizco |
| `evento-card`, `evento-media` | Tarjeta de evento e imagen con respaldo si el flyer falta o no carga |
| `recursos-externos` | Enlaces de un proyecto con la marca de su servicio |
| `floating-bubbles` | Burbujas del hero del inicio (solo responde la que está bajo el cursor) |

## Pruebas

```bash
npm test -- --watch=false
```

Specs `*.spec.ts` junto a cada componente, servicio o utilidad (Vitest vía `ng test`). `vitest` está fijado a `~4.0.8`, porque con 4.1.x la instalación limpia de npm 10 falla (y con ella la build de Docker).

## Textos e idiomas

Todo texto visible sale de `src/assets/i18n/es.json` y `en.json` (`@ngx-translate`). Cada pantalla nueva añade sus claves en ambos idiomas.

## Diseño

Guía de diseño en [docs/design/README.md](docs/design/README.md) (fundamentos, componentes, estructura y pautas UX).

Guía del monorepo: [../README.md](../README.md) · Pendientes de backend: [../docs/PENDIENTES-BACKEND.md](../docs/PENDIENTES-BACKEND.md).
