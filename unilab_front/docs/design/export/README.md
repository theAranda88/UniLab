# Rediseño Eduinova — Export del maquetado

Carpeta de trabajo para aplicar el maquetado de Claude Design sobre `unilab_front` (Angular 21 + SCSS).

## Regla principal: SOLO DISEÑO

- Se modifica únicamente **presentación**: `*.scss`, estructura/clases de los `*.html` de componentes, `src/styles/*`, assets en `src/assets/images/`.
- **No** se toca lógica: `*.ts` (componentes, servicios, guards, interceptors, modelos), `app.routes.ts`, llamadas HTTP, formularios reactivos, validaciones, bindings (`[..]`, `(..)`, `*ngIf/@if`, `*ngFor/@for`, pipes) ni claves de i18n existentes.
- En los `.html` solo se cambian etiquetas contenedoras, clases y orden visual; todos los bindings y directivas se conservan tal cual.
- **No se crean pantallas, rutas, campos ni funcionalidades** que no existan hoy. Lo que aparezca en el maquetado y no exista en el código queda **fuera de alcance** (ver columna «Alcance» en [INDICE.md](INDICE.md)).
- Si un diseño requiere un dato que el componente no expone, se omite ese elemento visual; no se inventa.

## Archivos

| Archivo | Contenido |
|---|---|
| [INDICE.md](INDICE.md) | Pantallas, rutas, roles, alcance, navegación y assets (Paso 0 de Claude Design) |
| [PROMPT-claude-design.md](PROMPT-claude-design.md) | Prompt para pedir los pasos 1..N a Claude Design |
| `tokens.css` · `componentes-base` · `layout` · `pantalla-XX` | Opcionales: los tokens, componentes y reglas ya se documentaron a partir del maquetado en [../01-fundamentos.md](../01-fundamentos.md) … [../04-pautas-ux.md](../04-pautas-ux.md). Se pedirán a Claude Design solo si hace falta detalle de una pantalla concreta. |

Assets exportados → `src/assets/images/` (íconos en `src/assets/images/icons/`).

## Flujo

1. Pegar el prompt en Claude Design y guardar cada entrega aquí.
2. Tokens → mapear contra `src/styles/design-tokens.scss` y `_portal-codex-tokens.scss` (se actualizan valores, no se renombran variables en uso).
3. Componentes base y layout → `src/styles/` y `src/app/shared/`.
4. Pantallas en alcance, una por una, en `src/app/features/<modulo>/`.
5. Verificar con `ng build` que nada de lógica cambió (`git diff --stat` solo debe mostrar `.scss`, `.html` y assets).

Fuente del maquetado: `docs/design/Eduinova Prototipo publicable.html` (≈10 MB, imágenes en base64; no se usa directamente).
