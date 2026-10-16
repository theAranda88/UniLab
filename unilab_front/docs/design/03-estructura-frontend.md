# 03 · Estructura del frontend para el rediseño

> Cómo se organiza el diseño dentro de `unilab_front` (Angular 21 + SCSS) **sin tocar lógica**.
> Regla: solo cambian `.scss`, clases/estructura de `.html` (conservando todos los bindings y directivas), `src/styles/*`, `index.html` (fuentes) y assets. No cambian `.ts`, rutas, servicios, guards, modelos ni claves i18n.

## 1. Diagnóstico actual

| Hallazgo | Evidencia | Impacto |
|---|---|---|
| Dos sistemas visuales | `design-tokens.scss` (panel azul/celeste) y `_portal-codex-tokens.scss` + `_portal-codex-theme.scss` (portal oscuro dorado) | Dos marcas en un mismo producto |
| Estilos repetidos por pantalla | ≈19 hojas definen sus propios botones, ≈13 sus badges; `_eventos-ui.scss` y `dashboard-shared.scss` son intentos parciales de compartir | Inconsistencia, cada pantalla «se parece» pero no es igual |
| Colores sueltos | Hex fuera de tokens en componentes (`#fcd34d`, `#fca5a5`, `#007bff`, `#152238`, `#ffebee`…) | No se pueden cambiar desde un solo sitio |
| Hojas muy grandes | `login` ≈600 líneas, `evento-detalle` ≈470, `asistencia-qr` ≈410, `eventos-list` ≈400 | Mucho estilo local que debería ser componente base |
| Fuentes | `index.html` carga Cinzel, Cormorant, Pinyon Script, Plus Jakarta; no carga Nunito | Hay que cambiar la carga de fuentes |
| Íconos | Tabler ya cargado por CDN (`@latest`) | Se mantiene; fijar versión (maquetado usa 3.31.0) |
| Tema portal por ruta | `data: { portalTheme: true }` → clase `.portal-themed` / `UiVariant 'portal'` | **Se conserva el mecanismo** (es lógica); solo cambia lo que pinta: con el sistema unificado ambas variantes se ven casi iguales |

## 2. Arquitectura de estilos objetivo

Capas, de lo general a lo particular. Cada capa solo consume las anteriores.

| Capa | Ubicación | Contenido | Estado |
|---|---|---|---|
| 1 · Tokens | `src/styles/design-tokens.scss` | Paleta, derivados, semánticos, tipografía, espaciado, radios, sombras, motion, breakpoints, z-index (valores de [01](01-fundamentos.md)) | Reescribir valores |
| 2 · Base | `src/styles/global.scss` | Reset, `body` crema + Nunito + negro, enlaces azules, foco visible global, `prefers-reduced-motion` | Ajustar |
| 3 · Componentes base | `src/styles/components/` (nuevo, solo estilos) | Un parcial por componente de [02](02-componentes.md): botones, campos, badges, chips, cards, stat-card, dato-grid, tabla, alertas, toast, estados, avatar | Nuevo |
| 4 · Layout | `shared/layout/admin-shell`, `features/home/portal-shell` | Sidebar/topbar y header/hero/footer | Reestilizar |
| 5 · Componentes Angular compartidos | `shared/ui/modal`, `dialog`, `breadcrumb`, `google-sign-in` | Solo su `.scss` | Reestilizar |
| 6 · Pantallas | `features/**/**.component.scss` | Solo lo propio de la pantalla (disposición, grid); **sin** redefinir botones, badges ni colores | Adelgazar |

Archivos a retirar al final (cuando ninguna pantalla los use): `_portal-codex-tokens.scss`, `_portal-codex-theme.scss`, `_eventos-ui.scss` (absorbido por la capa 3), `shared/layout/dashboard/dashboard-shared.scss` (absorbido por stat-card).

### Nomenclatura de clases

- Componentes base con prefijo `edu-`: `edu-btn`, `edu-btn--primary`, `edu-field`, `edu-badge--en_revision`, `edu-card`, `edu-stat`, `edu-table`, `edu-alert--error`, `edu-empty`…
- Modificadores de estado con el **valor exacto del backend** (`--borrador`, `--en_revision`, `--planeado`, `--pendiente`…) para que el `.html` pueda usar el valor que ya tiene sin lógica nueva.
- Estilos propios de pantalla: BEM con el nombre del componente (`eventos-list__grid`).

## 3. Mapeo de tokens actuales → nuevos

Se **conservan los nombres** de variables SCSS que ya usan las pantallas y se cambia su valor; los nombres nuevos se agregan. Así el cambio de color se propaga sin editar cada hoja.

