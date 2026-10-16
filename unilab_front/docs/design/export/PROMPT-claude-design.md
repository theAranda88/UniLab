# Prompt para Claude Design (pasos 1..N)

Pegar en la conversación de Claude Design donde ya se entregó el Paso 0 (INDICE.md).

```
Gracias por el INDICE (Paso 0). Continúa con los siguientes pasos bajo estas reglas.

CONTEXTO
El frontend ya existe (Angular 21 + SCSS, ngx-translate). El objetivo es SOLO REDISEÑO VISUAL: se cambiarán estilos y estructura de marcado, NO lógica, rutas, datos ni funcionalidades. Por eso:
- Diseña ÚNICAMENTE las pantallas 01 a 26 del índice corregido, más estados transversales y móvil.
- NO agregues Registro, Jornada QR/evidencias como pantalla propia, Cursos, Proyectos admin, Semilleros ni 404: no existen en el código.
- No agregues campos, filtros, métricas, botones ni secciones que no estén ya en el maquetado de cada pantalla; si dudas, déjalo fuera y anótalo en un comentario «OPCIONAL».

REGLAS DE ENTREGA
1. Sin base64 ni data URIs. Imágenes/íconos como archivos aparte (SVG preferido, WebP para fotos ≤200 KB) referenciados por ruta: assets/images/<nombre> y assets/images/icons/<nombre>.svg.
2. Un archivo por paso/pantalla, máx. ~40 KB (≈800 líneas) cada uno. Si excede, divide en -parte-1, -parte-2.
3. CSS limpio, sin minificar, sin Tailwind ni librerías. Variables CSS (custom properties) + clases BEM con prefijo por bloque (ej. .ev-card, .ev-card__title, .ev-card--destacado).
4. Sin JavaScript. Los estados (hover, activo, modal abierto, tab seleccionada, cargando, vacío, error) se muestran como variantes estáticas con una clase modificadora (--is-open, --is-loading, etc.).
5. Textos en español con atributo data-i18n="seccion.clave".
6. No repitas en cada pantalla lo ya entregado (tokens, componentes base, layout): solo reutiliza sus clases.

PASOS
PASO 1 – tokens.css: colores semánticos (primarios, secundarios, neutros, éxito/error/aviso/info) con hex, modo oscuro si existe, tipografía (familias + enlace Google Fonts, escala, pesos, line-height), espaciados, radios, sombras, z-index, breakpoints, duraciones/curvas.
PASO 2 – componentes-base.html + componentes-base.css: botones, botón-icono, inputs, textarea, select, checkbox/radio, toggle, segmented, upload, chips-filtro, badges (todos los estados de evento y de proyecto), tarjetas, stat-card, dato-grid, tablas, paginación, tabs, breadcrumbs, modal, modal confirmación, toast/alerta, avatar, skeleton, estado vacío. Cada uno con todas sus variantes y estados, en un bloque <!-- COMPONENTE: nombre | variantes | uso -->.
PASO 3 – layout.html + layout.css: (a) shell interno (AdminShell: topbar + sidebar por rol ADM/COO/PRO + contenido) y (b) shell portal público (header + footer). Responsive móvil/tablet/escritorio.
PASO 4..N – pantalla-XX-<nombre>.html + .css, en el orden del índice, solo pantallas en alcance. Encabezado comentado con: ruta, rol, datos mostrados (campo: tipo), acciones (botón → efecto), estados (cargando/vacío/error). Incluye media queries móvil (412 px).
PASO FINAL – lista de assets con sus archivos SVG optimizados (sin metadata) en kebab-case.

Entrega SOLO el PASO 1 ahora y espera a que te pida el siguiente.
```

Tras cada entrega, pedir el siguiente con: `Siguiente: PASO <n>` (o `PASO 4 – pantalla 01`, etc.).
