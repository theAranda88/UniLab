# Sprint · Dev 1 — Autenticación, perfil y usuarios

**Rama:** `feature/auth-perfil-usuarios` → **destino:** `unilab-qa`
**Revisor:** Daniel Aranda (@theAranda88)

Este documento resume lo implementado por el Dev 1 del sprint "Escuelas, Semilleros y Perfil de Usuario", cómo probarlo y lo que queda pendiente.

---

## Historias de usuario

### HU-1.1 · Perfil completo del usuario autenticado

**Problema:** el login solo devolvía correo y rol, y el usuario no podía editar sus datos ni cambiar su contraseña voluntariamente.

**Backend**
- El login (correo y Google), `completar-perfil` y el nuevo `GET /api/auth/me` devuelven la misma sesión: nombres, apellidos, teléfono, rol, escuela, semilleros (uno o varios, con el papel en cada uno: `lider`, `profesor` o `miembro`), redes de contacto y datos del perfil según el rol (código, cargo, dependencia, profesión, institución, ocupación).
- `PATCH /api/auth/me`: el usuario edita su teléfono, sus redes (LinkedIn, GitHub, portafolio) y, si es Coordinador, su profesión. No permite cambiar rol, correo ni documento.
- `POST /api/auth/me/password`: cambio de contraseña pidiendo la actual (mínimo 8 caracteres, distinta de la actual).
- El administrador puede registrar redes y la profesión del coordinador al crear o editar usuarios.

**Frontend**
- Nueva pantalla **Mi perfil** (`/admin/perfil`, `/coord/perfil`, `/prof/perfil` y `/perfil` en el portal): rol, escuela, semilleros, datos del perfil, formulario de contacto (teléfono, profesión, redes) y cambio de contraseña.
- La sesión se refresca con `/auth/me` al recargar la página.
- La tarjeta de usuario del panel muestra la escuela y enlaza a Mi perfil; el menú de perfil del portal muestra escuela, semilleros y redes.
- «Completar perfil» admite las redes de contacto (opcionales).

### HU-1.2 · Listado de usuarios de solo lectura por rol

**Problema:** `/api/usuarios` era exclusivo del administrador; el coordinador no podía consultar profesores ni estudiantes.

**Backend**
- `GET /api/usuarios/consulta?rol=&id_escuela=&busqueda=` (Administrador, Coordinador, Profesor).
  - Administrador y Coordinador: profesores y estudiantes de todas las escuelas.
  - Profesor: solo estudiantes de su escuela (pedir `rol=Profesor` u otra escuela → 403).
- Devuelve únicamente datos públicos (sin documento ni credenciales).

**Frontend**
- Se habilitan **Profesores** y **Estudiantes** en el menú del coordinador: tabla de solo lectura con búsqueda (ignora tildes), filtro por escuela, paginación y enlaces de contacto.

### HU-1.3 · Estudiantes del profesor

**Backend**
- `GET /api/profesores/me/estudiantes` (Profesor): miembros aprobados de los semilleros que lidera o en los que está asignado, y autores de los proyectos que coordina o de semilleros que lidera. Cada estudiante trae sus semilleros y proyectos, sin duplicados.

**Frontend**
- Se habilita **Mis estudiantes** en el menú del profesor, con dos vistas: «Mis semilleros y proyectos» (filtro por semillero o proyecto) y «Mi escuela» (usa el listado de HU-1.2).

---

## Migraciones de base de datos

| Migración | Cambio |
|---|---|
| `20261019000000_redes_contacto_usuarios` | `usuarios.url_linkedin`, `url_github`, `url_portafolio` (nullable) |
| `20261020000000_profesion_coordinador` | `perfiles_coordinador.profesion` (nullable) |

Ambas solo agregan columnas opcionales: no modifican ni borran datos existentes.

```bash
cd unilab_back
npx prisma migrate deploy
npx prisma generate
```

---

## Endpoints nuevos (documentados en Swagger `/api-docs`)

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/auth/me` | Autenticado |
| PATCH | `/api/auth/me` | Autenticado |
| POST | `/api/auth/me/password` | Autenticado |
| GET | `/api/usuarios/consulta` | Administrador, Coordinador, Profesor |
| GET | `/api/profesores/me/estudiantes` | Profesor |

**Cambio en la respuesta existente:** `POST /api/auth/login` y `POST /api/auth/google` devuelven más campos en `usuario`. Los campos anteriores se mantienen, así que es compatible.

---

## Cómo probar

Usuarios del seed (contraseña `Password123!`):

| Usuario | Qué verificar |
|---|---|
| `estudiante1@unilab.edu` | Menú de perfil del portal con escuela y semillero → **Mi perfil**: editar teléfono y redes, cambiar contraseña. No aparece el campo de profesión. |
| `coordinador@unilab.edu` | Menú **Profesores** y **Estudiantes** (solo lectura, búsqueda y filtro por escuela). En Mi perfil puede registrar su **profesión**. |
| `profesor1@unilab.edu` | **Mis estudiantes** con sus dos vistas y filtros. La tarjeta lateral muestra su escuela. |
| `admin@unilab.edu` | Al crear o editar un coordinador aparece el campo **Profesión**. |

Casos de error esperados:
- LinkedIn que no sea de `linkedin.com` → error de validación.
- Teléfono con letras o con menos de 7 dígitos → 400.
- Contraseña actual incorrecta → «La contraseña actual no es correcta».
- Profesor que pide `rol=Profesor` en `/usuarios/consulta` → 403.
- Estudiante que intenta registrar profesión → 422.

---

## Resultados de pruebas

| Proyecto | Comando | Resultado |
|---|---|---|
| Backend | `npm test` | 81 pruebas OK (nuevas: `auth.perfil`, `usuario.consulta` y casos en `schemas`) |
| Backend | `npx tsc --noEmit` | Sin errores |
| Frontend | `npx ng test --watch=false` | 37 pruebas OK (nuevas: validador de redes, `UsuariosService`, rutas del menú) |
| Frontend | `npx ng build` | Sin errores ni advertencias |

Además se probaron todos los endpoints contra la API local con cada rol, incluidos los casos 403, 400 y 422.

---

## Observaciones para el equipo

1. **`GET /api/usuarios` (admin) devuelve `password_hash`.** Es anterior a este trabajo y no se modificó. Los endpoints nuevos no lo exponen. Se recomienda corregirlo.
2. **Express 5 y `req.query`:** el middleware `validate` no conserva los valores convertidos de la query, porque Express 5 vuelve a parsearla en cada acceso. En `/usuarios/consulta` se resolvió validando de nuevo en el controlador; otras rutas con filtros por query tienen el mismo comportamiento.
3. **Una escuela por perfil:** profesor y estudiante siguen teniendo una sola escuela (`id_escuela`), y los semilleros sí pueden ser varios. Si se necesita que un usuario pertenezca a varias escuelas, habría que cambiar el modelo y coordinarlo con el Dev 2 (Escuelas).
4. **El rol no es editable por el usuario:** se muestra en el perfil, pero solo el administrador lo cambia.
5. **URL de la API:** los servicios nuevos siguen el patrón actual (`http://localhost:3000`). Pasarlos a `environment.apiUrl` corresponde a la tarea 3.4 del Dev 3.
