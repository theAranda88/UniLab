# Eduinova — Índice de entrega (Angular 21 + SCSS)

Fuente: maquetado `Eduinova *.dc.html` + `unilab_front/src/app/app.routes.ts`.
Roles: **ADM** Administrador · **COO** Coordinador · **PRO** Profesor · **EST** Estudiante · **PUB** público/externo.
Prefijo de shell por rol: `/admin`, `/coord`, `/prof` (usan `AdminShellComponent`).
Alcance: solo pantallas con ruta en `app.routes.ts`. La ruta `**` redirige a `/`, así que no hay 404.

> Regla del rediseño: solo diseño (ver [README.md](README.md)). Chips-filtro, stat-cards, badges, etc. se aplican solo si la pantalla ya tiene ese dato o filtro en el código; no se agregan nuevos.

## 1. Pantallas

| # | Pantalla | Ruta | Rol | Componentes |
|---|---|---|---|---|
| 01 | Login | `/login` | todos | input, botón, alerta, logo |
| 02 | Cambiar contraseña | `/cambiar-password` | todos (primer login) | input password, medidor, alerta |
| 03 | Completar perfil | `/completar-perfil` | todos | input, select, campos condicionales por rol |
| 04 | Dashboard ADM | `/admin/dashboard` | ADM | stat-card ×4 (2×2), lista, badge |
| 05 | Dashboard COO | `/coord/dashboard` | COO | stat-card ×4, lista, badge |
| 06 | Dashboard PRO | `/prof/dashboard` | PRO | stat-card ×4, lista, badge |
| 07 | Usuarios — lista | `/admin/usuarios` | ADM | tabla, chips-filtro, badge, avatar, botón-icono |
| 08 | Usuarios — crear/editar | `/admin/usuarios/crear` · `/:id/editar` | ADM | input, select, segmented rol, toggle contraseña |
| 09 | Escuelas — lista | `/{admin,coord}/escuelas` | ADM, COO | tarjeta, lista cursos, botón-icono |
| 10 | Escuelas — crear/editar | `/{admin,coord}/escuelas/crear` · `/:id/editar` | ADM, COO | input, textarea, lista editable |
| 11 | Eventos — lista | `/{admin,coord,prof}/eventos` | ADM, COO, PRO | tarjeta con imagen, badge estado, chips-filtro |
| 12 | Evento — detalle | `/{rol}/eventos/:id` | ADM, COO, PRO | hero imagen, dato-grid, lista jornadas, breadcrumbs |
| 13 | Evento — crear/editar | `/admin/eventos/crear` · `/:id/editar` | ADM | input, fecha, select, upload imagen, toggle pago |
| 14 | Jornada — crear | `/admin/eventos/:id/jornadas/crear` | ADM | input, fecha/hora, botón |
| 15 | Asistencia QR (4 estados) | `/eventos/:id/asistencia?qr=` · `/{rol}/eventos/:id/asistencia` | EST, PUB, ADM, COO, PRO | estado éxito / ya registrado / pago pendiente / error |
| 16 | Reporte de evento | `/{admin,coord}/eventos/:id/reporte` | ADM, COO | stat-card, tabla, botón exportar |
| 17 | Proyectos asignados | `/prof/proyectos` · `/prof/pendientes` | PRO | tabla/lista, chips-filtro, badge |
| 18 | Revisión de proyecto | `/prof/proyectos/:id` | PRO | ficha, galería, textarea comentario, aprobar/rechazar |
| 19 | Mis proyectos | `/mis-proyectos` | EST | tarjeta con miniatura, chips-filtro, badge (5 estados) |
| 20 | Proyecto — crear/editar | `/mis-proyectos/nuevo` · `/:id` | EST | input, select tipo (campos dinámicos), upload, galería |
| 21 | Portal — inicio | `/` | PUB | hero con partículas, cifras ×4, tarjetas escuela/proyecto, evento destacado |
| 22 | Portal — escuela | `/escuelas/:idEscuela` | PUB | cabecera, tarjeta proyecto, chips-filtro |
| 23 | Portal — proyecto | `/proyectos/:idProyecto` | PUB | hero imagen, galería ×3, enlaces externos, dato-grid |
| 24 | Portal — eventos | `/eventos` | PUB | tarjeta evento, badge |
| 25 | Portal — evento + inscripción | `/eventos/:id` | PUB, EST | hero, jornadas, modal inscripción |
| 26 | Acceso denegado | `/unauthorized` | todos | estado de error |
| — | Estados transversales | (no ruta) | — | skeletons, vacíos por rol, toasts, modal confirmación destructiva, sesión expirada |
| — | Móvil | (no ruta) | EST, PUB | versiones 412 px de 21, 25, 15 y 19 → media queries de cada pantalla |

## 2. Mapa de navegación

```
/  ──► /escuelas/:id ──► /proyectos/:id
│  ──► /eventos ──► /eventos/:id ──(Inscribirme)──► modal ──► /eventos/:id/asistencia?qr=
│  ──► /login ──► [primer login] /cambiar-password ──► /completar-perfil ──► /dashboard
│                                                                            │ (roleRedirect)
├─ ADM /admin/dashboard ─► usuarios (±form) · escuelas (±form) · eventos (±form)
│      eventos/:id ─► editar · jornadas/crear · asistencia · reporte
├─ COO /coord/dashboard ─► escuelas (±form) · eventos/:id ─► asistencia · reporte
├─ PRO /prof/dashboard ─► proyectos ─► proyectos/:id (revisión) · pendientes · eventos/:id ─► asistencia
└─ EST /mis-proyectos ─► nuevo · :id ;  portal público completo
Guard sin rol ─► /unauthorized · ruta inexistente ─► / · token 401 ─► modal sesión expirada ─► /login
```

## 3. Assets (`assets/images/`)

| Archivo | Tipo | Uso |
|---|---|---|
| `logo-eduinova-mark.svg` | SVG | topbar, sidebar, login, footer, favicon |
| `logo-eduinova-titulo.svg` | SVG | login, portal header |
| `escudo-uniautonoma.svg` | SVG | footer portal, login |
| `evento-foro-2026-flyer.webp` | foto | 11, 12, 13, 21, 24, 25 |
| `proyecto-codice-3d.webp` | foto | 19, 21, 23 (portada + galería 1) |
| `proyecto-codice-codigo.webp` | foto | 20, 23 (galería 2) |
| `proyecto-codice-dashboard.webp` | foto | 23 (galería 3) |
| `proyecto-monitor-iot.webp` | foto | 19, 21 |
| `proyecto-finanzas-podcast.webp` | foto | 19 |
| `icons/*.svg` (Tabler, ~55) | SVG | toda la app; se exportan en el paso final |

El QR **no es un asset**: se genera en tiempo de ejecución desde `jornada.uuid`. Las fotos son de Unsplash (las mismas del `seed.ts`) y deben sustituirse por material institucional.
