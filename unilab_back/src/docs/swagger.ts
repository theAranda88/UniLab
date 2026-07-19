import swaggerJsdoc from 'swagger-jsdoc';
import { schemas } from './swagger/components';
import { paths } from './swagger/paths';

const description = `
Backend de la plataforma universitaria UniLab (proyectos, semilleros y eventos).

## Cómo probar

Usuarios sembrados (contraseña para todos: **Password123!**):

| Rol | Email |
|-----|-------|
| Administrador | admin@unilab.edu |
| Coordinador | coordinador@unilab.edu |
| Profesor | profesor1@unilab.edu / profesor2@unilab.edu |
| Estudiante | estudiante1@unilab.edu / estudiante2@unilab.edu / estudiante3@unilab.edu |
| Externo | externo@unilab.edu |

### Pasos
1. \`POST /auth/login\` con email y password
2. Copiar el \`token\` de la respuesta
3. Clic en **Authorize** (arriba) → pegar: \`Bearer <token>\`
4. Probar los endpoints protegidos

### Entornos de ejecución

| Entorno | API | Swagger UI | Cómo levantar |
|---------|-----|------------|---------------|
| **Local (npm)** | \`http://localhost:3000/api\` | \`http://localhost:3000/api-docs\` | \`npm run dev\` en \`unilab_back/\` |
| **Docker Compose** | \`http://localhost:3000/api\` | \`http://localhost:3000/api-docs\` | \`docker compose up\` en la raíz del monorepo |
| **Producción** | \`API_PUBLIC_URL/api\` | \`{API_PUBLIC_URL}/api-docs\` | Backend desplegado (Railway, Render, VPS, etc.) |

En Docker, el front se sirve en \`http://localhost:8080\` (variable \`FRONT_PORT\`). Postman solo consume la API; usa el selector de **servers** arriba para cambiar de entorno.

**Seed en Docker:** \`docker compose exec api npx prisma db seed\`

### Portal público (sin JWT)
- \`GET /public/escuelas\` — escuelas con \`total_proyectos_publicados\`
- \`GET /public/cursos?id_escuela=\` — cursos por escuela
- \`GET /public/proyectos?id_escuela=\` — proyectos publicados (incluye \`imagenes[]\`)
- \`GET /public/proyectos/{id}\` — detalle + registro de vista

### IDs de referencia (seed)
- Escuela Software: \`id_escuela=5\`
- Curso Software: \`id_curso=13\`
- Semillero: \`id_semillero=1\`
- Profesor líder: \`id_usuario=3\`
- Estudiante: \`id_usuario=5\`
- Evento: \`id_evento=1\`
`;

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UniLab API',
      version: '1.0.0',
      description,
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local (npm run dev) o Docker Compose — puerto API_PORT por defecto 3000',
      },
      {
        url: 'https://TU_API_EN_PRODUCCION/api',
        description: 'Producción — reemplazar por API_PUBLIC_URL del despliegue',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Autenticación y contraseñas' },
      { name: 'Usuarios', description: 'Gestión de usuarios (Admin)' },
      { name: 'Escuelas', description: 'CRUD de escuelas' },
      { name: 'Cursos', description: 'CRUD de cursos y autorizaciones' },
      { name: 'Proyectos', description: 'Proyectos académicos' },
      { name: 'Semilleros', description: 'Semilleros de investigación' },
      { name: 'Eventos', description: 'Eventos, inscripciones y asistencia' },
      { name: 'Público', description: 'Portal público — escuelas, cursos y proyectos publicados (sin auth)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token obtenido en POST /auth/login',
        },
      },
      schemas,
    },
    security: [{ bearerAuth: [] }],
    paths,
  },
  apis: [],
});
