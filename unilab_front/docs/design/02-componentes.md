# 02 · Componentes reutilizables — Eduinova

> Catálogo de los 24 componentes del sistema de diseño. Cada ficha dice **cómo se ve**, **qué variantes/estados tiene**, **dónde se usa** (nº de pantalla según [export/INDICE.md](export/INDICE.md)) y **qué existe hoy** en el código.
> Valores de color, radio y sombra: ver [01-fundamentos.md](01-fundamentos.md).

Leyenda «Hoy»: 🟢 ya existe como componente compartido · 🟡 existe repetido dentro de cada pantalla · 🔴 no existe (solo se crea como **estilo**, sin lógica nueva).

## Resumen

| # | Componente | Tipo | Hoy | Pantallas |
|---|---|---|---|---|
| C01 | Botón | acción | 🟡 (≈19 hojas de estilo lo redefinen) | todas |
| C02 | Botón-icono | acción | 🟡 | 07, 09, 12, 16 |
| C03 | Campo de texto (input) | formulario | 🟡 | 01–03, 08, 10, 13, 14, 20, 25 |
| C04 | Select | formulario | 🟡 | 03, 08, 13, 20, 25 |
| C05 | Textarea | formulario | 🟡 | 10, 13, 18, 20 |
| C06 | Checkbox / radio / toggle | formulario | 🟡 | 08, 13, 25 |
| C07 | Segmented control | formulario | 🟡 | 08 (rol), modal registro |
| C08 | Upload de imagen | formulario | 🟡 | 13, 20 |
| C09 | Chips-filtro | filtro | 🟡 | 07, 11, 17, 19, 22 |
| C10 | Badge de estado | dato | 🟡 (≈13 hojas) | 04–07, 11, 12, 17–19, 24, 25 |
| C11 | Stat-card | dato | 🟡 (`dashboard-shared.scss`) | 04–06, 16, 21 |
| C12 | Card base / card con acento | superficie | 🟡 | 04–06, 09 |
| C13 | Card de evento (con flyer) | superficie | 🟡 | 11, 21, 24 |
| C14 | Card de proyecto (con miniatura) | superficie | 🟡 | 19, 21, 22 |
| C15 | Dato-grid (metadatos) | dato | 🟡 | 12, 23, 25 |
| C16 | Tabla + paginación | dato | 🟡 | 07, 16, 17 |
| C17 | Avatar / perfil | identidad | 🟡 | shell, 07, 23 |
| C18 | Alerta en línea | feedback | 🟡 | 01, 02, formularios, 15 |
| C19 | Toast | feedback | 🔴 | tras guardar / eliminar |
| C20 | Modal | overlay | 🟢 `shared/ui/modal` | 14, 25 (inscripción), auth-modal |
| C21 | Dialog de confirmación | overlay | 🟢 `shared/ui/dialog` | eliminar usuario / escuela |
| C22 | Dropdown de acciones | overlay | 🟡 | 07, 16, menú de perfil del portal |
| C23 | Breadcrumb | navegación | 🟢 `shared/ui/breadcrumb` | 12, 16, 22, 23, 25 |
| C24 | Estados: vacío · cargando · error | feedback | 🟡 | todas las listas |
| — | Shell (sidebar + topbar) | layout | 🟢 `shared/layout/admin-shell` | 04–18 |
| — | Shell portal (header + footer) | layout | 🟢 `features/home/portal-shell` | 19–25 |

---

## Acciones

### C01 · Botón
| Variante | Fondo | Texto | Borde | Hover |
|---|---|---|---|---|
| **Primario** | Azul | Blanco | Azul | Azul presionado `#032A6A` |
| **Secundario** | Blanco | Azul | Azul | Azul tinte |
| **Terciario / enlace** | Transparente | Azul | — | Azul tinte |
| **Destructivo** | Blanco | Error `#B02A2A` | Error 35 % | Error tinte 7 % |
| **Acento** (solo portal, CTA de evento/QR) | Amarillo | Negro | — | Amarillo más oscuro `#D4BB17` |

- Tamaños: **Pequeño 32 px** (13/700, padding 14) · **Medio 40 px** (14/700, padding 18) · **Grande 48 px** (15/700, padding 24).
- Radio 8. Ícono opcional a la izquierda, gap 8.
- Estados: hover · foco (anillo) · presionado (baja 1 px) · deshabilitado (neutro 5 %, texto 0.38, borde 0.12) · **cargando** (ícono `loader` girando + texto «Guardando…», el formulario se bloquea).
- Regla: **un solo primario por vista/formulario**. «Cancelar» siempre secundario, a la izquierda del primario.

### C02 · Botón-icono
Cuadrado 32–36 px, radio 8, ícono 18 px en azul o negro 0.72. Hover azul tinte. La versión destructiva usa texto error. Siempre con `aria-label` / tooltip.

---

## Formularios

