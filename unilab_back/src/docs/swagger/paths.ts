import { paramId, paramIdEstudiante, paramIdProfesor, responsesError, jsonBody } from './components';

const err = responsesError;

export const paths = {
  // ─── AUTH ───────────────────────────────────────────────────────────────────
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Iniciar sesión',
      description: 'Valida credenciales y emite JWT. Funciona aunque `primer_login=true`; el bloqueo ocurre en rutas protegidas.',
      security: [],
      requestBody: jsonBody('#/components/schemas/LoginRequest'),
      responses: {
        200: {
          description: 'JWT emitido',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
        },
        400: err[400],
        401: err[401],
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Autorregistro (Estudiante / Externo)',
      description: 'Genera contraseña aleatoria, `primer_login=true`, devuelve `password_temporal` una sola vez.',
      security: [],
      requestBody: jsonBody('#/components/schemas/RegisterRequest'),
      responses: {
        201: {
          description: 'Usuario creado',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterResponse' } } },
        },
        400: err[400],
        409: err[409],
        422: err[422],
      },
    },
  },
  '/auth/cambiar-password': {
    post: {
      tags: ['Auth'],
      summary: 'Cambiar contraseña',
      description:
        '**Caso A:** Bearer + `nueva_password` (primer login). **Caso B:** `email` sin token (reset) — devuelve password temporal.',
      security: [{ bearerAuth: [] }, {}],
      requestBody: jsonBody('#/components/schemas/CambiarPasswordRequest'),
      responses: {
        200: { description: 'Contraseña actualizada o temporal generada' },
        400: err[400],
        404: err[404],
        422: err[422],
      },
    },
  },

  // ─── USUARIOS ───────────────────────────────────────────────────────────────
  '/usuarios': {
    get: {
      tags: ['Usuarios'],
      summary: 'Listar usuarios',
      description: '**Rol requerido:** Administrador',
      parameters: [
        {
          name: 'rol',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['Administrador', 'Coordinador', 'Profesor', 'Estudiante', 'Externo'],
          },
          description: 'Filtrar por nombre de rol',
          example: 'Estudiante',
        },
      ],
      responses: { 200: { description: 'Lista de usuarios' }, ...err },
    },
    post: {
      tags: ['Usuarios'],
      summary: 'Crear usuario (cualquier rol)',
      description:
        '**Rol requerido:** Administrador. Genera contraseña aleatoria y `primer_login=true`. Devuelve `password_temporal`.',
      requestBody: jsonBody('#/components/schemas/CrearUsuarioRequest'),
      responses: {
        201: {
          description: 'Usuario creado',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearUsuarioResponse' } } },
        },
        ...err,
      },
    },
  },
  '/usuarios/{id}': {
    get: {
      tags: ['Usuarios'],
      summary: 'Obtener usuario por ID',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      responses: { 200: { description: 'Detalle del usuario' }, ...err },
    },
    patch: {
      tags: ['Usuarios'],
      summary: 'Actualizar usuario',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/ActualizarUsuarioRequest'),
      responses: { 200: { description: 'Usuario actualizado' }, ...err },
    },
    delete: {
      tags: ['Usuarios'],
      summary: 'Eliminar usuario (soft-delete)',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      responses: { 204: { description: 'Eliminado' }, ...err },
    },
  },
  '/usuarios/{id}/suspender': {
    patch: {
      tags: ['Usuarios'],
      summary: 'Suspender / reactivar usuario',
      description: '**Rol requerido:** Administrador. Alterna el campo `activo`.',
      parameters: [paramId],
      responses: { 200: { description: 'Estado activo actualizado' }, ...err },
    },
  },

  // ─── ESCUELAS ─────────────────────────────────────────────────────────────
  '/escuelas': {
    get: {
      tags: ['Escuelas'],
      summary: 'Listar escuelas',
      description: '**Rol requerido:** cualquier autenticado',
      responses: { 200: { description: 'Lista con cursos anidados' }, ...err },
    },
    post: {
      tags: ['Escuelas'],
      summary: 'Crear escuela',
      description: '**Rol requerido:** Administrador',
      requestBody: jsonBody('#/components/schemas/EscuelaRequest'),
      responses: { 201: { description: 'Escuela creada' }, ...err },
    },
  },
  '/escuelas/{id}': {
    get: {
      tags: ['Escuelas'],
      summary: 'Obtener escuela por ID',
      parameters: [paramId],
      responses: { 200: { description: 'Detalle con cursos' }, ...err },
    },
    patch: {
      tags: ['Escuelas'],
      summary: 'Actualizar escuela',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/EscuelaRequest'),
      responses: { 200: { description: 'Escuela actualizada' }, ...err },
    },
    delete: {
      tags: ['Escuelas'],
      summary: 'Eliminar escuela (soft-delete + cascada lógica a cursos)',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      responses: { 204: { description: 'Eliminada' }, ...err },
    },
  },

  // ─── CURSOS ───────────────────────────────────────────────────────────────
  '/cursos': {
    get: {
      tags: ['Cursos'],
      summary: 'Listar cursos',
      parameters: [
        {
          name: 'id_escuela',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filtrar por escuela',
          example: 5,
        },
      ],
      responses: { 200: { description: 'Lista de cursos' }, ...err },
    },
    post: {
      tags: ['Cursos'],
      summary: 'Crear curso',
      description: '**Rol requerido:** Administrador',
      requestBody: jsonBody('#/components/schemas/CursoRequest'),
      responses: { 201: { description: 'Curso creado' }, ...err },
    },
  },
  '/cursos/{id}': {
    get: {
      tags: ['Cursos'],
      summary: 'Obtener curso por ID',
      parameters: [paramId],
      responses: { 200: { description: 'Detalle del curso' }, ...err },
    },
    patch: {
      tags: ['Cursos'],
      summary: 'Actualizar curso',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/CursoRequest'),
      responses: { 200: { description: 'Curso actualizado' }, ...err },
    },
    delete: {
      tags: ['Cursos'],
      summary: 'Eliminar curso (soft-delete)',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      responses: { 204: { description: 'Eliminado' }, ...err },
    },
  },
  '/cursos/{id}/autorizaciones': {
    post: {
      tags: ['Cursos'],
      summary: 'Autorizar estudiante para subir proyecto',
      description: '**Rol requerido:** Profesor. Inserta fila en `curso_autorizaciones` y habilita al estudiante.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/AutorizacionCursoRequest'),
      responses: { 201: { description: 'Autorización creada' }, ...err },
    },
  },

  // ─── PROYECTOS ────────────────────────────────────────────────────────────
  '/proyectos': {
    get: {
      tags: ['Proyectos'],
      summary: 'Listar proyectos',
      description: 'Filtrado según rol del usuario autenticado.',
      responses: { 200: { description: 'Lista de proyectos' }, ...err },
    },
    post: {
      tags: ['Proyectos'],
      summary: 'Crear proyecto (borrador)',
      description:
        '**Rol requerido:** Estudiante. Requiere autorización vigente en curso o `puede_publicar` en semillero. El Profesor NUNCA puede usar este endpoint.',
      requestBody: jsonBody('#/components/schemas/ProyectoRequest'),
      responses: { 201: { description: 'Proyecto creado en estado borrador' }, ...err },
    },
  },
  '/proyectos/{id}': {
    get: {
      tags: ['Proyectos'],
      summary: 'Obtener proyecto (registra vista)',
      description: 'Cada llamada inserta en `proyecto_vistas` e incrementa `contador_vistas`.',
      parameters: [paramId],
      responses: { 200: { description: 'Detalle del proyecto' }, ...err },
    },
    patch: {
      tags: ['Proyectos'],
      summary: 'Actualizar proyecto',
      description: 'Requiere permiso de gestión (coordinador, admin, creador estudiante si no publicado).',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/ProyectoRequest', 'Todos los campos son opcionales'),
      responses: { 200: { description: 'Proyecto actualizado' }, ...err },
    },
    delete: {
      tags: ['Proyectos'],
      summary: 'Eliminar proyecto (soft-delete)',
      parameters: [paramId],
      responses: { 204: { description: 'Eliminado' }, ...err },
    },
  },
  '/proyectos/{id}/estado': {
    patch: {
      tags: ['Proyectos'],
      summary: 'Cambiar estado del proyecto',
      description: 'Transiciones: borrador→en_revision→aprobado→publicado, o →rechazado.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/EstadoProyectoRequest'),
      responses: { 200: { description: 'Estado actualizado' }, ...err },
    },
  },
  '/proyectos/{id}/comentarios': {
    post: {
      tags: ['Proyectos'],
      summary: 'Agregar comentario (foro)',
      description: '**Rol requerido:** cualquier autenticado. Soporta hilos con `id_comentario_padre`.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/ComentarioRequest'),
      responses: { 201: { description: 'Comentario creado' }, ...err },
    },
  },
  '/proyectos/{id}/calificacion': {
    put: {
      tags: ['Proyectos'],
      summary: 'Calificar proyecto (upsert)',
      description: 'Un usuario solo puede tener una calificación por proyecto (1–5).',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/CalificacionRequest'),
      responses: { 200: { description: 'Calificación guardada' }, ...err },
    },
  },

  // ─── SEMILLEROS ───────────────────────────────────────────────────────────
  '/semilleros': {
    get: {
      tags: ['Semilleros'],
      summary: 'Listar semilleros',
      responses: { 200: { description: 'Lista de semilleros' }, ...err },
    },
    post: {
      tags: ['Semilleros'],
      summary: 'Crear semillero',
      description: '**Rol requerido:** Administrador',
      requestBody: jsonBody('#/components/schemas/SemilleroRequest'),
      responses: { 201: { description: 'Semillero creado' }, ...err },
    },
  },
  '/semilleros/{id}': {
    get: {
      tags: ['Semilleros'],
      summary: 'Obtener semillero por ID',
      parameters: [paramId],
      responses: { 200: { description: 'Detalle con profesores y miembros' }, ...err },
    },
    patch: {
      tags: ['Semilleros'],
      summary: 'Actualizar semillero',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nombre_semillero: { type: 'string' },
                descripcion: { type: 'string' },
                activo: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Semillero actualizado' }, ...err },
    },
    delete: {
      tags: ['Semilleros'],
      summary: 'Eliminar semillero (soft-delete)',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      responses: { 204: { description: 'Eliminado' }, ...err },
    },
  },
  '/semilleros/{id}/profesores': {
    post: {
      tags: ['Semilleros'],
      summary: 'Asignar profesor al semillero',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/AsignarProfesorSemilleroRequest'),
      responses: { 201: { description: 'Profesor asignado' }, ...err },
    },
  },
  '/semilleros/{id}/profesores/{idProfesor}': {
    delete: {
      tags: ['Semilleros'],
      summary: 'Quitar profesor del semillero',
      description: '**Rol requerido:** Administrador',
      parameters: [paramId, paramIdProfesor],
      responses: { 204: { description: 'Profesor removido' }, ...err },
    },
  },
  '/semilleros/{id}/miembros': {
    post: {
      tags: ['Semilleros'],
      summary: 'Solicitar membresía',
      description: '**Rol requerido:** Estudiante',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/SolicitudMembresiaRequest', 'Body vacío usa el estudiante autenticado'),
      responses: { 201: { description: 'Solicitud creada (pendiente)' }, ...err },
    },
  },
  '/semilleros/{id}/miembros/{idEstudiante}': {
    patch: {
      tags: ['Semilleros'],
      summary: 'Aprobar o rechazar solicitud de membresía',
      description: '**Rol requerido:** Profesor líder del semillero',
      parameters: [paramId, paramIdEstudiante],
      requestBody: jsonBody('#/components/schemas/ResolverMembresiaRequest'),
      responses: { 200: { description: 'Membresía resuelta' }, ...err },
    },
  },
  '/semilleros/{id}/miembros/{idEstudiante}/autorizar-publicacion': {
    patch: {
      tags: ['Semilleros'],
      summary: 'Autorizar publicación de proyectos (ruta semillero)',
      description: '**Rol requerido:** Profesor líder. Activa `puede_publicar=true` en la membresía.',
      parameters: [paramId, paramIdEstudiante],
      responses: { 200: { description: 'Autorización concedida' }, ...err },
    },
  },

  // ─── EVENTOS ────────────────────────────────────────────────────────────────
  '/eventos': {
    get: {
      tags: ['Eventos'],
      summary: 'Listar eventos',
      responses: { 200: { description: 'Lista de eventos' }, ...err },
    },
    post: {
      tags: ['Eventos'],
      summary: 'Crear evento',
      description: '**Rol requerido:** Administrador. El organizador es siempre el admin autenticado.',
      requestBody: jsonBody('#/components/schemas/EventoRequest'),
      responses: { 201: { description: 'Evento creado' }, ...err },
    },
  },
  '/eventos/{id}': {
    get: {
      tags: ['Eventos'],
      summary: 'Obtener evento por ID',
      parameters: [paramId],
      responses: { 200: { description: 'Detalle con jornadas e inscripciones' }, ...err },
    },
    patch: {
      tags: ['Eventos'],
      summary: 'Actualizar evento',
      description: '**Rol requerido:** Administrador. Actualización parcial; al menos un campo.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/EventoUpdateRequest'),
      responses: { 200: { description: 'Evento actualizado' }, ...err },
    },
    delete: {
      tags: ['Eventos'],
      summary: 'Eliminar evento (soft-delete)',
      description: '**Rol requerido:** Administrador. Soft-delete en cascada de jornadas e inscripciones activas.',
      parameters: [paramId],
      responses: { 204: { description: 'Evento eliminado' }, ...err },
    },
  },
  '/eventos/{id}/jornadas': {
    post: {
      tags: ['Eventos'],
      summary: 'Crear jornada',
      description: '**Rol requerido:** Administrador. Genera `codigo_qr` único automáticamente.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/JornadaRequest'),
      responses: { 201: { description: 'Jornada creada con codigo_qr' }, ...err },
    },
  },
  '/eventos/{id}/inscripciones': {
    get: {
      tags: ['Eventos'],
      summary: 'Listar inscripciones del evento',
      description: '**Rol requerido:** Administrador o Coordinador. Incluye datos del usuario y `estado_pago`.',
      parameters: [paramId],
      responses: {
        200: {
          description: 'Lista de inscripciones',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/InscripcionResponse' },
              },
            },
          },
        },
        ...err,
      },
    },
    post: {
      tags: ['Eventos'],
      summary: 'Inscribirse al evento',
      description: '**Rol requerido:** cualquier autenticado. Una inscripción da acceso a todas las jornadas.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/InscripcionRequest'),
      responses: { 201: { description: 'Inscripción creada' }, ...err },
    },
  },
  '/eventos/{id}/reportes': {
    get: {
      tags: ['Eventos'],
      summary: 'Reportes del evento',
      description: '**Rol requerido:** Administrador o Coordinador. Asistentes por jornada, pagos pendientes/exentos.',
      parameters: [paramId],
      responses: { 200: { description: 'Reporte consolidado' }, ...err },
    },
  },

  // ─── INSCRIPCIONES / JORNADAS ─────────────────────────────────────────────
  '/inscripciones/{id}/pago': {
    patch: {
      tags: ['Eventos'],
      summary: 'Actualizar estado de pago',
      description: '**Rol requerido:** Administrador. Solo si el evento `requiere_pago=true`.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/PagoInscripcionRequest'),
      responses: { 200: { description: 'Pago actualizado' }, ...err },
    },
  },
  '/eventos/{id}/reportes/export/csv': {
    get: {
      tags: ['Eventos'],
      summary: 'Exportar reporte a CSV',
      description: '**Rol requerido:** Administrador o Coordinador. Descarga un archivo CSV con los datos de asistentes, documentos, emails, tipos de asistente, estado de pago y porcentaje de asistencia.',
      parameters: [paramId],
      responses: {
        200: {
          description: 'Archivo CSV descargado',
          content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
        },
        ...err,
      },
    },
  },
  '/eventos/{id}/reportes/export/excel': {
    get: {
      tags: ['Eventos'],
      summary: 'Exportar reporte a Excel',
      description: '**Rol requerido:** Administrador o Coordinador. Descarga un archivo XLSX con los datos formateados: encabezados azules (#243B8E), columnas para nombre, documento, email, tipo de asistente, estado de pago y asistencias.',
      parameters: [paramId],
      responses: {
        200: {
          description: 'Archivo Excel descargado',
          content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } },
        },
        ...err,
      },
    },
  },

  // ─── INSCRIPCIONES / JORNADAS ─────────────────────────────────────────────
  '/asistencias/registrar': {
    post: {
      tags: ['Eventos'],
      summary: 'Registrar asistencia por escaneo QR',
      description: '**Rol requerido:** Autenticado (cualquier usuario inscrito). Valida que el usuario esté inscrito en el evento de la jornada, que el código QR sea válido, y que no tenga asistencia duplicada. El QR puede ser escaneado directamente desde `http://localhost:4200/eventos/{id}/asistencia?qr={codigo_qr}` (deeplink automático) o ingresado manualmente. Genera un registro en la tabla `asistencias` con la fecha/hora del registro.',
      requestBody: jsonBody('#/components/schemas/AsistenciaRequest'),
      responses: {
        201: {
          description: 'Asistencia registrada correctamente',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AsistenciaResponse' } } },
        },
        400: err[400],
        401: err[401],
        403: err[403],
        404: err[404],
        409: { ...err[409], description: 'Asistencia ya registrada en esa jornada' },
        422: { ...err[422], description: 'Código QR inválido o usuario no inscrito en el evento' },
      },
    },
  },
  '/eventos/qr/{codigo_qr}': {
    get: {
      tags: ['Eventos'],
      summary: 'Generar imagen QR (Backend)',
      description: '**Rol requerido:** Autenticado. Genera una imagen PNG o SVG del código QR para una jornada. Generalmente no se usa directamente; el frontend genera QRs con `QRCode.toDataURL()`. Parámetro query: `formato=png` (default) o `formato=svg`.',
      parameters: [
        {
          name: 'codigo_qr',
          in: 'path',
          required: true,
          schema: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          description: 'UUID único de la jornada',
        },
        {
          name: 'formato',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['png', 'svg'], default: 'png' },
          description: 'Formato de la imagen QR',
        },
      ],
      responses: {
        200: {
          description: 'Imagen QR en formato solicitado',
          content: { 'image/png': { schema: { type: 'string', format: 'binary' } } },
        },
        ...err,
      },
    },
  },
  '/jornadas/{id}/asistencia': {
    post: {
      tags: ['Eventos'],
      summary: 'Registrar asistencia (Ruta alternativa)',
      description: '**Rol requerido:** Autenticado. Endpoint alternativo (mismo que POST /asistencias/registrar). Mantiene retrocompatibilidad con versiones anteriores.',
      parameters: [paramId],
      requestBody: jsonBody('#/components/schemas/AsistenciaRequest'),
      responses: {
        201: {
          description: 'Asistencia registrada correctamente',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AsistenciaResponse' } } },
        },
        ...err,
      },
    },
  },
};

