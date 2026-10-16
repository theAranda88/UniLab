# 01 · Fundamentos visuales — Eduinova

> Fuente: página «Eduinova Design System» del maquetado (fase 1). Este documento es la referencia de diseño: define **qué** se ve. Cómo se aplica al código está en [03-estructura-frontend.md](03-estructura-frontend.md).

## Principio

Un **único lenguaje visual** para el panel administrativo y el portal público, construido sobre la identidad institucional de la Universidad Autónoma del Cauca.
Reemplaza los dos sistemas que conviven hoy:

| Hoy | Problema | Nuevo |
|---|---|---|
| Panel: azul `#243b8e` + celeste `#1c9dd8` + amarillo `#fcc202`, fuente del sistema | Colores fuera de la marca, grises Material | Paleta institucional de 5 colores |
| Portal: tema oscuro «Codex» (`#010816`, dorado `#d4af37`, Cormorant + Plus Jakarta) | Otra marca distinta dentro del mismo producto | Mismo crema/azul que el panel |

---

## 1. Color

### 1.1 Paleta base (5 colores)

| Nombre | Hex | Rol | Uso |
|---|---|---|---|
| **Azul institucional** | `#053686` | Primario | Navegación activa, botones principales, enlaces, identidad |
| **Negro** | `#1E1E1E` | Texto | Texto principal, títulos, íconos, alto contraste |
| **Amarillo institucional** | `#E3C924` | Acento | Indicadores, énfasis, CTA secundario. **Nunca como fondo general** |
| **Crema** | `#FFFDF5` | Fondo | Fondo de la aplicación y áreas amplias |
| **Blanco** | `#FFFFFF` | Superficie | Cards, formularios, tablas, modales |

**Jerarquía:** el azul sostiene la identidad, el crema sostiene la página y el amarillo solo señala.
Orden de peso visual: 1 Azul → 2 Crema → 3 Blanco → 4 Negro → 5 Amarillo (acento puntual).

### 1.2 Tokens derivados

Toda transparencia sale de los cinco colores base. No se introducen colores nuevos salvo los dos semánticos.

| Token | Valor | Uso |
|---|---|---|
| Borde sutil | `rgba(30,30,30,0.10)` | Bordes de cards, tablas, divisores |
| Borde de control | `rgba(30,30,30,0.16)` | Borde de inputs, selects, textarea |
| Texto secundario | `rgba(30,30,30,0.72)` | Descripciones, notas, labels de tabla (ver regla de contraste) |
| Texto secundario sobre azul | `rgba(255,255,255,0.88)` | Texto de apoyo en hero / sidebar azul |
| Texto deshabilitado | `rgba(30,30,30,0.38)` | Solo controles deshabilitados |
| Azul tinte | `rgba(5,54,134,0.07)` | Hover de navegación y botones secundarios, fondo de ícono |
| Azul tinte activo | `rgba(5,54,134,0.09)` | Ítem de navegación activo, badge informativo |
| Azul presionado | `#032A6A` | Hover y active del botón primario |
| Amarillo tinte | `rgba(227,201,36,0.22)` | Badge de atención, alerta suave |
| Amarillo texto | `#6B5A00` | Texto legible sobre el tinte amarillo |
| Neutro tinte | `rgba(30,30,30,0.06)` | Badge neutro, fondo de skeleton |
| Overlay | `rgba(30,30,30,0.45)` | Fondo detrás de modal / dialog |

### 1.3 Semánticos (únicas excepciones a la paleta)

| Token | Valor | Fondo tinte | Texto sobre tinte | Uso |
|---|---|---|---|---|
| **Error** | `#B02A2A` | `rgba(176,42,42,0.07–0.09)` | `#8E1F1F` | Solo acciones destructivas y validación |
| **Éxito** | `#1F6D3F` | `rgba(31,109,63,0.07–0.09)` | `#1F6D3F` | Solo confirmación funcional |

No hay «warning» naranja ni «info» celeste: la advertencia usa el **amarillo tinte** y la información usa el **azul tinte**.

### 1.4 Reglas de color

- El amarillo entra como **indicador**: barra de 3 px, punto de estado, contador o subrayado del ítem activo (`inset 3px` a la izquierda). Nunca un panel completo.
- **Nunca texto amarillo pequeño sobre blanco** (no alcanza contraste). Sobre fondo amarillo el texto es negro o `#6B5A00`.
- Opacidades bajas (< 0.62) solo para bordes e íconos decorativos, **nunca para texto que se lee**.
- ⚠ El maquetado muestra «Texto secundario 0.60» en su tabla de tokens pero la regla de implementación fija **0.72**. Se adopta 0.72.

---

## 2. Tipografía

**Familia única: Nunito** (Google Fonts, variable 200–1000). Sustituye a la fuente del sistema del panel y a Cormorant Garamond / Plus Jakarta Sans / Cinzel / Pinyon Script del portal.

Pesos en uso: 200 Extra Light (solo display decorativo), 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black.

### 2.1 Escala de títulos

