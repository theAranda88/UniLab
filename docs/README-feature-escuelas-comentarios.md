# Sprint · Dev 2 — Escuelas y comentarios

**Rama:** `feature/escuelas-comentarios` (creada desde `unilab-qa`) → **destino:** `unilab-dev` y `unilab-qa`
**Revisor:** Daniel Aranda (@theAranda88)

Este documento resume lo implementado por el Dev 2 del sprint "Escuelas, Semilleros y Perfil de Usuario", cómo probarlo y lo que queda pendiente.

---

## Historias de usuario

### HU-2.1 · Información completa de la escuela

**Problema:** la escuela solo guardaba su nombre; el color y el ícono del portal se deducían del nombre y no había un responsable.

**Backend**
- Nuevos campos opcionales en `escuelas`: `descripcion`, `color` (`#RRGGBB`), `icono` (clase Phosphor `ph-*`) e `id_encargado`, y tabla `escuela_imagenes`.
- `POST` y `PATCH /api/escuelas` aceptan los campos nuevos. El `PATCH` ahora es parcial (al menos un campo); `id_encargado: null` quita el encargado.
- El encargado debe ser un **Profesor activo** (otro rol o inactivo → 422).
- `GET /api/escuelas` y `GET /api/escuelas/:id` incluyen el encargado (solo `id_usuario`, nombres y apellidos) y las imágenes con su URL pública.
- Al eliminar una escuela, el borrado lógico alcanza también a sus imágenes.

**Frontend**
- **Formulario de escuela:** descripción (máx. 2000 caracteres), selector de encargado (profesores activos), selector de color (sugeridos o uno libre) y de ícono, con vista previa de la tarjeta. «Automático» conserva el color e ícono deducidos del nombre.
- **Listado de escuelas:** cada tarjeta muestra el color, el ícono, el encargado y la descripción.
- `estiloDeEscuela()` en `portal-theme.util.ts`: usa el color e ícono guardados y, si faltan, los deducidos del nombre. Así las escuelas existentes se ven igual que antes.

### HU-2.2 · Imágenes de la escuela

**Backend**
- `POST /api/escuelas/:id/imagenes` (multipart, campo `imagenes`) y `DELETE /api/escuelas/:id/imagenes/:idImagen`, para Administrador y Coordinador.
  - JPEG, PNG o WebP de hasta 5 MB; **máximo 5 imágenes por escuela** (si se supera → 422 y se descartan los archivos).
  - Al eliminar se reordenan las restantes y se borra el archivo físico.
- **Middleware de subida compartido** (`middlewares/upload/subirImagenes.middleware.ts`): recibe el campo, el máximo y la carpeta destino, y traduce los errores de multer a 400. Lo usan las escuelas; proyectos y eventos pueden migrar a él más adelante.
- `GET /api/public/escuelas` devuelve además la descripción, el color, el ícono y las imágenes (sin encargado ni cursos).

**Frontend**
- Componente compartido **`app-image-uploader`** (`shared/ui/image-uploader`): vista previa, quitar imágenes pendientes y eliminar las guardadas (con confirmación); valida tipo, peso y máximo antes de enviar.
- En el formulario, las imágenes nuevas se suben al guardar. Si la escuela se guarda pero la subida falla, el formulario queda en modo edición para reintentar solo las imágenes.
- **Portal (`/escuelas/:id`):** muestra la descripción, el color y un carrusel con las imágenes de la escuela. El inicio del portal y el detalle de proyecto usan el mismo color e ícono.

### HU-2.3 · Comentarios

**Problema:** los comentarios públicos se mostraban como «Miembro de la comunidad» y no se podían eliminar.

**Backend**
- Los comentarios del detalle de proyecto (público y privado) y el comentario recién creado incluyen `usuario` con nombres y apellidos del autor (sin correo).
- `DELETE /api/comentarios/:id` con borrado lógico. Solo el **autor** o el **Administrador** (cualquier otro → 403). Elimina también las respuestas del comentario para que no queden huérfanas.

**Frontend**
- En el detalle de proyecto del portal se muestra el nombre del autor y una marca «Tú» en los comentarios propios.
- Botón **«Eliminar»** solo en los comentarios propios, con confirmación.

---

## Migraciones de base de datos

| Migración | Cambio |
|---|---|
| `20261023000000_escuelas_informacion_imagenes` | `escuelas.descripcion`, `color`, `icono`, `id_encargado` (nullable, FK a `usuarios`) y tabla `escuela_imagenes` |

