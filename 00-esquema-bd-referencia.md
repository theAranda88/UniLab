# Esquema de Base de Datos — Plataforma Universitaria
## Documento de referencia técnica para Cursor AI — NO modificar sin actualizar este archivo

> Este archivo es la **fuente única de verdad** del modelo de datos. Cualquier modelo Prisma, migración, seeder o validación de tipo debe ser consistente con lo aquí descrito. Si en algún punto el código generado contradice este documento, el documento tiene prioridad.

---

## 0. STACK Y CONVENCIONES GLOBALES

- **Motor de BD:** PostgreSQL
- **ORM:** Prisma
- **Backend:** Node.js + TypeScript
- **PK:** `serial` (integer autoincremental) en todas las tablas, excepto `proyecto_vistas` que usa `bigserial`
- **Toda tabla incluye estas 4 columnas de auditoría/soft-delete** (no se repiten en cada tabla abajo):

| Campo | Tipo | Notas |
|---|---|---|
| created_at | timestamp | default now() |
| updated_at | timestamp | actualizado vía trigger/middleware de Prisma en cada UPDATE |
| created_by | integer, FK -> usuarios | nullable |
| deleted_at | timestamp | NULL = activo; con valor = eliminado lógicamente |

### Política de borrado (CRÍTICA — aplica a toda la BD)
- **A nivel de BD:** todas las FK usan `ON DELETE RESTRICT`. Nunca hay borrado físico en cascada a nivel de PostgreSQL.
- **A nivel de aplicación:** "eliminar" = `UPDATE ... SET deleted_at = NOW()`. La cascada lógica (ej. eliminar escuela → soft-delete de sus cursos y proyectos) la gestiona el `service` correspondiente, nunca la BD.
- Para que `UNIQUE` siga funcionando con soft-delete, usar **índices únicos parciales**: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`.
- Quién puede eliminar: solo Administrador a nivel de sistema. El Profesor líder de semillero solo puede eliminar (soft-delete) la fila de membresía de un estudiante en SU semillero, nunca el usuario.

### Roles del sistema (tabla `roles`, 5 valores fijos)
`Administrador`, `Coordinador`, `Profesor`, `Estudiante`, `Externo`

### JWT — estructura del payload (referencia para el módulo de auth)
```json
{
  "id_usuario": 123,
  "id_rol": "Profesor",
  "email": "usuario@universidad.edu",
  "exp": 1234567890
}
```
Deliberadamente sin `id_escuela` ni `id_semillero` — esos datos se consultan en BD cuando se necesiten, para evitar tokens con info desactualizada.

### Flujo de autenticación y contraseña — UN SOLO SERVICIO REUTILIZADO

No hay servicio de envío de correos. Por eso el diseño reutiliza el mismo mecanismo de "cambio de contraseña" para dos disparadores distintos:

1. **Autorregistro** (Estudiante/Externo): el sistema genera una contraseña aleatoria, la hashea y la guarda, deja `primer_login = true`, y **devuelve la contraseña en texto plano en la respuesta del endpoint** (única vez que esto ocurre — el frontend se la muestra al usuario para que la anote).
2. **Login con `primer_login = true`:** el usuario inicia sesión con la contraseña temporal. El JWT se emite igual, pero un middleware global revisa `primer_login` en cada request: si es `true`, **bloquea el acceso a cualquier ruta que no sea el endpoint de cambio de contraseña**, sin importar el rol.
3. **`POST /auth/cambiar-password`** — servicio único reutilizado para dos casos:
   - **Caso A (primer login):** usuario autenticado con `primer_login = true` envía su nueva contraseña → se actualiza `password_hash`, `primer_login = false`.
   - **Caso B (olvidó su contraseña):** usuario solicita reset → el sistema genera una nueva contraseña aleatoria, la hashea, pone `primer_login = true` de nuevo, y la devuelve en la respuesta del endpoint (mismo patrón que el registro, sin correo). El usuario hace login con esa temporal y cae en el Caso A para fijar la definitiva.
4. Una vez `primer_login = false`, el usuario navega libremente según los permisos de su rol.

> Este enfoque evita construir infraestructura de envío de correos sin sacrificar seguridad: nunca hay contraseñas "fijas" generadas por el sistema que el usuario use a largo plazo sin haberla cambiado él mismo.


---

## 1. MÓDULO A — USUARIOS Y ROLES

### `roles`
| Campo | Tipo | Notas |
|---|---|---|
| id_rol | PK serial | |
| nombre_rol | varchar | Administrador, Coordinador, Profesor, Estudiante, Externo |
| descripcion | text | |

### `usuarios`
| Campo | Tipo | Notas |
|---|---|---|
| id_usuario | PK serial | |
| id_rol | FK -> roles | |
| nombres | varchar | |
| apellidos | varchar | |
| email | varchar | índice único parcial (WHERE deleted_at IS NULL) |
| password_hash | varchar | |
| documento_identidad | varchar | |
| telefono | varchar | |
| activo | boolean | default true — para suspender sin eliminar |
| **primer_login** | **boolean** | **default true — si es true, el usuario SOLO puede acceder al endpoint de cambio de contraseña, nada más** |

### `perfiles_coordinador` (1:1 con usuarios)
| Campo | Tipo | Notas |
|---|---|---|
| id_usuario | PK/FK -> usuarios | |
| cargo | varchar | |
| dependencia | varchar | |

### `perfiles_profesor` (1:1 con usuarios)
| Campo | Tipo | Notas |
|---|---|---|
| id_usuario | PK/FK -> usuarios | |
| codigo_docente | varchar | NOT NULL |
| id_escuela | FK -> escuelas | |

### `perfiles_estudiante` (1:1 con usuarios)
| Campo | Tipo | Notas |
|---|---|---|
| id_usuario | PK/FK -> usuarios | |
| codigo_estudiantil | varchar | NOT NULL |
| id_escuela | FK -> escuelas | |

### `perfiles_externo` (1:1 con usuarios)
| Campo | Tipo | Notas |
|---|---|---|
| id_usuario | PK/FK -> usuarios | |
| institucion | varchar | |
| ocupacion | varchar | |

> Administrador NO tiene tabla de perfil extendido — sus datos viven solo en `usuarios`.

---

## 2. MÓDULO B — PROYECTOS

### `escuelas`
| Campo | Tipo | Notas |
|---|---|---|
| id_escuela | PK serial | |
| nombre_escuela | varchar | |

> **DATOS FIJOS A SEMBRAR (seed) — 5 escuelas con sus cursos:**
>
> | Escuela | Cursos |
> |---|---|
> | Escuela de Derecho | Gobierno y Relaciones Internacionales; Derecho |
> | Escuela de Educación | Entrenamiento Deportivo; Licenciatura en Educación Infantil |
> | Escuela de Ingeniería y Sostenibilidad | Ingeniería Civil; Ingeniería Energética |
> | Escuela de Negocios | Finanzas y Negocios Internacionales; Administración de Empresas; Contabilidad Pública |
> | Escuela de Software y Desarrollo Tecnológico | Matemáticas Aplicadas y Ciencias de Datos; Ingeniería Ambiental y de Saneamiento; Ingeniería Electrónica; Ingeniería de Software y Computación |
>
> Total: 5 escuelas, 13 cursos. El seeder debe crear exactamente estos registros (con `periodo_academico` de prueba, ej. "2026-1") — no datos genéricos de placeholder.


### `cursos`
| Campo | Tipo | Notas |
|---|---|---|
| id_curso | PK serial | |
| id_escuela | FK -> escuelas | |
| nombre_curso | varchar | |
| periodo_academico | varchar | ej. "2026-1" |

### `curso_autorizaciones`
| Campo | Tipo | Notas |
|---|---|---|
| id_autorizacion | PK serial | |
| id_curso | FK -> cursos | |
| id_estudiante | FK -> usuarios | |
| id_profesor_autorizador | FK -> usuarios | |
| autorizado | boolean | default true |
| fecha_autorizacion | timestamp | |
| | | índice único parcial: (id_curso, id_estudiante) WHERE deleted_at IS NULL |

### `proyectos`
| Campo | Tipo | Notas |
|---|---|---|
| id_proyecto | PK serial | |
| id_curso | FK -> cursos | obligatorio (NOT NULL) |
| id_semillero | FK -> semilleros | nullable |
| id_estudiante_creador | FK -> usuarios | obligatorio — quien crea SIEMPRE es estudiante |
| titulo | varchar | |
| descripcion | text | |
| tipo_proyecto | varchar | `web`, `movil`, `podcast`, `otro` |
| url_aplicativo | varchar | |
| url_apk | varchar | nullable |
| url_youtube | varchar | nullable |
| url_spotify | varchar | nullable |
| contador_vistas | integer | default 0, denormalizado |
| estado_proyecto | varchar | `borrador`, `en_revision`, `aprobado`, `publicado`, `rechazado` |
| id_aprobador | FK -> usuarios | nullable |
| fecha_publicacion | timestamp | nullable |

> **REGLA CRÍTICA DE NEGOCIO:** El endpoint `POST /proyectos` SOLO puede ser invocado por un usuario con rol Estudiante, y solo si tiene autorización vigente: fila en `curso_autorizaciones` con `autorizado = true` para ese curso, O `puede_publicar = true` en `semillero_miembros` si trae `id_semillero`. El rol Profesor NUNCA puede invocar este endpoint — el middleware de roles debe bloquearlo explícitamente.

### `proyecto_coordinadores` (N:M — permisos de gestión, no de creación)
| Campo | Tipo | Notas |
|---|---|---|
| id_proyecto | FK -> proyectos | PK compuesta |
| id_profesor | FK -> usuarios | PK compuesta |

> Estar en esta tabla da al profesor permiso de leer/editar/eliminar (soft-delete) el proyecto. Al crearse un proyecto, el backend debe insertar automáticamente aquí al profesor que dio la autorización.

### `proyecto_autores` (N:M)
| Campo | Tipo | Notas |
|---|---|---|
| id_proyecto | FK -> proyectos | PK compuesta |
| id_estudiante | FK -> usuarios | PK compuesta |
| rol_autor | varchar | nullable: `principal`, `colaborador` |

### `calificaciones` (1 por usuario/proyecto)
| Campo | Tipo | Notas |
|---|---|---|
| id_calificacion | PK serial | |
| id_proyecto | FK -> proyectos | |
| id_usuario | FK -> usuarios | |
| puntuacion | smallint | CHECK BETWEEN 1 AND 5 |
| | | índice único parcial: (id_proyecto, id_usuario) WHERE deleted_at IS NULL |

### `comentarios` (hilo de foro, N ilimitados)
| Campo | Tipo | Notas |
|---|---|---|
| id_comentario | PK serial | |
| id_proyecto | FK -> proyectos | |
| id_usuario | FK -> usuarios | |
| id_comentario_padre | FK -> comentarios | nullable, self-relation para respuestas anidadas |
| contenido | text | |
| fecha_comentario | timestamp | |

### `proyecto_vistas` (bitácora simple, SIN deduplicación)
| Campo | Tipo | Notas |
|---|---|---|
| id_vista | PK bigserial | |
| id_proyecto | FK -> proyectos | |
| id_usuario | FK -> usuarios | nullable (visitante anónimo) |
| fecha_hora_visita | timestamp | default now() |

> Cada acceso = 1 fila nueva. Sin restricción UNIQUE. Al insertar, incrementar `proyectos.contador_vistas` en la misma transacción.

---

## 3. MÓDULO C — SEMILLEROS

### `semilleros`
| Campo | Tipo | Notas |
|---|---|---|
| id_semillero | PK serial | |
| nombre_semillero | varchar | |
| descripcion | text | |
| id_escuela | FK -> escuelas | |
| id_profesor_lider | FK -> usuarios | |
| activo | boolean | default true |

> Solo Administrador puede crear semilleros (regla de backend, `created_by` siempre será un usuario Admin).

### `semillero_profesores` (N:M)
| Campo | Tipo | Notas |
|---|---|---|
| id_semillero | FK -> semilleros | PK compuesta |
| id_profesor | FK -> usuarios | PK compuesta |
| es_lider | boolean | default false, denormalizado de `semilleros.id_profesor_lider` |
| fecha_asignacion | date | |

### `semillero_miembros`
| Campo | Tipo | Notas |
|---|---|---|
| id_membresia | PK serial | |
| id_semillero | FK -> semilleros | |
| id_estudiante | FK -> usuarios | |
| estado_solicitud | varchar | `pendiente`, `aprobado`, `rechazado` |
| fecha_resolucion | timestamp | nullable |
| puede_publicar | boolean | default false |
| fecha_autorizacion | timestamp | nullable |
| id_profesor_autorizador | FK -> usuarios | nullable |
| | | índice único parcial: (id_semillero, id_estudiante) WHERE deleted_at IS NULL |

---

## 4. MÓDULO D — EVENTOS

### `eventos`
| Campo | Tipo | Notas |
|---|---|---|
| id_evento | PK serial | |
| nombre_evento | varchar | |
| tipo_evento | varchar | libre, sin enum |
| descripcion | text | |
| fecha_inicio | date | |
| fecha_fin | date | |
| lugar | varchar | |
| id_organizador | FK -> usuarios | SIEMPRE un Administrador (validar en backend) |
| estado | varchar | `planeado`, `activo`, `finalizado` |
| requiere_pago | boolean | default false |

### `evento_jornadas`
| Campo | Tipo | Notas |
|---|---|---|
| id_jornada | PK serial | |
| id_evento | FK -> eventos | |
| nombre_jornada | varchar | ej. "Día 1 - Jornada Mañana" |
| fecha | date | |
| hora_inicio | time | |
| hora_fin | time | |
| codigo_qr | varchar | token único por jornada |

### `inscripciones`
| Campo | Tipo | Notas |
|---|---|---|
| id_inscripcion | PK serial | |
| id_evento | FK -> eventos | |
| id_usuario | FK -> usuarios | |
| tipo_asistente | varchar | `externo`, `estudiante`, `profesor` |
| nombre_completo | varchar | |
| documento_identidad | varchar | |
| email | varchar | |
| telefono | varchar | |
| institucion | varchar | nullable |
| genero | varchar | |
| estado_pago | varchar | nullable. `pendiente`, `confirmado`, `exento`. NULL si evento no requiere pago |
| | | índice único parcial: (id_evento, id_usuario) WHERE deleted_at IS NULL |

> Si `eventos.requiere_pago = true` → al crear inscripción, `estado_pago` default `'pendiente'`. Si `false` → `estado_pago = NULL`.

### `asistencias`
| Campo | Tipo | Notas |
|---|---|---|
| id_asistencia | PK serial | |
| id_inscripcion | FK -> inscripciones | |
| id_jornada | FK -> evento_jornadas | |
| fecha_hora_registro | timestamp | |
| | | índice único parcial: (id_inscripcion, id_jornada) WHERE deleted_at IS NULL |

---

## 5. INVENTARIO COMPLETO (22 TABLAS)

| # | Tabla | Módulo |
|---|---|---|
| 1 | roles | Usuarios |
| 2 | usuarios | Usuarios |
| 3 | perfiles_coordinador | Usuarios |
| 4 | perfiles_profesor | Usuarios |
| 5 | perfiles_estudiante | Usuarios |
| 6 | perfiles_externo | Usuarios |
| 7 | escuelas | Proyectos |
| 8 | cursos | Proyectos |
| 9 | curso_autorizaciones | Proyectos |
| 10 | proyectos | Proyectos |
| 11 | proyecto_coordinadores | Proyectos |
| 12 | proyecto_autores | Proyectos |
| 13 | calificaciones | Proyectos |
| 14 | comentarios | Proyectos |
| 15 | proyecto_vistas | Proyectos |
| 16 | semilleros | Semilleros |
| 17 | semillero_profesores | Semilleros |
| 18 | semillero_miembros | Semilleros |
| 19 | eventos | Eventos |
| 20 | evento_jornadas | Eventos |
| 21 | inscripciones | Eventos |
| 22 | asistencias | Eventos |

---

## 6. MAPA DE CAPACIDADES POR ROL (referencia para middlewares de autorización)

| Capacidad | Admin | Coordinador | Profesor | Estudiante | Externo |
|---|:---:|:---:|:---:|:---:|:---:|
| Acceso total al sistema | ✅ | — | — | — | — |
| Dashboard analítico global | ✅ | ✅ | — | — | — |
| Exportar reportes | ✅ | ✅ | — | — | — |
| Crear semilleros | ✅ | — | — | — | — |
| Ver semilleros asignados | ✅ | ✅ | ✅ | — | — |
| Gestionar estudiantes de su semillero | — | — | ✅ | — | — |
| Autorizar estudiante para subir proyecto | — | — | ✅ | — | — |
| Crear (INSERT) el registro de proyecto | — | — | — | ✅ | — |
| Gestionar proyecto: ver/editar/eliminar | ✅ | ✅ | ✅ (si está en proyecto_coordinadores) | ✅ (el propio, mientras no publicado) | — |
| Ver proyectos publicados + recursos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comentar / calificar proyectos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear y gestionar eventos | ✅ | — | — | — | — |
| Inscribirse a eventos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestión completa de usuarios (CRUD) | ✅ | — | — | — | — |

---

## 7. FLUJOS DE NEGOCIO CRÍTICOS A RESPETAR EN LOS SERVICES

### 7.1 Publicación de proyecto (el profesor NUNCA crea, solo autoriza)
```
RUTA A (curso): Profesor valida presencial → crea fila en curso_autorizaciones
  → Estudiante ve habilitado "Subir proyecto" → Estudiante hace POST /proyectos (borrador)
  → Estudiante completa datos → POST estado_proyecto = 'en_revision'
  → Profesor (ya en proyecto_coordinadores) aprueba → 'aprobado' → 'publicado'

RUTA B (semillero): Profesor LÍDER valida presencial → activa
  semillero_miembros.puede_publicar = true
  → mismo flujo desde el paso de creación del estudiante
```

### 7.2 Eventos con QR por jornada
```
Admin crea evento (define requiere_pago)
  → Admin crea N jornadas (cada una con su codigo_qr único)
  → Usuario se inscribe (1 inscripción = acceso a TODAS las jornadas)
  → Si requiere_pago: estado_pago arranca en 'pendiente', Admin lo confirma manualmente después
  → En cada jornada: se escanea el QR → INSERT en asistencias (no control de acceso, solo bitácora de presencia)
```

### 7.3 Conteo de vistas y comentarios estilo foro
```
Cada GET a un proyecto individual → INSERT en proyecto_vistas + incrementar contador_vistas
  (sin deduplicación, cada entrada cuenta)

Comentarios: POST ilimitado por usuario, con id_comentario_padre opcional para hilos anidados
Calificaciones: solo 1 por usuario/proyecto, UPDATE si ya existe (upsert)
```