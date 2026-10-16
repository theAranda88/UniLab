# 04 · Pautas UX — Eduinova

> Reglas de experiencia de usuario y notas por pantalla. Todo lo aquí descrito **reorganiza o reestiliza lo que ya existe**; si una nota requiere un dato o acción que el componente no tiene, esa nota no aplica.

## 1. Principios

1. **Un producto, una marca.** Panel y portal se sienten como el mismo sistema: mismos colores, fuente, botones y badges.
2. **Claridad antes que decoración.** El amarillo solo señala; las sombras son suaves; nada compite con la acción principal.
3. **Nunca prometer lo que no existe.** Ninguna acción visible sin su permiso real; los módulos sin implementar se ven deshabilitados con «Pronto».
4. **Siempre decir qué está pasando.** Toda lista tiene estados de carga, vacío y error; toda acción muestra que está en curso y su resultado.
5. **Móvil primero para el asistente.** La asistencia se registra escaneando un QR en la entrada: el portal, la inscripción y la confirmación se usan desde el teléfono.

## 2. Reglas transversales

| Regla                             | Aplicación                                                                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Permisos**                | Cada botón se muestra solo con la condición que ya usa el componente (`puedeGestionar()`, `puedeRevisar()`, `puedeInscribirse()`…). «Crear escuela» solo ADM y COO; CTA del topbar activo solo si el rol ya lo tiene.          |
| **Títulos**                | El título del topbar, el breadcrumb y el H2 repiten la etiqueta del ítem de navegación (`nav-by-role.ts`). Si dice «Mi panel», todo dice «Mi panel».                                                                             |
| **Descripción de página** | Bajo el H2, una frase que describe lo que el rol realmente ve (un profesor no ve «el sistema completo»).                                                                                                                                |
| **Jerarquía de acciones**  | Un solo botón primario por vista. Secundarias en botón secundario o terciario. Destructivas al final y en rojo.                                                                                                                         |
| **Confirmación**           | Solo las acciones destructivas piden dialog de confirmación, y el texto dice la consecuencia concreta («Se perderá el vínculo con 18 estudiantes y 6 proyectos»).                                                                    |
| **Formularios**             | Label siempre visible (nunca solo placeholder), obligatorio con`*`, ayuda debajo, error en línea junto al campo y resumen arriba si falla el envío. Botón en estado «Guardando…» y formulario bloqueado mientras la API responde. |
| **Vacíos**                 | Toda lista y todo filtro tienen su mensaje de vacío (la rama`length === 0` ya existe: se respeta). Texto que explica qué hacer + acción si hay permiso.                                                                              |
| **Carga**                   | Esperas largas (listas, dashboards): skeleton con la forma del contenido. Esperas cortas (una sección): ícono + texto de contexto.                                                                                                      |
| **Errores**                 | Mensajes en lenguaje humano, sin códigos: qué pasó + qué hacer («Revisa tu conexión e inténtalo de nuevo»).                                                                                                                       |
| **Módulos no disponibles** | Visibles en la navegación, contraste bajo, cursor no permitido, badge «Pronto».                                                                                                                                                        |
| **Idioma**                  | Español, tuteo, frases cortas. Textos vía i18n existente; no se cambian claves.                                                                                                                                                         |

## 3. Recorridos por rol

| Rol                          | Entrada              | Tarea principal                                                   | Pantallas clave                              |
| ---------------------------- | -------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| **Público / externo** | `/`                | Explorar proyectos, inscribirse a un evento, registrar asistencia | 21 → 22 → 23 · 24 → 25 → 15             |
| **Estudiante**         | Portal (tema portal) | Crear proyecto y enviarlo a revisión; inscribirse y asistir      | 19 → 20 · 25 → 15                         |
| **Profesor**           | `/prof/dashboard`  | Revisar y aprobar proyectos de sus estudiantes                    | 06 → 17 → 18                               |
| **Coordinador**        | `/coord/dashboard` | Seguimiento de escuelas y eventos, reportes de asistencia         | 05 → 09 · 11 → 12 → 16                   |
| **Administrador**      | `/admin/dashboard` | Gestionar usuarios, escuelas, eventos y jornadas                  | 04 → 07/08 · 09/10 · 11 → 13 → 14 → 16 |

Primer ingreso (todos): Login (01) → Cambiar contraseña (02) → Completar perfil (03) → panel del rol.

## 4. Notas por pantalla