Solo agrega columnas opcionales y una tabla nueva: no modifica ni borra datos existentes.

```bash
cd unilab_back
npx prisma migrate deploy
npx prisma generate
```

---

## Endpoints nuevos o modificados (documentados en Swagger `/api-docs`)

| Método | Ruta | Roles | Cambio |
|---|---|---|---|
| POST | `/api/escuelas` | Administrador, Coordinador | Acepta descripción, color, ícono y encargado |
| PATCH | `/api/escuelas/:id` | Administrador, Coordinador | Parcial; mismos campos |
| GET | `/api/escuelas`, `/api/escuelas/:id` | Autenticado | Incluyen encargado e imágenes |
| POST | `/api/escuelas/:id/imagenes` | Administrador, Coordinador | **Nuevo** |
| DELETE | `/api/escuelas/:id/imagenes/:idImagen` | Administrador, Coordinador | **Nuevo** |
| GET | `/api/public/escuelas` | Público | Incluye descripción, color, ícono e imágenes |
| DELETE | `/api/comentarios/:id` | Autor o Administrador | **Nuevo** |

**Cambios compatibles:** las respuestas existentes solo agregan campos. El único cambio de contrato es que `PATCH /api/escuelas/:id` ya no exige `nombre_escuela`.

---

## Cómo probar

Usuarios del seed (contraseña `Password123!`):

| Usuario | Qué verificar |
|---|---|
| `coordinador@unilab.edu` | **Escuelas → Crear/Editar:** descripción, encargado, color, ícono e imágenes (subir, ver la vista previa y eliminar). La tarjeta del listado muestra color, ícono y encargado. |
| Sin sesión | En el portal, abrir una escuela: descripción, color y carrusel de imágenes. |
| `estudiante1@unilab.edu` | En el detalle de un proyecto publicado: comentar, ver su nombre con la marca «Tú» y eliminar su comentario (con confirmación). En los comentarios de otros no aparece «Eliminar». |
| `admin@unilab.edu` | Puede eliminar cualquier comentario por API (`DELETE /api/comentarios/:id`). |

Casos de error esperados:
- Encargado que no es Profesor activo → 422.
- Color que no es `#RRGGBB` o ícono que no es `ph-*` → 400.
- Más de 5 imágenes por escuela → 422; archivo que no es imagen → 400.
- Profesor o Estudiante que sube imágenes de una escuela → 403.
- Usuario que intenta borrar un comentario ajeno (incluido el Coordinador) → 403; comentario ya eliminado → 404.

---

## Resultados de pruebas

| Proyecto | Comando | Resultado |
|---|---|---|
| Backend | `npm test` | 97 pruebas OK (nuevas: `escuela.service`, `comentario` y casos en `schemas`) |
| Backend | `npx tsc --noEmit` | Sin errores |
| Frontend | `npx ng test --watch=false` | 45 pruebas OK (nuevas: `portal-theme.util`, `EscuelasService`) |
| Frontend | `npx ng build` | Sin errores; mantiene las 3 advertencias que ya tenía la rama base (presupuesto del bundle inicial, SCSS de `asistencia-qr` y `qrcode` no ESM) |

Además se probaron los endpoints contra una base PostgreSQL local con migraciones y seed, con cada rol: 44 casos (creación y edición, validaciones 400/403/404/422, subida y borrado de imágenes con reordenamiento, portal público, autor de comentarios y permisos de borrado). Cada commit compila y pasa las pruebas por sí solo.

---

## Observaciones para el equipo

1. **Encargado = Profesor.** Se limitó a profesores porque el coordinador no tiene escuela en su perfil y el listado de profesores (`/usuarios/consulta`) ya está disponible para Administrador y Coordinador. Si se quiere permitir coordinadores, basta con ampliar `findEncargadoValido`.
2. **Middleware de subida compartido.** Proyectos y eventos siguen con sus middlewares propios (código casi idéntico); se recomienda migrarlos a `subirImagenes` en una tarea aparte.
3. **Carpetas vacías al subir a una escuela inexistente.** Multer crea la carpeta antes de que el servicio responda 404 (igual que en proyectos); los archivos sí se descartan.
4. **Borrado de comentarios en cascada.** Eliminar un comentario elimina sus respuestas, incluidas las de otros usuarios. Si se prefiere conservarlas, habría que mostrar «Comentario eliminado» en su lugar.
5. **URL de la API:** los servicios nuevos siguen el patrón actual (`http://localhost:3000`); pasarlos a `environment.apiUrl` corresponde a la tarea 3.4 del Dev 3.