| Variable actual | Valor actual | Nuevo valor | Nota |
|---|---|---|---|
| `$primary-blue` | `#243b8e` | `#053686` | Azul institucional |
| `$primary-blue-dark` | `#1a2959` | `#032A6A` | Azul presionado |
| `$primary-blue-light` | `#3d5fa8` | azul tinte `rgba(5,54,134,0.09)` | Revisar usos: si es texto, usar azul |
| `$light-blue` / `-dark` / `-light` | celestes | `#053686` / `#032A6A` / azul tinte | El celeste desaparece de la marca |
| `$yellow` / `-dark` / `-light` | `#fcc202`… | `#E3C924` / `#D4BB17` / amarillo tinte | Solo acento |
| `$success` | `#388e3c` | `#1F6D3F` | |
| `$error` | `#d32f2f` | `#B02A2A` | |
| `$warning` | `#f57c00` | `#6B5A00` (texto) sobre amarillo tinte | Sin naranja |
| `$info` | `#1976d2` | `#053686` sobre azul tinte | Sin celeste |
| `$white` | `#ffffff` | `#FFFFFF` | Superficies |
| `$light-gray` | `#f5f5f5` | `#FFFDF5` (crema) | Fondo de página |
| `$gray-100…800` | grises Material | derivados de negro `rgba(30,30,30,x)` | 100→0.04 · 200→0.06 · 300→0.10 · 400→0.16 · 500→0.38 · 600→0.60 · 700→0.72 · 800→0.85 |
| `$text-dark` | `#333333` | `#1E1E1E` | |
| `$text-light` | `#666666` | `rgba(30,30,30,0.72)` | Regla de contraste |
| `$border-gray` | `#e0e0e0` | `rgba(30,30,30,0.10)` | Borde sutil |
| `$font-family-base` | fuente del sistema | Nunito + respaldo del sistema | |
| `$radius-*` | 2…16 | xs 4 · sm 6 · base 8 · md 8 · lg 10 · xl 12 · full | |
| `$shadow-*` | 6 niveles | xs/sm → borde · base/md → sombra base · lg/xl → overlay | Solo 3 niveles |
| `$transition-*` | 0.1–0.5 s | fast 150 ms · base 180 ms · slow 250 ms | |
| `$portal-*` (Codex) | oscuro/dorado | apuntan a los tokens nuevos (crema, blanco, azul, amarillo, Nunito) | Paso previo a eliminarlos |

Nuevos tokens a añadir: `$cream`, `$ink`, `$accent`, `$blue-tint`, `$blue-tint-strong`, `$yellow-tint`, `$yellow-ink`, `$neutral-tint`, `$text-secondary`, `$text-on-blue`, `$border-control`, `$overlay`, `$focus-ring`, `$error-ink`, `$shadow-card`, `$shadow-overlay`.

## 4. Mapa pantalla → archivos a reestilizar

| # | Pantalla | Archivos (`src/app/…`) |
|---|---|---|
| 01 | Login | `features/auth/login/login.component.{html,scss}` + `shared/ui/google-sign-in` |
| 02 | Cambiar contraseña | `features/auth/cambiar-password/*` |
| 03 | Completar perfil | `features/auth/completar-perfil/*` |
| 04–06 | Dashboards | `features/{admin,coordinador,profesor}/dashboard/*` + `shared/layout/dashboard/dashboard-shared.scss` |
| 07–08 | Usuarios | `features/usuarios/usuarios-list/*`, `usuarios-form/*` |
| 09–10 | Escuelas | `features/escuelas/escuelas-list/*`, `escuelas-form/*` |
| 11 | Eventos lista | `features/eventos/eventos-list.component.*` |
| 12 | Evento detalle | `features/eventos/evento-detalle.component.*` |
| 13 | Evento form | `features/eventos/evento-form.component.*` |
| 14 | Jornada crear | `features/eventos/jornada-form.component.*` |
| 15 | Asistencia QR | `features/eventos/asistencia-qr.component.*` |
| 16 | Reporte | `features/eventos/reporte-evento.component.*` |
| 17–18 | Proyectos profesor | `features/proyectos-profesor/*` |
| 19–20 | Proyectos estudiante | `features/proyectos-estudiante/*` |
| 21 | Portal inicio | `features/home/home-dashboard/*`, `spiderweb-canvas` (solo colores), `directives/card-tilt` (sin cambios) |
| 22 | Portal escuela | `features/home/portal-escuela-proyectos/*` |
| 23 | Portal proyecto | `features/home/portal-proyecto-detalle/*`, `project-image-carousel/*` |
| 24–25 | Portal eventos | reutiliza 11/12 con `portalTheme` + `inscripcion-form.component.*` |
| 26 | Acceso denegado | `UnauthorizedComponent` está declarado **dentro de `app.routes.ts`** con plantilla y estilos inline. ⚠ Excepción: solo se editan sus bloques `template`/`styles` (texto de estilos), nada de la configuración de rutas |
| — | Shell interno | `shared/layout/admin-shell/*` |
| — | Shell portal | `features/home/portal-shell/*`, `portal-profile-menu/*`, `_portal-layout.scss`, `_portal-route-page.scss` |
| — | Modal acceso/registro portal | `features/home/auth-modal/*` (ya tiene pestañas login/registro) |
| — | Modal / dialog / breadcrumb | `shared/ui/modal`, `shared/ui/dialog`, `shared/ui/breadcrumb` |