| Nivel | Tamaño / peso | Letter-spacing | Uso |
|---|---|---|---|
| Display | 60 / 900, line-height 1 | −0.035em | Hero del portal (desktop) |
| Sección | 34 / 900, line-height 1.05 | −0.03em | Títulos de sección del portal |
| H1 | 36 / 800 | −0.02em | Título de pantalla en auth / portal |
| H2 | 28 / 800 | −0.02em | Título de página interna |
| H3 | 22 / 700 | −0.02em | Título en topbar, encabezado de card grande |
| H4 | 18 / 700–800 | −0.01em | Título de modal, card, bloque |

### 2.2 Escala de texto

| Rol | Tamaño / peso | Uso |
|---|---|---|
| Cuerpo | 16 / 400, lh 1.5 | Párrafos, descripciones largas |
| Interfaz | 14 / 500 | Botones, inputs, texto de UI |
| Label / tabla | 13 / 600–700 | Labels de campo, celdas, navegación |
| Badge | 12 / 700 | Badges y chips |
| Kicker | 11 / 700, MAYÚSCULAS, +0.08em | Sobretítulos de sección (en azul) |

---

## 3. Espaciado

Múltiplos de 4: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64**.
Se eliminan del uso los valores intermedios actuales (2, 20, 28, 36, 40, 56) salvo casos justificados.

| Contexto | Valor |
|---|---|
| Gap interno de controles (ícono–texto) | 8 |
| Padding de card | 20–24 |
| Gap entre cards / grid | 16–24 |
| Separación entre secciones | 32–48 |
| Padding de página (desktop / móvil) | 32 / 16 |

## 4. Radios

| Valor | Uso |
|---|---|
| 6 px | Badges, chips cuadrados, marcas pequeñas |
| 8 px | **Inputs y botones**, ítems de navegación |
| 10 px | Cards, toasts, dropdowns |
| 12 px | Modales, cards grandes, contenedores de ícono 48 px |
| 50 % / pill | Solo avatares y chips-filtro (única excepción circular) |

## 5. Elevación y bordes

Solo tres niveles:

| Nivel | Valor | Uso |
|---|---|---|
| Borde | `1px solid rgba(30,30,30,0.10)` | Todas las superficies en reposo |
| Sombra base | `0 1px 2px rgba(30,30,30,0.04), 0 10px 26px -12px rgba(5,54,134,0.22)` | Cards, stat-cards, tablas |
| Overlay | `0 24px 60px rgba(0,0,0,0.22)` | Modales, dialogs, dropdowns abiertos |

Anillo de foco: `0 0 0 3px rgba(5,54,134,0.12)` + borde azul (error: `rgba(176,42,42,0.12)`).
Toast: fondo negro `#1E1E1E`, `0 16px 40px rgba(0,0,0,0.25)`.

## 6. Movimiento

- Transiciones entre **150 y 250 ms** con curva `ease` (estándar 180 ms).
- Propiedades animadas: background, color, border-color, box-shadow, transform.
- Botón al presionar: desplaza 1 px hacia abajo.
- Entrada de toast / modal: aparece con fundido + desplazamiento vertical corto (200 ms).
- Respetar `prefers-reduced-motion`: sin partículas del hero ni desplazamientos.

## 7. Breakpoints

| Nombre | Rango | Comportamiento |
|---|---|---|
| Móvil | 320–480 | 1 columna, sidebar como cajón, tablas con scroll horizontal |
| Tablet | 768–1024 | Sidebar colapsa bajo 768 |
| Escritorio | 1024+ | Sidebar fijo 220 px |
| Amplio | 1440+ | Contenido con ancho máximo centrado |

Referencia móvil del maquetado: **412 px** (portal, detalle de evento, asistencia QR, mis proyectos).

## 8. Iconografía

**Tabler Icons** (webfont, ya cargada en `index.html`). Trazo lineal, 18–20 px en UI, 23 px en íconos de dialog, 16 px dentro de botones.
Íconos base de navegación: `layout-dashboard`, `users`, `school`, `book`, `folders`, `flask`, `calendar-event`, `qrcode`, `chart-bar`, `chart-pie`, `clock-check`, `file-export`, `settings`, `users-group`, `bell`, `world`, `logout`.
Íconos de estado: `circle-check` (éxito), `alert-circle` (error), `alert-triangle` (atención), `info-circle` (información), `loader` (carga).

## 9. Accesibilidad

- Azul sobre blanco: contraste **10.9:1**. Texto secundario 0.72 ≥ 4.5:1.
- Anillo de foco visible de **2–3 px en todo control** interactivo.
- Área táctil mínima **44 px** en móvil.
- Nunca comunicar estado solo con color: los badges llevan texto y, cuando aplica, punto o ícono.
- Nunca texto amarillo pequeño sobre blanco.

## 10. Marca

| Asset actual | Uso |
|---|---|
| `assets/images/recursos/Logoeduinova.svg` | Marca en topbar, sidebar, login, footer |
| `assets/images/recursos/Ttulo.svg` | Logotipo «EDUINOVA» en login y cabecera del portal |
| `assets/images/recursos/Logouniautonoma.svg` | Escudo en footer del portal y login |

Monograma de respaldo (favicon / miniatura): cuadrado blanco con radio 18 sobre azul, «E» Nunito 900 azul y barra amarilla inferior.
