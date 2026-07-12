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
    servers: [{ url: 'http://localhost:3000/api', description: 'Desarrollo local' }],
    tags: [
      { name: 'Auth', description: 'Autenticación y contraseñas' },
      { name: 'Usuarios', description: 'Gestión de usuarios (Admin)' },
      { name: 'Escuelas', description: 'CRUD de escuelas' },
      { name: 'Cursos', description: 'CRUD de cursos y autorizaciones' },
      { name: 'Proyectos', description: 'Proyectos académicos' },
      { name: 'Semilleros', description: 'Semilleros de investigación' },
      { name: 'Eventos', description: 'Eventos, inscripciones y asistencia' },
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
