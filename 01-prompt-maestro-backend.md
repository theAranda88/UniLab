# PROMPT MAESTRO — Construcción de Backend Modular
## Plataforma Universitaria (Proyectos, Semilleros, Eventos)

> Antes de ejecutar cualquier instrucción de este prompt, lee y ten en memoria de contexto el archivo `00-esquema-bd-referencia.md` ubicado en `/docs` del proyecto. Ese archivo es la fuente única de verdad del modelo de datos — todo lo que generes (modelos Prisma, seeders, validaciones, documentación Swagger) debe ser 100% consistente con él.

---

## 1. CONTEXTO DEL PROYECTO

Estamos construyendo el backend de una plataforma web universitaria modular que centraliza:
- Proyectos académicos por escuela/curso (con autores, coordinadores, comentarios estilo foro y calificaciones)
- Semilleros de investigación (con flujo de autorización para publicar)
- Eventos (congresos, foros, seminarios) con control de asistencia por QR y jornadas
- Gestión de usuarios con 5 roles: Administrador, Coordinador, Profesor, Estudiante, Externo

El esquema de base de datos ya está completamente diseñado y validado (22 tablas) — está en `00-esquema-bd-referencia.md`. Tu tarea NO es diseñar la base de datos, es construir el backend que la implementa.

---

## 2. STACK TECNOLÓGICO OBLIGATORIO

- **Runtime:** Node.js
- **Lenguaje:** TypeScript (modo estricto, `strict: true` en tsconfig)
- **Base de datos:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** JWT (estructura de payload definida en la sección 0 del archivo de esquema)
- **Documentación API:** Swagger / OpenAPI 3.0, expuesta en una ruta del propio backend (ej. `/api-docs`)
- **Validación de datos:** usar una librería de schema validation (Zod o Joi — elige Zod por su mejor integración con TypeScript, salvo que el proyecto ya tenga una convención distinta)

---

## 3. ARQUITECTURA MODULAR OBLIGATORIA

El backend debe seguir esta separación de responsabilidades en capas, sin mezclarlas:

