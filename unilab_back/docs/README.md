# Guía de puesta en marcha — Backend UniLab

Esta guía está pensada para **colaboradores que acaban de clonar el repositorio** y necesitan dejar el backend funcionando en su máquina local, con base de datos creada, migración aplicada y datos de prueba cargados, listos para consumir la API desde el frontend o desde Postman.

---

## 1. Tecnologías necesarias

Instala lo siguiente **antes** de comenzar:

| Tecnología | Versión mínima | Para qué sirve |
|------------|----------------|----------------|
| **Git** | cualquier reciente | Clonar el repositorio |
| **Node.js** | 18 o superior (recomendado 20 LTS) | Ejecutar el servidor |
| **npm** | incluido con Node.js | Instalar dependencias |
| **PostgreSQL** | 14 o superior | Base de datos del proyecto |

### Verificar instalación

```bash
node -v
npm -v
git --version
```

Para PostgreSQL, confirma que el servicio esté en ejecución:

- **Windows:** Servicios → `postgresql-x64-XX` → En ejecución  
- O desde PowerShell: `Get-Service -Name "*postgres*"`

> **Opcional:** [Postman](https://www.postman.com/) para probar endpoints sin frontend.  
> **Opcional:** [pgAdmin](https://www.pgadmin.org/) o DBeaver para administrar la BD visualmente.

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/theAranda88/BackUnilab.git
cd BackUnilab
```

Si tu equipo usa otra URL de remoto, sustitúyela por la correcta.

---

## 3. Instalar dependencias del proyecto

Desde la raíz del proyecto (donde está `package.json`):

```bash
npm install
```

Esto instala Express, Prisma, TypeScript, JWT, Zod y el resto de dependencias definidas en el proyecto.

---

## 4. Configurar variables de entorno

1. Copia el archivo de ejemplo:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

2. Edita `.env` con tus credenciales locales de PostgreSQL:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/unilab?schema=public"
JWT_SECRET="un-secreto-largo-y-unico-para-desarrollo-local"
PORT=3000
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión a PostgreSQL. Cambia `USUARIO`, `CONTRASEÑA` y el puerto si no usas los valores por defecto. |
| `JWT_SECRET` | Secreto para firmar tokens JWT. Debe ser distinto en producción. |
| `PORT` | Puerto del API (por defecto `3000`). |

> **Importante:** El archivo `.env` **no se sube a Git** (está en `.gitignore`). Cada colaborador debe crear el suyo.

---

## 5. Crear la base de datos en PostgreSQL

El backend espera una base de datos llamada **`unilab`**. Prisma **no crea la base de datos**, solo las tablas dentro de ella. Debes crearla tú una vez.

### Opción A — pgAdmin / DBeaver

1. Conéctate al servidor PostgreSQL local.
2. Clic derecho en **Databases** → **Create** → **Database**.
3. Nombre: `unilab` → Guardar.

### Opción B — Línea de comandos (`psql`)

```bash
psql -U postgres -h localhost
```

Dentro de `psql`:

```sql
CREATE DATABASE unilab;
\q
```

### Opción C — PowerShell (si `psql` está en el PATH)

```powershell
psql -U postgres -c "CREATE DATABASE unilab;"
```

Si la base ya existe, verás un error de “already exists”; en ese caso puedes continuar al paso 6.

---

## 6. Aplicar la migración inicial

El esquema de las **22 tablas** ya está versionado en `prisma/migrations/`. Al clonar, solo hay que **aplicar** esas migraciones a tu BD local.

```bash
npx prisma migrate deploy
```

Este comando crea todas las tablas, relaciones, índices parciales y restricciones definidas en el proyecto.

Luego genera el cliente de Prisma (necesario para que el código TypeScript hable con la BD):

```bash
npx prisma generate
```

### Si `migrate deploy` falla por conexión

- Revisa que PostgreSQL esté corriendo.
- Verifica usuario y contraseña en `DATABASE_URL`.
- Confirma que la base `unilab` exista.

---

## 7. Ejecutar el seeder (datos de prueba)

Carga roles, usuarios, escuelas, cursos, un semillero y un evento de prueba:

```bash
npm run prisma:seed
```

Salida esperada (resumen):

```
Roles: 5
Usuarios: 8
Escuelas: 5
Cursos: 13
Semilleros: 1
Eventos: 1
Contraseña de prueba: Password123!
```

> El seed **borra y vuelve a insertar** los datos de prueba. Es seguro ejecutarlo varias veces en desarrollo local.

### Credenciales después del seed

**Contraseña para todos los usuarios:** `Password123!`

| Rol | Email |
|-----|-------|
| Administrador | `admin@unilab.edu` |
| Coordinador | `coordinador@unilab.edu` |
| Profesor | `profesor1@unilab.edu` |
| Profesor | `profesor2@unilab.edu` |
| Estudiante | `estudiante1@unilab.edu` |
| Estudiante | `estudiante2@unilab.edu` |
| Estudiante | `estudiante3@unilab.edu` |
| Externo | `externo@unilab.edu` |

---

## 8. Levantar el servidor backend

```bash
npm run dev
```

Si todo está bien verás:

```
UniLab API escuchando en http://localhost:3000
Swagger UI: http://localhost:3000/api-docs
```

### Comprobar que funciona

| Recurso | URL |
|---------|-----|
| Health check | http://localhost:3000/health |
| Documentación Swagger | http://localhost:3000/api-docs |
| API base | http://localhost:3000/api |

**Prueba rápida de login** (PowerShell):

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@unilab.edu","password":"Password123!"}'
```

Debe devolver un objeto con `token` y datos del `usuario`.

---

## 9. Consumo desde el frontend

Para que otra persona conecte el frontend al backend local:

### URL base del API

```
http://localhost:3000/api
```

Ejemplos de rutas:

- Login: `POST http://localhost:3000/api/auth/login`
- Listar escuelas: `GET http://localhost:3000/api/escuelas`
- Listar proyectos: `GET http://localhost:3000/api/proyectos`

### Autenticación (JWT)

1. El frontend hace `POST /api/auth/login` con `email` y `password`.
2. Guarda el `token` de la respuesta.
3. En las peticiones siguientes envía el header:

```
Authorization: Bearer <token>
```

### CORS

El backend tiene **CORS habilitado** para desarrollo. Si el frontend corre en otro puerto (ej. `http://localhost:5173` o `http://localhost:4200`), las peticiones al API en el puerto `3000` deberían funcionar sin configuración extra.

### Usuario con primer login

Si un usuario se registra o un admin lo crea, el sistema devuelve una **contraseña temporal** y deja `primer_login = true`. Ese usuario solo puede llamar a `POST /api/auth/cambiar-password` hasta fijar su contraseña definitiva. El frontend debe contemplar ese flujo.

### Variables sugeridas en el frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
# o
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

(Ajusta el prefijo según el framework: Vite, Next.js, Angular, etc.)

---

## 10. Probar con Postman (sin frontend)

1. Importa en Postman:
   - `docs/postman_collection.json`
   - `docs/postman_environment.json`
2. Selecciona el entorno **UniLab — Entorno local**.
3. Ejecuta **Iniciar sesión (Administrador)** — el token se guarda solo en la variable `token`.
4. Prueba el resto de solicitudes de la colección.

---

## 11. Resumen de comandos (checklist)

Copia y ejecuta en orden después de clonar:

```bash
npm install
cp .env.example .env          # luego edita DATABASE_URL y JWT_SECRET
# Crear BD "unilab" en PostgreSQL (ver sección 5)
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
npm run dev
```

---

## 12. Scripts npm disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (recarga automática) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run start` | Ejecuta build de producción |
| `npm run prisma:migrate` | Crea/aplica migraciones en modo dev (`migrate dev`) |
| `npm run prisma:generate` | Regenera el cliente Prisma |
| `npm run prisma:seed` | Ejecuta `prisma/seed.ts` |

---

## 13. Solución de problemas frecuentes

### `P1000: Authentication failed`

Usuario o contraseña incorrectos en `DATABASE_URL`. Revisa `.env`.

### `database "unilab" does not exist`

Crea la base de datos manualmente (sección 5).

### `Port 3000 already in use`

Otro proceso usa el puerto. Cambia `PORT=3001` en `.env` o cierra el proceso anterior.

### El seed falla por datos duplicados

Vuelve a ejecutar `npm run prisma:seed` — el script limpia tablas antes de insertar.

### Cambios en `schema.prisma` del equipo

Después de un `git pull` con nuevas migraciones:

```bash
npx prisma migrate deploy
npx prisma generate
```

Solo vuelve a sembrar si te lo indica el equipo o si necesitas resetear datos locales.

---

## 14. Otros documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| `00-esquema-bd-referencia.md` | Modelo de datos (22 tablas) — fuente de verdad |
| `01-prompt-maestro-backend.md` | Plan de construcción del backend |
| `postman_collection.json` | Colección de endpoints en español |
| `postman_environment.json` | Variables `base_url` y `token` |

---

## 15. Contacto y convenciones del equipo

- **Rama principal de trabajo:** acordar con el líder del proyecto (ej. `main` o `develop`).
- **No commitear** `.env` ni credenciales reales.
- Antes de abrir un PR, verifica: `npm run build` sin errores y login funcional con usuario del seed.

Si algo de esta guía no coincide con tu entorno, revisa primero `DATABASE_URL` y que PostgreSQL esté activo; la mayoría de incidencias locales vienen de ahí.
