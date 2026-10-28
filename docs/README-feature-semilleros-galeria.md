# Sprint · Dev 3 — Semilleros: portada, galería y portal público

**Rama:** `feature/semilleros-galeria` → **destino:** `unilab-qa`  
**Revisor:** vXro1

Este documento resume lo implementado por el Dev 3 del sprint «Escuelas, Semilleros y Perfil de Usuario» (historias HU-3.1 a HU-3.4), cómo probarlo y lo que conviene tener en cuenta en QA.

---

## Historias de usuario

### HU-3.1 · Portada del semillero

**Problema:** el semillero no tenía imagen de portada en administración ni en respuestas del API; crear/editar no devolvía la escuela asociada de forma consistente.

**Backend**
- Migración con `semilleros.foto_portada_ruta` y `semilleros.url_foto_portada` (opcionales).
- `PUT /api/semilleros/:id/portada` (Administrador): multipart, campo `portada`; JPG, PNG o WebP, máximo 5 MB; sustituye la portada anterior y borra el archivo previo en disco.
- `DELETE /api/semilleros/:id/portada` (Administrador): quita portada en BD y archivo físico.
- Crear y actualizar semillero devuelven el recurso con objeto `escuela` (id y nombre), además de `url_foto_portada` cuando aplique.

**Frontend**
- Formulario admin de semillero (`/admin/semilleros/crear`, `/admin/semilleros/:id/editar`): subida de portada con vista previa, reemplazo y eliminación vía API.
- Listado y detalle admin muestran la portada cuando existe.

### HU-3.2 · Galería de evidencias (admin)

**Problema:** no había forma de adjuntar fotos de actividades del semillero para mostrarlas después en el portal.

**Backend**
- Tabla `semillero_evidencias` con soft-delete (`deleted_at`), orden, metadatos de archivo y `created_by`.
- `GET /api/semilleros/:id/evidencias` (cualquier rol autenticado con acceso al módulo): lista evidencias activas con URL pública.
- `POST /api/semilleros/:id/evidencias` (Administrador): multipart, campo `evidencias` (varios archivos por petición); tope **10 evidencias activas** por semillero; mismas reglas de imagen que la portada.
- `DELETE /api/semilleros/:id/evidencias/:idEvidencia` (Administrador): borrado lógico.

**Frontend**
- Componente `app-semillero-galeria` en el detalle admin (`/admin/semilleros/:id`): grid con lightbox, subida y eliminación solo para administrador.

### HU-3.3 · Semilleros en el portal público

**Problema:** los visitantes no podían descubrir semilleros desde el inicio ni desde la ficha de escuela.

**Backend**
- `GET /api/public/semilleros`: listado paginado de semilleros **activos** y no eliminados; query opcional `id_escuela`, `pagina` (default 1), `limite` (default 12, máx. 50). Respuesta `{ data, paginacion: { pagina, limite, total, total_paginas } }`.
- `GET /api/public/semilleros/:id`: detalle con escuela (incluye color e ícono), líder, conteo de miembros aprobados, portada y galería pública de evidencias.
- Semillero inactivo, soft-deleted o inexistente → 404.

**Frontend**
- Inicio (`/`): sección `#semilleros` con tarjetas (portada, escuela, miembros) enlazando a `/semilleros/:idSemillero`.
- Página de escuela en el portal: bloque de semilleros de esa escuela con el mismo patrón de tarjetas.
- Detalle público `/semilleros/:idSemillero`: portada, galería, descripción y enlace de vuelta al inicio o a la escuela.
- Ruta `/semilleros` en el portal (usuario con sesión de estudiante): listado propio del módulo de semilleros del portal.
- Entrada en la navbar del portal cuando la ruta corresponde.

### HU-3.4 · Configuración de API y OAuth (Docker)

**Problema:** la URL del backend estaba repetida en cada servicio; el login con Google fallaba en Docker si el origen `8080` no estaba registrado en Google Cloud.

**Frontend / OPS**
- `src/environments/environment.ts` y `environment.prod.ts` con `apiUrl` (por defecto `http://localhost:3000/api`); servicios HTTP y `resolverUrlImagen` consumen `environment.apiUrl`.
- `angular.json`: `fileReplacements` en build `production`.
- Specs de servicios HTTP alineados con `environment`.
- README raíz: sección **Login con Google (OAuth)** con orígenes `http://localhost:8080` y opcional `http://localhost:4200`; `.env.example` anota coherencia con `google.config.ts` y `GOOGLE_CLIENT_ID`.
- Comentario en `google.config.ts` recordando el origen Docker `8080`.

---

## Migraciones de base de datos

| Migración | Cambio |
|---|---|
| `20261027000000_semillero_foto_portada` | Columnas `foto_portada_ruta`, `url_foto_portada` en `semilleros` |
| `20261027010000_semillero_evidencias` | Tabla `semillero_evidencias` + FKs e índice por semillero |