| #      | Pantalla            | Pautas UX                                                                                                                                                                                                                                                                                                                               |
| ------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01     | Login               | Dos columnas en escritorio: panel azul con marca y 3 beneficios (proyectos, eventos QR, escuelas) + formulario blanco. Error general arriba del formulario («Correo o contraseña incorrectos»). Botón Google debajo de «O continúa con Google». Pie «Conexión segura · Universidad Autónoma». En móvil solo el formulario. |
| 02     | Cambiar contraseña | Card centrada, ayuda «Mínimo 8 caracteres», error de coincidencia en línea. (El maquetado muestra medidor de fortaleza e indicador de paso:**no existen en el código → no se implementan**.)                                                                                                                                |
| 03     | Completar perfil    | Rol asignado mostrado como dato (no editable), campos condicionales del rol agrupados bajo «Campos de {rol}».                                                                                                                                                                                                                         |
| 04–06 | Dashboards          | 4 stat-cards en 2×2 (4 en fila en escritorio amplio), después dos cards de lista (actividad / pendientes) con enlace «Ver todo →». Card con acento para lo que requiere acción («2 proyectos esperan tu revisión»).                                                                                                            |
| 07     | Usuarios lista      | Tabla con contador de registros, chips por rol, badge de estado, acciones en botones-icono; eliminar abre dialog.                                                                                                                                                                                                                       |
| 08     | Usuario form        | Datos personales → segmented de rol → bloque «Campos de {rol}». Tras crear: pantalla/aviso con la**contraseña temporal** destacada, botón copiar y advertencia «no volverá a mostrarse».                                                                                                                                 |
| 09–10 | Escuelas            | Grid de cards (auto-fit) con nombre, cursos y conteo; form corto de una columna.                                                                                                                                                                                                                                                        |
| 11     | Eventos lista       | Chips por estado; card de evento con flyer; acciones «Ver detalle · Asistencia · Reporte» según permiso. Vacío con «Crear evento» solo para ADM.                                                                                                                                                                                |
| 12     | Evento detalle      | Breadcrumb, cabecera con badges (estado, tipo, pago), dato-grid 2 columnas, acciones del rol, lista de jornadas con «Ver QR».                                                                                                                                                                                                         |
| 13     | Evento form         | Secciones: datos básicos, fechas, lugar/descripción, opciones (toggle pago con explicación), flyer (upload con vista previa).                                                                                                                                                                                                        |
| 14     | Jornada crear       | Modal o form corto; nota «Al guardar se genera automáticamente el código QR».                                                                                                                                                                                                                                                       |
| 15     | Asistencia QR       | Pantalla centrada tipo tarjeta, un mensaje grande por estado: éxito (verde), ya registrado (azul), pago pendiente (amarillo), error/no inscrito (rojo). CTA «Ver mis eventos» / «Volver al portal». Optimizada para 412 px.                                                                                                        |
| 16     | Reporte             | Stat-card de total, tabla ancha con scroll horizontal, badges de pago/asistencia, botones «Descargar CSV / Excel».                                                                                                                                                                                                                    |
| 17     | Proyectos asignados | Tabla con chips de estado; acceso «Ver pendientes (n)» destacado.                                                                                                                                                                                                                                                                     |
| 18     | Revisión           | Ficha del proyecto (badge estado, estudiante, curso, semillero), galería, descripción, enlaces; bloque «Decisión» fijo al final: Aprobar (primario) · Rechazar (destructivo) · Publicar (aparece solo cuando`puedePublicar()`, como hoy).                                                                                      |
| 19     | Mis proyectos       | Cards con miniatura y badge de 5 estados, chips por estado, «Gestionar» / «Ver público». Vacío con «Crear mi primer proyecto».                                                                                                                                                                                                  |
| 20     | Proyecto form       | Badge del estado actual en el título; secciones «Datos del proyecto» y «Tipo y enlaces» (los enlaces cambian según el tipo); imágenes con contador «Hasta 5». Acciones: Eliminar (destructivo, izquierda) · Enviar a revisión (primario).                                                                                    |
| 21     | Portal inicio       | Hero azul con partículas y 2 CTA (acento amarillo + secundario), cifras ×4, grid de escuelas, evento destacado.                                                                                                                                                                                                                       |
| 22     | Portal escuela      | «Volver a escuelas», cabecera de la escuela, cards de proyecto con «Explorar».                                                                                                                                                                                                                                                      |
| 23     | Portal proyecto     | Hero con imagen, vistas y fecha; descripción; contexto académico en dato-grid; integrantes con avatar; recursos bloqueados con «Inicia sesión para abrir…» si no hay sesión.                                                                                                                                                     |
| 24     | Portal eventos      | Cards de evento con «Inscribirse» (primario) y «Ver detalle»; vacío «No hay más eventos abiertos».                                                                                                                                                                                                                              |
| 25     | Portal evento       | Dato-grid, bloque de inscripción con explicación («Puedes inscribirte sin tener cuenta…»), aviso de pago si aplica, jornadas; modal de inscripción con tipo de asistente fijo «Externo» y explicación.                                                                                                                         |
| 26     | Acceso denegado     | Tono tranquilo, explica el rol actual y a quién escribir; «Ir a mi panel» + «Cerrar sesión».                                                                                                                                                                                                                                      |
| —     | Modal acceso portal | Pestañas Iniciar sesión / Registrarse; en registro, segmented de tipo de cuenta y aviso de contraseña temporal.                                                                                                                                                                                                                      |

## 5. Móvil (412 px)

- Una columna; padding lateral 16.
- Navegación interna en cajón lateral; portal con header compacto.
- Botones principales a ancho completo al final del contenido; área táctil ≥ 44 px.
- Tablas con scroll horizontal dentro de su card; dato-grid a 2 columnas → 1 si no cabe.
- Modales a pantalla completa.
- Pantallas prioritarias: 21 (portal), 25 (evento + inscripción), 15 (asistencia QR), 19 (mis proyectos).

## 6. Checklist de revisión por pantalla

- [ ] Solo colores de la paleta + derivados + 2 semánticos
- [ ] Nunito en todo el texto; escala tipográfica respetada
- [ ] Un solo botón primario; destructivas en rojo y con confirmación
- [ ] Badges con los estados exactos del backend
- [ ] Estados de carga, vacío y error visibles
- [ ] Foco visible en todos los controles; contraste ≥ 4.5:1 en texto
- [ ] Se ve bien en 412 px, 768 px y 1280 px
- [ ] **Ningún `.ts`, ruta, binding ni clave i18n modificado**