### C03 · Campo de texto
- Label arriba: 13/700 negro; asterisco `*` para obligatorio.
- Control: alto **42 px**, padding 12, radio 8, borde de control 0.16, fondo blanco, texto 14.
- Ayuda debajo: 13, texto secundario.
- Estados: **foco** (borde azul + anillo) · **error** (borde error 55 % + mensaje en error debajo, ej. «Formato de correo no válido.») · **válido** (borde éxito 45 % + mensaje en éxito, ej. «Documento disponible.») · **deshabilitado** (fondo neutro 4 %, texto 0.45).
- Variante contraseña: botón-icono de ojo a la derecha solo donde el componente ya lo tiene (el medidor de fortaleza del maquetado no existe en el código y no se implementa).

### C04 · Select
Mismo aspecto que C03, flecha dibujada en azul a la derecha, sin apariencia nativa. Placeholder «Seleccionar».

### C05 · Textarea
Mismo borde y radio que C03, padding 10/12, line-height 1.5, redimensión solo vertical, 3 filas mínimo.

### C06 · Checkbox · radio · toggle
Marcador 18 px radio 4 (checkbox) o circular (radio); marcado en azul. Toggle para opciones booleanas del evento («Requiere pago de inscripción», «Publicar en el portal público»). Label a la derecha en 14/500.

### C07 · Segmented control
Grupo horizontal de opciones exclusivas en contenedor con borde; opción activa **azul con texto blanco**, inactivas transparente con texto 0.65. Usos: rol en 08, modalidad (Presencial / Virtual / Híbrida), tipo de cuenta en el modal de registro.

### C08 · Upload de imagen
Zona punteada con ícono `photo-up`, texto de ayuda y vista previa de la imagen cargada con botón-icono para quitar.

---

## Filtros y datos

### C09 · Chips-filtro
Pastillas (pill) de 32 px, 13/600. Inactivo: blanco + borde sutil. Activo: azul tinte + texto azul + borde azul 22 %. Pueden llevar contador. **Todo filtro necesita su estado vacío** (C24).

### C10 · Badge de estado
Alto 24, padding 0 10, radio 6, 12/700, borde 1 px. Opcional punto de 6 px delante.
Los estados son exactamente los del backend:

| Dominio | Valor backend | Etiqueta | Estilo |
|---|---|---|---|
| Proyecto | `borrador` | Borrador | Neutro (fondo 6 %, texto 0.70) |
| | `en_revision` | En revisión | Amarillo tinte + texto `#6B5A00` |
| | `aprobado` | Aprobado | Azul tinte + texto azul |
| | `publicado` | Publicado | Azul sólido + texto blanco |
| | `rechazado` | Rechazado | Error tinte + texto `#8E1F1F` |
| Evento | `planeado` | Planeado | Neutro |
| | `activo` | Activo | Azul tinte + punto azul |
| | `finalizado` | Finalizado | Negro 85 % + texto blanco |
| Pago | `confirmado` | Pagado | Azul tinte |
| | `pendiente` | Pendiente | Amarillo tinte |
| | `exento` / sin pago | Gratuito | Neutro |
| Usuario | activo | Activo | Azul tinte |
| | por autorizar | Por autorizar | Amarillo tinte |
| | inactivo | Inactivo | Neutro |
| Navegación | `enabled: false` | Pronto / Próximamente | Neutro 5 %, texto 0.42, **borde punteado** |

Badges de rol (Administrador, Coordinador, Profesor, Estudiante): neutros con ícono del rol.

### C11 · Stat-card
Card blanca con sombra base: ícono en contenedor azul tinte (arriba), **label** 13/600 secundario, **valor** grande 32/900 negro, **nota** 13 secundario, y barra inferior de 3 px (azul, azul 25 %, amarillo o negro 20 % para diferenciar).
Grupo fijo de 4 → **rejilla de 2 columnas explícitas** (2×2), no auto-fit.

### C12 · Card base y card con acento
- Base: blanco, borde sutil, radio 10–12, sombra base, padding 20–24.
- Con acento: la misma card con **barra amarilla de 3 px** o punto/contador amarillo para llamar la atención (ej. «2 proyectos esperan tu revisión»). El amarillo nunca rellena la card.

### C13 · Card de evento
Flyer arriba (proporción fija, recorte `cover`), debajo: badge de estado + tipo, título 18/800, lugar e intervalo de fechas con íconos, descripción recortada a 2 líneas e indicador de pago. Los mismos campos que el listado actual; no se agregan datos.

### C14 · Card de proyecto
Miniatura, kicker con tipo de proyecto y periodo, título, resumen a 2–3 líneas, curso/origen y enlace «Explorar» / «Ver ficha». En «Mis proyectos» añade el badge de estado.

### C15 · Dato-grid
Franja de pares etiqueta/valor (Tipo, Lugar, Fechas, Inscripción…). Etiqueta 11–12 kicker secundario, valor 14/600. Número de celdas fijo → **2 columnas explícitas** (nunca auto-fit, que deja una celda huérfana; con `gap: 1px` sobre fondo del padre se vería un bloque gris).

