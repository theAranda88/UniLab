# Sprint Dev 2 - Escuelas y comentarios

**Rama:** `feature/escuelas-comentarios` (sale de `unilab-qa`)
**Va para:** `unilab-dev` y `unilab-qa`
**Revisa:** Daniel Aranda (@theAranda88)

Aquí dejo lo que hice de las historias HU-2.1, HU-2.2 y HU-2.3, cómo probarlo y algunas cosas a tener en cuenta.

---

## HU-2.1 Información completa de la escuela

Antes la escuela solo tenía el nombre. Ahora también tiene descripción, color, ícono y un encargado.

**Backend**
- Migración con los campos nuevos en `escuelas` (todos opcionales) y la tabla `escuela_imagenes`.
- Crear y editar escuela reciben `descripcion`, `color` (formato `#RRGGBB`), `icono` (ícono de Phosphor, ej. `ph-code`) e `id_encargado`.
- El encargado tiene que ser un profesor activo, si no devuelve 422. Si se manda `id_encargado: null` se quita.
- El PATCH ya no obliga a mandar el nombre, se puede editar solo un campo.
- Al consultar una escuela viene el encargado (solo el nombre) y sus imágenes.

**Frontend**
- En el formulario se agregaron la descripción, el selector de encargado, el color y el ícono. Hay una vista previa de cómo queda la tarjeta.
- Si no se escoge color o ícono, queda en "Automático" y se usa el que ya tenía según el nombre, entonces las escuelas que ya existían se siguen viendo igual.
- En el listado cada tarjeta muestra su color, ícono, encargado y descripción.

## HU-2.2 Imágenes de la escuela

**Backend**
- `POST /api/escuelas/:id/imagenes` para subir (campo `imagenes`) y `DELETE /api/escuelas/:id/imagenes/:idImagen` para borrar. Solo admin y coordinador.
- Se permiten JPG, PNG o WebP de máximo 5 MB, y hasta 5 imágenes por escuela.
- Hice un middleware de subida que se puede reutilizar (`subirImagenes.middleware.ts`), por ahora solo lo usan las escuelas.
- `/api/public/escuelas` ahora también trae la descripción, el color, el ícono y las imágenes.

**Frontend**
- Componente `app-image-uploader` para subir imágenes con vista previa y poder quitarlas.
- Las imágenes nuevas se suben cuando se guarda la escuela.
- En el portal, la página de la escuela muestra la descripción, el color y un carrusel con las imágenes.

## HU-2.3 Comentarios

**Backend**
- Los comentarios ahora traen el nombre de quien comentó.
- `DELETE /api/comentarios/:id` hace borrado lógico. Solo lo puede borrar el que lo escribió o el admin, cualquier otro recibe 403. Si el comentario tiene respuestas, también se borran.

**Frontend**
- En el detalle del proyecto se ve el nombre del autor de cada comentario.
- En los comentarios propios aparece el botón "Eliminar", que pide confirmación antes de borrar.

---

## Migración

`20261023000000_escuelas_informacion_imagenes`: solo agrega columnas opcionales y una tabla nueva, no toca datos existentes.

```bash
cd unilab_back
npx prisma migrate deploy
npx prisma generate
```

## Endpoints

| Método | Ruta | Quién |
|---|---|---|
| POST / PATCH | `/api/escuelas` | Admin, Coordinador (campos nuevos) |
| POST | `/api/escuelas/:id/imagenes` | Admin, Coordinador (nuevo) |
| DELETE | `/api/escuelas/:id/imagenes/:idImagen` | Admin, Coordinador (nuevo) |
| DELETE | `/api/comentarios/:id` | Autor o Admin (nuevo) |

Todo está en Swagger (`/api-docs`).

## Cómo probar

Con los usuarios del seed (clave `Password123!`):

- `coordinador@unilab.edu`: ir a Escuelas, crear o editar una escuela con descripción, encargado, color, ícono e imágenes, y revisar que la tarjeta del listado se vea bien.
- Sin iniciar sesión: entrar a una escuela en el portal y ver la descripción, el color y las imágenes.
- `estudiante1@unilab.edu`: en un proyecto publicado, comentar, ver el nombre en el comentario y borrarlo. En los comentarios de otros no debe salir "Eliminar".

Errores que deberían salir:
- Encargado que no es profesor: 422.
- Color o ícono con formato malo: 400.
- Más de 5 imágenes: 422.
- Borrar el comentario de otra persona: 403.

## Pruebas

- Backend: `npm test` 97 pruebas bien y `npx tsc --noEmit` sin errores.
- Frontend: `npx ng test --watch=false` 45 pruebas bien y `npx ng build` sin errores (salen las mismas advertencias que ya tenía qa).
- También probé los endpoints con la base local y los diferentes roles.

## Para tener en cuenta

- El encargado solo puede ser profesor, porque el coordinador no tiene escuela en el perfil. Si se necesita que también sea coordinador se puede cambiar.
- Proyectos y eventos siguen con sus propios middlewares de subida, se podrían pasar al nuevo más adelante.
- Al borrar un comentario se borran sus respuestas, aunque sean de otras personas.
- Las URLs de la API siguen con `http://localhost:3000` como el resto del proyecto.