```
src/
├── models/            (o prisma/ + un módulo de acceso a datos)
│   └── El ORM (Prisma) interactúa aquí con las entidades/modelos.
│       Esta capa SOLO conoce la base de datos. No contiene lógica de negocio.
│
├── services/
│   └── Contiene TODA la lógica de negocio (reglas, validaciones de flujo,
│       transacciones, cálculos). Es la única capa que llama a models/Prisma.
│       Ejemplo: ProyectoService.crearProyecto() valida que el estudiante
│       tenga autorización vigente ANTES de hacer el insert.
│
├── controllers/
│   └── Reciben el request ya validado (gracias a middlewares), delegan
│       la operación al service correspondiente, y devuelven la respuesta HTTP.
│       NO contienen lógica de negocio ni validaciones de rol — eso ya
│       pasó en el middleware. El controller debe quedar limpio y delgado.
│
├── middlewares/
│   ├── validation/    → valida tipos y forma de los datos entrantes (Zod schemas)
│   ├── auth/          → verifica JWT válido
│   └── roles/         → verifica que el id_rol del usuario autenticado tenga
│                         permiso para la ruta/acción solicitada, según el
│                         "Mapa de capacidades por rol" del archivo de esquema
│
├── routes/
│   └── Define los endpoints de la API y los conecta con:
│       middlewares (validación + auth + rol) → controller → respuesta
│
├── docs/
│   └── Definiciones Swagger/OpenAPI por módulo (o JSDoc anotado en las
│       rutas, según el approach que uses para generar el swagger.json)
│
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

**Regla de oro de la arquitectura:** el flujo de una petición SIEMPRE es:
`route → middleware (validación tipos) → middleware (auth) → middleware (rol) → controller → service → models/Prisma → respuesta`

Ningún controller debe llamar directamente a Prisma. Ningún middleware debe contener lógica de negocio. Ningún service debe construir respuestas HTTP (status codes, res.json) — eso es responsabilidad del controller.

### 3.1 Convención de códigos de respuesta HTTP (aplica a TODOS los controllers)

Sin sobre-ingeniería: nada de librerías de manejo de errores enterprise ni jerarquías de excepciones de 10 niveles. Basta con una clase simple `AppError` (mensaje + statusCode) que los services lanzan, y un middleware de manejo de errores centralizado al final de la cadena de Express que la captura y responde. Códigos a usar consistentemente:

| Código | Cuándo usarlo |
|---|---|
| `200 OK` | GET exitoso, PATCH/PUT exitoso |
| `201 Created` | POST que crea un recurso nuevo (devuelve el recurso creado) |
| `204 No Content` | DELETE exitoso (soft-delete) — no hay body que devolver |
| `400 Bad Request` | Falla de validación de tipos/forma de datos (lo lanza el middleware de Zod) |
| `401 Unauthorized` | Token ausente, inválido o expirado |
| `403 Forbidden` | Token válido pero el rol no tiene permiso (middleware de roles), o `primer_login = true` intentando acceder a una ruta que no sea cambio de contraseña |
| `404 Not Found` | El recurso solicitado no existe o está soft-deleted (`deleted_at IS NOT NULL` se trata como "no existe" para todo propósito de la API) |
| `409 Conflict` | Violación de regla de unicidad de negocio (ej. email duplicado, segunda calificación del mismo usuario al mismo proyecto si no se maneja como upsert, doble inscripción al mismo evento) |
| `422 Unprocessable Entity` | Datos con forma correcta pero que violan una regla de negocio del service (ej. intentar crear un proyecto sin autorización vigente, intentar cambiar `estado_proyecto` con una transición no permitida) |
| `500 Internal Server Error` | Cualquier error no controlado — siempre logueado, nunca expuesto en detalle al cliente |

El controller SIEMPRE delega al service y solo decide el código de éxito (`200`/`201`/`204`); el código de error lo determina el `AppError` lanzado por el service y lo traduce el middleware de errores. Esto mantiene el controller delgado, tal como pide la arquitectura.

---

## 4. INSTRUCCIONES DE EJECUCIÓN — ORDEN PASO A PASO

Ejecuta en este orden, confirmando conmigo al final de cada paso antes de continuar si el paso es estructural (1, 2, 3). Los pasos 4 en adelante puedes ejecutarlos de corrido.

### Paso 1 — Inicialización del proyecto
- Inicializa proyecto Node.js + TypeScript con la estructura de carpetas de la sección 3
- Configura `tsconfig.json` en modo estricto
- Instala dependencias: `express` (o el framework HTTP que prefieras, recomiendo Express por simplicidad), `prisma`, `@prisma/client`, `zod`, `jsonwebtoken`, `bcrypt`, `swagger-ui-express`, `swagger-jsdoc` (o `@asteasolutions/zod-to-openapi` si prefieres generar el swagger desde los schemas de Zod), `dotenv`, `cors`
- Configura `.env` con `DATABASE_URL` para PostgreSQL y `JWT_SECRET`

### Paso 2 — Schema de Prisma (DDL)
- Genera `prisma/schema.prisma` con las 22 tablas descritas en `00-esquema-bd-referencia.md`, respetando EXACTAMENTE:
  - Todos los campos, tipos y nullability indicados
  - Las 4 columnas de auditoría (`created_at`, `updated_at`, `created_by`, `deleted_at`) en cada modelo
  - Los índices únicos parciales donde se indican (en Prisma esto se hace con `@@unique` combinado con manejo a nivel de aplicación, o con SQL nativo en una migración si Prisma no soporta índices parciales condicionales directamente — investiga la sintaxis más reciente de Prisma para `@@index` parcial o usa una migración SQL manual si es necesario)
  - Las relaciones N:M con sus tablas puente explícitas
  - El `CHECK` de `puntuacion BETWEEN 1 AND 5` en `calificaciones` (vía migración SQL si Prisma no soporta CHECK constraints nativos en tu versión)
  - Self-relation en `comentarios.id_comentario_padre`
- Corre `npx prisma migrate dev --name init` para generar la migración inicial
- **Detente aquí y muéstrame el schema.prisma generado antes de continuar**

### Paso 3 — Seeder de datos de prueba
- Crea `prisma/seed.ts` que inserte:
  - Los 5 roles (`Administrador`, `Coordinador`, `Profesor`, `Estudiante`, `Externo`)
  - 1 usuario Administrador (con password hasheado vía bcrypt, `primer_login = false` para que pueda operar de inmediato)
  - 1 usuario Coordinador (`primer_login = false`)
  - 2 usuarios Profesor con sus `perfiles_profesor` (`primer_login = false`)
  - 3 usuarios Estudiante con sus `perfiles_estudiante` (`primer_login = false`, son datos de prueba ya "activados")
  - 1 usuario Externo con su `perfiles_externo` (`primer_login = false`)
  - **Las 5 escuelas y sus 13 cursos EXACTOS** definidos en la sección "DATOS FIJOS A SEMBRAR" de `00-esquema-bd-referencia.md` — NO uses placeholders genéricos tipo "Curso de prueba 1":
    - Escuela de Derecho → Gobierno y Relaciones Internacionales, Derecho
    - Escuela de Educación → Entrenamiento Deportivo, Licenciatura en Educación Infantil
    - Escuela de Ingeniería y Sostenibilidad → Ingeniería Civil, Ingeniería Energética
    - Escuela de Negocios → Finanzas y Negocios Internacionales, Administración de Empresas, Contabilidad Pública
    - Escuela de Software y Desarrollo Tecnológico → Matemáticas Aplicadas y Ciencias de Datos, Ingeniería Ambiental y de Saneamiento, Ingeniería Electrónica, Ingeniería de Software y Computación
  - 1 semillero de prueba con un profesor líder asignado
  - 1 evento de prueba con 2 jornadas
  - Usa contraseñas de prueba simples pero documentadas (ej. `Password123!` para todos, hasheadas) y déjalas anotadas en un comentario al inicio del seed para que yo las use en pruebas. Estos usuarios sembrados llevan `primer_login = false` porque son cuentas de prueba ya "activas" — el flujo de `primer_login = true` solo aplica a usuarios que pasan por `POST /auth/register` o por reseteo de contraseña, no a los datos del seeder.
- Configura el script `"prisma": {"seed": "ts-node prisma/seed.ts"}` en `package.json`
- Corre `npx prisma db seed`

### Paso 4 — Capa de modelos (acceso a datos)
- Si decides exponer una capa explícita sobre Prisma (recomendado para desacoplar el ORM de los services), créala en `src/models/` como repositorios delgados por entidad (ej. `usuario.repository.ts`)
- Si prefieres que los services llamen a Prisma directamente (también válido y más simple para un proyecto de este tamaño), documenta esa decisión en un comentario en `src/services/README.md`

### Paso 5 — Middleware de autenticación y autorización por rol
- `middlewares/auth/verifyToken.ts` → valida el JWT, adjunta `req.user = { id_usuario, id_rol, email }`
- `middlewares/roles/requireRole.ts` → middleware factory: `requireRole(['Administrador', 'Coordinador'])` que rechaza con 403 si el rol del usuario autenticado no está en la lista permitida
- Implementa los middlewares de roles necesarios según el "Mapa de capacidades por rol" del archivo de esquema — especialmente crítico en:
  - `POST /proyectos` → solo Estudiante, Y además el service debe validar autorización vigente
  - `POST /eventos` → solo Administrador
  - `POST /semilleros` → solo Administrador
  - Gestión de usuarios → solo Administrador

### Paso 6 — Middleware de validación de tipos
- Por cada endpoint que reciba body/params/query, crea un schema Zod correspondiente en `middlewares/validation/schemas/`
- Crea un middleware genérico `validate(schema)` reutilizable que parsee `req.body` (o params/query según corresponda) contra el schema, y devuelva 400 con detalle de errores si falla

### Paso 7 — Módulo por módulo: Usuarios/Auth
Implementa el ciclo completo (model/repo → service → controller → route → swagger doc) para:
- `POST /auth/register` (autorregistro de Estudiante/Externo) → genera contraseña aleatoria, hashea, `primer_login = true`, **devuelve la contraseña en texto plano en la respuesta** (única vez, no hay servicio de correo)
- `POST /auth/login` → valida credenciales, emite JWT independientemente del valor de `primer_login` (el bloqueo de rutas ocurre después, vía middleware)
- `POST /auth/cambiar-password` → servicio único reutilizado para dos casos, según traiga o no un usuario autenticado con `primer_login = true`:
  - Caso A (primer login): usuario autenticado con `primer_login = true` envía nueva contraseña → `password_hash` actualizado, `primer_login = false`
  - Caso B (olvidó contraseña): usuario no autenticado solicita reset (por email) → sistema genera nueva contraseña aleatoria, `primer_login = true` de nuevo, **devuelve la contraseña temporal en la respuesta** (mismo patrón sin correo)
- Middleware global `checkPrimerLogin` aplicado después de `verifyToken`: si `req.user.primer_login === true` y la ruta no es `/auth/cambiar-password`, responde `403` inmediatamente, sin importar el rol
- `GET /usuarios` (solo Admin, con filtros por rol)
- `GET /usuarios/:id`
- `POST /usuarios` (solo Admin — creación directa de un usuario de **cualquier rol**, incluyendo Administrador/Coordinador/Profesor, sin pasar por autorregistro; sigue el mismo patrón de contraseña aleatoria + `primer_login = true` + devolución en la respuesta, para que el Admin se la entregue a la persona)
- `PATCH /usuarios/:id` (Admin edita cualquier usuario)
- `PATCH /usuarios/:id/suspender` (Admin, togglea `activo`)
- `DELETE /usuarios/:id` (Admin, soft-delete)

> Esto cubre la gestión completa de usuarios por parte del Administrador: puede crear usuarios de cualquier rol directamente (`POST /usuarios`), además de que estudiantes/externos pueden autorregistrarse (`POST /auth/register`). Ambos caminos terminan en la misma cuenta gestionable desde `GET/PATCH/DELETE /usuarios`.

### Paso 8 — Módulo: Escuelas y Cursos
CRUD completo de `escuelas` y `cursos` (solo Admin puede crear/editar/eliminar; lectura abierta a todos los roles autenticados). Siembra las 5 escuelas y 13 cursos exactos del Paso 3 — este paso construye el CRUD genérico, el seeder ya puso los datos reales.

> La gestión completa de usuarios (creación por Admin de cualquier rol, edición, suspensión, eliminación) ya quedó implementada en el Paso 7 — no se repite aquí.

### Paso 9 — Módulo: Proyectos
Implementa respetando ESTRICTAMENTE el flujo 7.1 del archivo de esquema:
- `POST /cursos/:id/autorizaciones` (Profesor del curso autoriza a un estudiante)
- `PATCH /semilleros/:id/miembros/:idEstudiante/autorizar-publicacion` (Profesor líder autoriza)
- `POST /proyectos` (SOLO Estudiante, valida autorización vigente en el service antes del insert)
- `GET /proyectos`, `GET /proyectos/:id`, `PATCH /proyectos/:id`, `DELETE /proyectos/:id` (gestión solo para quien está en `proyecto_coordinadores` o es Admin/Coordinador)
- `PATCH /proyectos/:id/estado` (transición de estado_proyecto, validando transiciones permitidas: borrador→en_revision→aprobado→publicado, o →rechazado)
- `POST /proyectos/:id/comentarios` (cualquier rol autenticado, soporta `id_comentario_padre`)
- `PUT /proyectos/:id/calificacion` (upsert — un usuario solo puede tener una calificación por proyecto)
- `GET /proyectos/:id` debe registrar una vista en `proyecto_vistas` e incrementar `contador_vistas` en cada llamada (sin deduplicación)

### Paso 10 — Módulo: Semilleros
CRUD de `semilleros` (crear: solo Admin), gestión de `semillero_profesores` (asignación: solo Admin), gestión de `semillero_miembros` (solicitud: Estudiante; aprobación: Profesor líder)

### Paso 11 — Módulo: Eventos
- `POST /eventos` (solo Admin, define `requiere_pago`)
- `POST /eventos/:id/jornadas` (solo Admin, genera `codigo_qr` único por jornada — usa una librería tipo `uuid` o `qrcode` para generar el token/imagen)
- `POST /eventos/:id/inscripciones` (cualquier rol autenticado, captura `genero` y demás datos del formulario)
- `PATCH /inscripciones/:id/pago` (solo Admin, actualiza `estado_pago`)
- `POST /jornadas/:id/asistencia` (escaneo de QR → valida que exista inscripción activa al evento → INSERT en `asistencias`)
- `GET /eventos/:id/reportes` (Admin/Coordinador: asistentes por jornada, pagos pendientes, exentos)

### Paso 12 — Documentación Swagger
- Configura `swagger-ui-express` en la ruta `/api-docs`
- Cada endpoint debe estar documentado con: método, parámetros, request body schema, response schemas (incluyendo códigos de error 400/401/403/404), y a qué rol(es) requiere
- Incluye en la documentación los datos de los usuarios sembrados por el seeder (email/password de prueba) en una sección de "Cómo probar" dentro de la descripción general de Swagger (`info.description`)

### Paso 13 — Colección de Postman
- Genera una colección de Postman (`postman_collection.json`) organizada por carpetas según los módulos (Auth, Usuarios, Escuelas/Cursos, Proyectos, Semilleros, Eventos)
- Incluye un environment de Postman (`postman_environment.json`) con variables: `base_url`, `token` (para que se pueda capturar automáticamente el JWT tras el login con un script de test de Postman que lo guarde en la variable de entorno)
- Cada request debe tener ejemplos de body válidos basados en los datos del seeder

### Paso 14 — Validación final
- Levanta el servidor y verifica que `/api-docs` cargue correctamente
- Corre un smoke test manual: login con el usuario Admin sembrado → crear una escuela → crear un curso → confirma que las respuestas y los códigos HTTP sean coherentes
- Muéstrame un resumen de todos los endpoints implementados con su método, ruta, y rol(es) requerido(s)

---

## 5. REGLAS NO NEGOCIABLES (repetidas aquí para máxima visibilidad — ya están en el esquema, pero son las que más se rompen si no se enfatizan)

1. El Profesor **JAMÁS** puede crear un proyecto (`POST /proyectos`). Solo el Estudiante, y solo con autorización vigente.
2. Todo `DELETE` es soft-delete (`UPDATE deleted_at = NOW()`). Nunca un `DELETE FROM` físico desde la aplicación.
3. Las FK en PostgreSQL deben usar `ON DELETE RESTRICT`.
4. Solo Administrador crea: semilleros, eventos, escuelas, cursos.
5. El organizador de un evento (`id_organizador`) siempre es Administrador.
6. `calificaciones` es upsert (1 por usuario/proyecto). `comentarios` es insert ilimitado (foro).
7. `proyecto_vistas` no tiene restricción de duplicados — cada GET cuenta.
8. El JWT no lleva `id_escuela` ni `id_semillero` en el payload.
9. La entidad se llama `escuelas`, NUNCA `facultades` — en nombres de tabla, variables, rutas (`/escuelas`) y documentación. Son exactamente 5, con sus 13 cursos fijos definidos en el seeder (Paso 3) — no inventes nombres distintos de escuelas o cursos.
10. Toda contraseña generada por el sistema (autorregistro, creación por Admin, o reset por "olvidé mi contraseña") es aleatoria y se devuelve en texto plano UNA SOLA VEZ en la respuesta del endpoint — nunca se envía por correo, porque no hay servicio de correo en este proyecto. El usuario queda con `primer_login = true` hasta que la cambie.
11. Mientras `primer_login = true`, el usuario NO puede acceder a ninguna ruta de la API excepto `POST /auth/cambiar-password`, sin importar su rol — esto se aplica con un middleware global, no caso por caso en cada controller.
12. El Administrador puede crear usuarios de cualquier rol directamente vía `POST /usuarios`, además del autorregistro abierto para Estudiante/Externo vía `POST /auth/register`.

---

## 6. ENTREGABLES ESPERADOS AL FINAL

- [ ] Proyecto Node.js + TypeScript corriendo localmente con `npm run dev`
- [ ] `schema.prisma` con las 22 tablas + migración aplicada
- [ ] Seeder ejecutado con usuarios de prueba de los 5 roles
- [ ] Todos los módulos (Auth, Usuarios, Escuelas/Cursos, Proyectos, Semilleros, Eventos) con su ciclo completo de capas
- [ ] Swagger UI funcional en `/api-docs`
- [ ] Colección + environment de Postman exportados en la raíz del proyecto o en `/docs`
- [ ] README.md con instrucciones de instalación, variables de entorno necesarias, y cómo correr el seeder

---

## 7. CÓMO QUIERO QUE TRABAJES

- Si encuentras una ambigüedad entre este prompt y el archivo de esquema, el archivo de esquema gana.
- Si encuentras una ambigüedad que NINGUNO de los dos documentos resuelve, pregúntame antes de asumir — no inventes reglas de negocio nuevas.
- Prioriza código simple y legible sobre abstracciones prematuras. Este es un proyecto universitario, no necesita patrones enterprise innecesarios (no uses CQRS, no uses Domain Events, no uses arquitectura hexagonal completa — la separación models/services/controllers/middlewares/routes ya es suficiente robustez para este alcance).
- Comenta el código en español, consistente con el dominio del negocio (nombres de tablas, campos y reglas ya están en español).