### C16 · Tabla + paginación
- Cabecera: título de la tabla + contador «4 de 128 registros», chips-filtro, CTA a la derecha.
- Encabezados 12/700 secundario sobre fondo neutro 4 %; filas 14, alto ≈ 56, divisor sutil, hover azul tinte 3.5 %.
- Primera columna con avatar + nombre + correo; estado como badge; acciones como botones-icono o dropdown.
- Paginación: «Página 1 de 32» a la izquierda, «Anterior · 1 2 3 · Siguiente» a la derecha; página activa azul.
- Móvil: scroll horizontal dentro del contenedor, sin romper la página.

### C17 · Avatar y perfil
Círculo 32–40 px con iniciales 700 sobre azul tinte (o azul sólido en el sidebar). Grupo apilado con «+N». Bloque de perfil: avatar + nombre del rol + subtítulo (ej. «Gestión completa del sistema»).

---

## Feedback

### C18 · Alerta en línea
Caja con ícono 19 px, título 14/700 y texto 14. Radio 10, borde 1 px del color con tinte de fondo.

| Tipo | Ícono / título | Fondo |
|---|---|---|
| Información | Azul | Azul tinte |
| Atención | `#6B5A00` / título `#3D3400` | Amarillo tinte |
| Éxito | Éxito `#1F6D3F` | Éxito tinte |
| Error | Error `#B02A2A` / título `#8E1F1F` | Error tinte |

### C19 · Toast
Abajo a la derecha (24 px de margen), fondo negro `#1E1E1E`, texto blanco 14/600, ícono amarillo 20 px, radio 10, entra con fundido hacia arriba 200 ms y se oculta a los ~2.6 s. Solo mensajes cortos de confirmación («Cambios guardados correctamente»). Se aplica solo donde el código ya muestra un mensaje de éxito.

### C20 · Modal
Para **formularios cortos** (crear jornada, inscripción a evento, acceso/registro del portal). Blanco, radio 12, sombra overlay, overlay 45 %. Cabecera con título H4 y botón cerrar; pie con Cancelar (secundario) + acción (primario) alineados a la derecha. Tamaños sm / md / lg (ya existen en `modal-shell`). Pantalla completa en móvil.

### C21 · Dialog de confirmación
**Solo para acciones destructivas.** Ícono de alerta 23 px en contenedor 48 px error tinte, título «¿Eliminar …?», texto que explica la consecuencia («Esta acción no se puede deshacer»), botones Cancelar + **Eliminar (destructivo)**.

### C22 · Dropdown de acciones
Disparador botón-icono `dots` o botón «Acciones». Menú blanco, radio 10, sombra overlay, ítems 38 px con ícono. La acción destructiva va al final, separada por divisor y en color error.

### C24 · Estados de contenido
| Estado | Composición |
|---|---|
| **Vacío** | Ícono grande en azul tinte, título («Aún no tienes proyectos»), texto que explica qué hacer y **una** acción si el usuario tiene permiso. Una variante por rol. |
| **Cargando (larga)** | Skeletons con la forma real del contenido (stat-cards, filas de tabla), fondo neutro 6 % con brillo suave. |
| **Cargando (corta)** | Ícono `loader` + texto de contexto («Cargando jornadas del evento»), sin skeleton. |
| **Error de sección** | Ícono error, «No se pudo cargar la información», explicación y botones «Reintentar» + «Volver atrás». |
| **Filtro sin resultados** | El mismo patrón de vacío dentro de la tabla/lista; nunca un encabezado huérfano. |

---

## Navegación y layout

### C23 · Breadcrumb
Ruta en 13/600 secundario separada por `/` o chevron; último ítem en negro sin enlace. Ej.: Eventos / Semana de la Ingeniería / Reporte.

### Shell interno (ADM, COO, PRO)
- **Sidebar 220 px** blanco con borde derecho: marca «EDUINOVA · Gestión académica», secciones con título kicker, ítems 38 px (13/600).
  - Activo: azul tinte + texto azul + **barra amarilla de 3 px a la izquierda**.
  - Habilitado: texto 0.75, hover azul tinte.
  - Deshabilitado: texto 0.34, cursor no permitido, badge «Pronto».
  - Pie: acceso «Portal público» + perfil (avatar, rol, subtítulo) + «Cerrar sesión».
- **Topbar**: título de página H3 a la izquierda (igual a la etiqueta del ítem de navegación), a la derecha enlace al Portal, notificaciones con contador y CTA del rol.
- Área de contenido sobre crema, padding 32; encabezado de página con H2 + descripción.
- **< 768 px**: el sidebar se convierte en cajón lateral abierto desde un botón del topbar.

### Shell portal (PUB, EST)
- Header blanco: logotipo, navegación (Inicio · Escuelas y proyectos · Eventos), «Iniciar sesión» o menú de perfil.
- Hero azul institucional con partículas (el `spiderweb-canvas` existente, recoloreado), título display blanco, texto 0.88, CTAs primario-acento + secundario sobre azul.
- Footer azul institucional `#053686` (ancho máx. 1180 px): escudo, descripción, columnas Portal / Acceso.
