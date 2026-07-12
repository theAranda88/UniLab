/** Parámetro de ruta {id} reutilizable */
export const paramId = {
  name: 'id',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: 'Identificador numérico del recurso',
  example: 1,
};

export const paramIdProfesor = {
  name: 'idProfesor',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: 'ID del profesor',
  example: 3,
};

export const paramIdEstudiante = {
  name: 'idEstudiante',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: 'ID del estudiante',
  example: 5,
};

/** Respuestas de error estándar */
export const responsesError = {
  400: {
    description: 'Validación fallida (forma de datos incorrecta)',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ValidationError' },
      },
    },
  },
  401: {
    description: 'Token ausente, inválido o expirado',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  403: {
    description: 'Sin permiso o primer_login pendiente',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  404: {
    description: 'Recurso no encontrado o soft-deleted',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  409: {
    description: 'Conflicto de unicidad o regla de negocio duplicada',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  422: {
    description: 'Regla de negocio violada',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
};

export function jsonBody(schemaRef: string, description?: string) {
  return {
    required: true,
    description,
    content: {
      'application/json': {
        schema: { $ref: schemaRef },
      },
    },
  };
}

export const schemas = {
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'Mensaje de error' },
    },
  },
  ValidationError: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'Validación fallida' },
      detalles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            campo: { type: 'string' },
            mensaje: { type: 'string' },
          },
        },
      },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'admin@unilab.edu' },
      password: { type: 'string', example: 'Password123!' },
    },
  },
  LoginResponse: {
    type: 'object',
    properties: {
      token: { type: 'string' },
      usuario: {
        type: 'object',
        properties: {
          id_usuario: { type: 'integer', example: 1 },
          email: { type: 'string', example: 'admin@unilab.edu' },
          id_rol: { type: 'string', example: 'Administrador' },
          primer_login: { type: 'boolean', example: false },
        },
      },
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['nombres', 'apellidos', 'email', 'documento_identidad', 'telefono', 'rol'],
    properties: {
      nombres: { type: 'string', example: 'Juan' },
      apellidos: { type: 'string', example: 'Pérez' },
      email: { type: 'string', format: 'email', example: 'juan.perez@unilab.edu' },
      documento_identidad: { type: 'string', example: '1098765432' },
      telefono: { type: 'string', example: '3001234567' },
      rol: { type: 'string', enum: ['Estudiante', 'Externo'], example: 'Estudiante' },
      codigo_estudiantil: { type: 'string', description: 'Requerido si rol=Estudiante', example: 'EST-100' },
      id_escuela: { type: 'integer', description: 'Requerido si rol=Estudiante', example: 5 },
      institucion: { type: 'string', description: 'Requerido si rol=Externo', example: 'Empresa XYZ' },
      ocupacion: { type: 'string', description: 'Requerido si rol=Externo', example: 'Analista' },
    },
  },
  RegisterResponse: {
    type: 'object',
    properties: {
      usuario: { type: 'object' },
      password_temporal: { type: 'string', example: 'xK9mP2nQ4rA1!' },
      mensaje: { type: 'string', example: 'Guarde esta contraseña; solo se muestra una vez.' },
    },
  },
  CambiarPasswordRequest: {
    type: 'object',
    description:
      'Caso A (primer login): enviar nueva_password con Bearer token. Caso B (olvidó contraseña): enviar email sin token.',
    properties: {
      nueva_password: { type: 'string', minLength: 8, example: 'MiNuevaClave2026!' },
      email: { type: 'string', format: 'email', example: 'estudiante1@unilab.edu' },
    },
  },
  CrearUsuarioRequest: {
    type: 'object',
    required: ['nombres', 'apellidos', 'email', 'documento_identidad', 'telefono', 'rol'],
    properties: {
      nombres: { type: 'string', example: 'Laura' },
      apellidos: { type: 'string', example: 'García' },
      email: { type: 'string', format: 'email', example: 'laura.garcia@unilab.edu' },
      documento_identidad: { type: 'string', example: '1087654321' },
      telefono: { type: 'string', example: '3009876543' },
      rol: {
        type: 'string',
        enum: ['Administrador', 'Coordinador', 'Profesor', 'Estudiante', 'Externo'],
        example: 'Profesor',
      },
      codigo_docente: { type: 'string', description: 'Requerido si rol=Profesor', example: 'DOC-010' },
      codigo_estudiantil: { type: 'string', description: 'Requerido si rol=Estudiante', example: 'EST-010' },
      id_escuela: { type: 'integer', description: 'Requerido si rol=Profesor o Estudiante', example: 5 },
      cargo: { type: 'string', description: 'Requerido si rol=Coordinador', example: 'Coordinador de Área' },
      dependencia: { type: 'string', description: 'Requerido si rol=Coordinador', example: 'Vicerrectoría' },
      institucion: { type: 'string', description: 'Requerido si rol=Externo', example: 'ONG Aliada' },
      ocupacion: { type: 'string', description: 'Requerido si rol=Externo', example: 'Investigador' },
    },
  },
  CrearUsuarioResponse: {
    type: 'object',
    properties: {
      usuario: { type: 'object' },
      password_temporal: { type: 'string', example: 'xK9mP2nQ4rA1!' },
    },
  },
  ActualizarUsuarioRequest: {
    type: 'object',
    properties: {
      nombres: { type: 'string', example: 'Laura' },
      apellidos: { type: 'string', example: 'García Actualizada' },
      email: { type: 'string', format: 'email' },
      documento_identidad: { type: 'string' },
      telefono: { type: 'string' },
      id_escuela: { type: 'integer', example: 5 },
      codigo_docente: { type: 'string' },
      codigo_estudiantil: { type: 'string' },
      cargo: { type: 'string' },
      dependencia: { type: 'string' },
      institucion: { type: 'string' },
      ocupacion: { type: 'string' },
    },
  },
  EscuelaRequest: {
    type: 'object',
    required: ['nombre_escuela'],
    properties: {
      nombre_escuela: { type: 'string', example: 'Escuela de Software y Desarrollo Tecnológico' },
    },
  },
  CursoRequest: {
    type: 'object',
    required: ['id_escuela', 'nombre_curso', 'periodo_academico'],
    properties: {
      id_escuela: { type: 'integer', example: 5 },
      nombre_curso: { type: 'string', example: 'Ingeniería de Software y Computación' },
      periodo_academico: { type: 'string', example: '2026-1' },
    },
  },
  AutorizacionCursoRequest: {
    type: 'object',
    required: ['id_estudiante'],
    properties: {
      id_estudiante: { type: 'integer', example: 5, description: 'ID del estudiante a autorizar' },
    },
  },
  ProyectoRequest: {
    type: 'object',
    required: ['id_curso', 'titulo', 'descripcion', 'tipo_proyecto', 'url_aplicativo'],
    properties: {
      id_curso: { type: 'integer', example: 13 },
      id_semillero: { type: 'integer', example: 1, description: 'Opcional — ruta semillero' },
      titulo: { type: 'string', example: 'Plataforma UniLab' },
      descripcion: { type: 'string', example: 'Sistema de gestión de proyectos universitarios' },
      tipo_proyecto: { type: 'string', enum: ['web', 'movil', 'podcast', 'otro'], example: 'web' },
      url_aplicativo: { type: 'string', format: 'uri', example: 'https://unilab.example.com' },
      url_apk: { type: 'string', format: 'uri' },
      url_youtube: { type: 'string', format: 'uri' },
      url_spotify: { type: 'string', format: 'uri' },
    },
  },
  EstadoProyectoRequest: {
    type: 'object',
    required: ['estado_proyecto'],
    properties: {
      estado_proyecto: {
        type: 'string',
        enum: ['borrador', 'en_revision', 'aprobado', 'publicado', 'rechazado'],
        example: 'en_revision',
      },
    },
  },
  ComentarioRequest: {
    type: 'object',
    required: ['contenido'],
    properties: {
      contenido: { type: 'string', example: 'Excelente proyecto, muy bien documentado.' },
      id_comentario_padre: { type: 'integer', description: 'Opcional — para respuestas anidadas', example: 1 },
    },
  },
  CalificacionRequest: {
    type: 'object',
    required: ['puntuacion'],
    properties: {
      puntuacion: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
    },
  },
  SemilleroRequest: {
    type: 'object',
    required: ['nombre_semillero', 'descripcion', 'id_escuela', 'id_profesor_lider'],
    properties: {
      nombre_semillero: { type: 'string', example: 'Semillero de Innovación Tecnológica' },
      descripcion: { type: 'string', example: 'Investigación en software y datos' },
      id_escuela: { type: 'integer', example: 5 },
      id_profesor_lider: { type: 'integer', example: 3, description: 'ID del profesor líder (profesor1@unilab.edu)' },
    },
  },
  AsignarProfesorSemilleroRequest: {
    type: 'object',
    required: ['id_profesor'],
    properties: {
      id_profesor: { type: 'integer', example: 4 },
      es_lider: { type: 'boolean', default: false },
    },
  },
  SolicitudMembresiaRequest: {
    type: 'object',
    properties: {
      id_estudiante: {
        type: 'integer',
        description: 'Opcional — por defecto usa el estudiante autenticado',
        example: 5,
      },
    },
  },
  ResolverMembresiaRequest: {
    type: 'object',
    required: ['estado_solicitud'],
    properties: {
      estado_solicitud: { type: 'string', enum: ['aprobado', 'rechazado'], example: 'aprobado' },
    },
  },
  EventoRequest: {
    type: 'object',
    required: ['nombre_evento', 'tipo_evento', 'descripcion', 'fecha_inicio', 'fecha_fin', 'lugar', 'estado'],
    properties: {
      nombre_evento: { type: 'string', example: 'Foro Universitario de Proyectos 2026' },
      tipo_evento: { type: 'string', example: 'Foro académico' },
      descripcion: { type: 'string', example: 'Evento de exhibición de proyectos estudiantiles' },
      fecha_inicio: { type: 'string', format: 'date', example: '2026-06-15' },
      fecha_fin: { type: 'string', format: 'date', example: '2026-06-16' },
      lugar: { type: 'string', example: 'Auditorio Principal' },
      estado: { type: 'string', enum: ['planeado', 'activo', 'finalizado'], example: 'planeado' },
      requiere_pago: { type: 'boolean', default: false },
    },
  },
  JornadaRequest: {
    type: 'object',
    required: ['nombre_jornada', 'fecha', 'hora_inicio', 'hora_fin'],
    properties: {
      nombre_jornada: { type: 'string', example: 'Día 1 - Jornada Mañana' },
      fecha: { type: 'string', format: 'date', example: '2026-06-15' },
      hora_inicio: { type: 'string', example: '08:00:00' },
      hora_fin: { type: 'string', example: '12:00:00' },
    },
  },
  InscripcionRequest: {
    type: 'object',
    required: ['tipo_asistente', 'nombre_completo', 'documento_identidad', 'email', 'telefono', 'genero'],
    properties: {
      tipo_asistente: { type: 'string', enum: ['externo', 'estudiante', 'profesor'], example: 'estudiante' },
      nombre_completo: { type: 'string', example: 'Sofía Estudiante' },
      documento_identidad: { type: 'string', example: '1000000005' },
      email: { type: 'string', format: 'email', example: 'estudiante1@unilab.edu' },
      telefono: { type: 'string', example: '3000000005' },
      institucion: { type: 'string', example: 'Universidad Autónoma' },
      genero: { type: 'string', example: 'femenino' },
    },
  },
  PagoInscripcionRequest: {
    type: 'object',
    required: ['estado_pago'],
    properties: {
      estado_pago: { type: 'string', enum: ['pendiente', 'confirmado', 'exento'], example: 'confirmado' },
    },
  },
  AsistenciaRequest: {
    type: 'object',
    required: ['codigo_qr'],
    properties: {
      codigo_qr: { type: 'string', description: 'UUID único de la jornada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    },
  },
};