## 5. Orden de implementación (fases)

| Fase | Entregable | Criterio de «hecho» |
|---|---|---|
| **0 · Documentación** | Estos documentos aprobados | Colores, tipografía y componentes validados por el equipo |
| **1 · Tokens + base** | Nuevos valores en `design-tokens.scss`, Nunito en `index.html`, `global.scss` | La app compila y ya se ve en crema/azul/Nunito sin tocar pantallas |
| **2 · Componentes base** | `src/styles/components/*` | Página de referencia visual (maquetado) coincide con botones, campos, badges, etc. |
| **3 · Layouts** | Admin shell + portal shell | Navegación por rol idéntica a hoy (mismos ítems, mismos «Pronto») |
| **4 · Compartidos** | Modal, dialog, breadcrumb, auth-modal | Mismos inputs/outputs, nuevo aspecto |
| **5 · Pantallas** | 01 → 26 en orden del índice | Cada pantalla sin colores sueltos ni botones/badges propios |
| **6 · Limpieza** | Eliminar `_portal-codex-*`, `_eventos-ui`, `dashboard-shared` | `git diff --stat` solo muestra `.scss`, `.html`, `index.html`, assets |

Verificación en cada fase: `ng build` sin errores, recorrido manual por rol (ADM, COO, PRO, EST, PUB) y revisión en 412 px.

## 5.1 Estado de implementación (2026-09-26)

| Fase | Estado | Archivos |
|---|---|---|
| 1 · Tokens + base | ✅ | `styles/design-tokens.scss` (alias heredados + tokens nuevos), `styles/global.scss`, `index.html` (Nunito + Tabler 3.31.0) |
| 2 · Componentes base | ✅ | `styles/_components.scss` (clases globales `edu-*`), `styles/_eventos-ui.scss` y `styles/_portal-codex-*.scss` reescritos por dentro, `styles/_admin-pages.scss` (mixins `list-page`, `form-page`, `modal-form`, `filter-chips`, `estado-proyecto-badge`) |
| 3 · Layouts | ✅ | `admin-shell`, `portal-shell`, `home-dashboard` (hero azul), `_portal-layout`, `_portal-route-page` |
| 4 · Compartidos | ✅ | `modal-shell`, `dialog-host`, `breadcrumb`, `google-sign-in`, `auth-modal`, `portal-profile-menu`, `project-image-carousel` |
| 5 · Pantallas | ✅ 01–26 | Todas las pantallas del índice |
| 6 · Limpieza | ⏳ | `_portal-codex-*` y `_eventos-ui` siguen existiendo como capa de compatibilidad (ya con valores nuevos) |

Decisiones tomadas durante la implementación:
- **Móvil del panel**: sin estado para abrir/cerrar un cajón (sería lógica nueva), bajo 768 px el sidebar pasa a una franja horizontal desplazable.
- **«Próximamente» en el sidebar**: indicador compacto de reloj; el texto traducido queda en el `title` existente (la etiqueta larga cortaba los nombres).
- **Partículas del portal**: el canvas dibuja en dorado; se convierten a blanco con un filtro CSS y solo se muestran sobre el hero azul del inicio y en la asistencia QR.
- **Logos**: el grifo dorado generado (`Gemini_Generated_Image…png`) se sustituyó por `Logoeduinova.svg` (sidebar, header del portal, login del portal) y por el escudo `Logouniautonoma.svg` en blanco (hero del inicio). `/login` conserva el logo oficial `uniautonoma_cauca.png`.

## 6. Decisiones pendientes (a validar por el equipo)

0. **Dos colores fijos en `.ts`** (no se tocaron por la regla «sin lógica»): el QR de `evento-detalle.component.ts` usa `#243b8e` (azul anterior) y el canvas `spiderweb-canvas.component.ts` dibuja en dorado. Cambiarlos a `#053686` es un cambio de una línea cada uno, solo visual.

1. **Módulos «Próximamente»**: se mantienen visibles y deshabilitados como hoy (propuesta del maquetado). ✔ recomendado.
2. **Colores semánticos**: `#B02A2A` (error) y `#1F6D3F` (éxito) como única excepción a la paleta de 5.
3. **Fotos**: las del maquetado son de Unsplash; en la app las imágenes vienen de la API, así que no se agregan como assets.
4. **Hero del portal**: se conserva el canvas de partículas existente, recoloreado a blanco/amarillo sobre azul.