Solo agregan columnas/tabla; no modifican datos existentes.

```bash
cd unilab_back
npx prisma migrate deploy
npx prisma generate
```

Con Docker, las migraciones se aplican al arrancar el servicio `api`.

---

## Endpoints nuevos o ampliados (Swagger `/api-docs` y Postman)

| Método | Ruta | Roles / acceso |
|---|---|---|
| PUT | `/api/semilleros/:id/portada` | Administrador |
| DELETE | `/api/semilleros/:id/portada` | Administrador |
| GET | `/api/semilleros/:id/evidencias` | Autenticado (módulo semilleros) |
| POST | `/api/semilleros/:id/evidencias` | Administrador |
| DELETE | `/api/semilleros/:id/evidencias/:idEvidencia` | Administrador |
| GET | `/api/public/semilleros` | Público |
| GET | `/api/public/semilleros/:id` | Público |

**Cambio en respuestas existentes:** `POST`/`PATCH` `/api/semilleros` incluyen `escuela` y campos de portada cuando existen; compatible con clientes que ya leían el resto de campos.

---

## Cómo probar

Arranque recomendado (raíz del monorepo):

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api npx prisma db seed   # si la BD está vacía
```

Portal: http://localhost:8080 · API: http://localhost:3000/api

Usuarios del seed (contraseña `Password123!`):

| Usuario | Qué verificar |
|---|---|
| `admin@unilab.edu` | **Semilleros** → crear/editar semillero con portada; en detalle admin, galería: subir hasta 10 imágenes, eliminar una; comprobar que el archivo desaparece del grid. |
| Sin sesión | Inicio: sección **Semilleros** (`/#semilleros`) → abrir detalle público; revisar portada y galería. Entrar a una **escuela** y ver semilleros filtrados. |
| `estudiante1@unilab.edu` | Menú **Semilleros** del portal (`/semilleros`) y flujos de membresía ya existentes (sin cambios de reglas en esta entrega). |

Casos de error esperados:
- Subir más de 10 evidencias en total → 422.
- Archivo que no sea imagen o > 5 MB → 400.
- `DELETE` portada cuando no hay portada → 404.
- `GET /api/public/semilleros/:id` con id inactivo o borrado → 404.
- Google «Continuar con Google» sin origen `http://localhost:8080` en la consola → error de origen no permitido (configuración externa, ver README raíz).

---

## Resultados de pruebas

| Proyecto | Comando | Resultado |
|---|---|---|
| Backend | `npm test` | 110 pruebas OK (nuevas/ ampliadas: portada, evidencias, `publico-semilleros`, schemas) |
| Backend | `npx tsc --noEmit` | Sin errores |
| Frontend | `npm test -- --watch=false` | 47 pruebas OK (p. ej. `SemillerosService`, `portal-semilleros`, specs con `environment`) |
| Frontend | `npm run build` | OK; persisten advertencias de **budget** de bundle y dependencia CommonJS de `qrcode` (previas en QA) |

Pruebas manuales recomendadas en QA: subida multipart de portada y evidencias, paginación pública (`limite`, `pagina`, filtro `id_escuela`) y navegación portal inicio → detalle → escuela.

---

## Commits de la rama (referencia)

Desde la base de integración con escuelas/comentarios:

- `bb8d85c` … `3a49d49` — HU-3.1 (BE portada + FE formulario)
- `0a4f9ea`, `9856421` — HU-3.2
- `02b57cc`, `c460e70` — HU-3.3
- `75e7a0b`, `f7419a0` — HU-3.4

---

## Observaciones para el equipo

1. **Visibilidad pública:** el listado público muestra semilleros con `activo: true` y sin soft-delete; no usa el mismo flujo de «publicación» que los proyectos. Si el negocio exige ocultar semilleros hasta aprobación explícita, habría que añadir regla/campo y alinear backend y portal.
2. **`environment.prod.ts`:** hoy mantiene `apiUrl` apuntando a `localhost:3000` como el entorno de desarrollo; en despliegue real hay que sustituirlo por la URL pública de la API (o un pipeline de build con variables).
3. **Archivos en disco:** portada y evidencias viven bajo `/uploads/semilleros/:id/`; conviene respaldar o montar volumen en producción igual que el resto de uploads.
4. **OAuth:** el client ID del front (`google.config.ts`) debe coincidir con `GOOGLE_CLIENT_ID` en `.env`; los orígenes JS en Google Cloud son responsabilidad del entorno, no del código.
5. **Express 5 y query:** rutas públicas con paginación usan el mismo middleware `validate` que el resto del proyecto; si en QA aparece discrepancia entre query enviada y parseada, revisar el patrón ya documentado en el sprint Dev 1 (`/usuarios/consulta`).
