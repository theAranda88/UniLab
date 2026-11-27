import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** zod 4 ejecuta los refine aunque el formato falle: el hostname se obtiene sin lanzar. */
function hostnameDe(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/** URL http(s) opcional; cadena vacía o null borran el valor guardado. */
const urlRed = (dominio?: RegExp, mensaje?: string) =>
  z
    .union([
      z
        .url({ protocol: /^https?$/, message: 'Debe ser una URL http(s) válida' })
        .max(500)
        .refine((v) => !dominio || dominio.test(hostnameDe(v)), { message: mensaje }),
      z.literal(''),
      z.null(),
    ])
    .transform((v) => (v ? v : null))
    .optional();

const redesContactoShape = {
  url_linkedin: urlRed(/(^|\.)linkedin\.com$/i, 'Debe ser un enlace de linkedin.com'),
  url_github: urlRed(/(^|\.)github\.com$/i, 'Debe ser un enlace de github.com'),
  url_portafolio: urlRed(),
};

/** Redes académicas del perfil tipo CvLAC. */
const redesAcademicasShape = {
  url_cvlac: urlRed(/(^|\.)minciencias\.gov\.co$/i, 'Debe ser un enlace de CvLAC (minciencias.gov.co)'),
  url_orcid: urlRed(/(^|\.)orcid\.org$/i, 'Debe ser un enlace de orcid.org'),
  url_google_scholar: urlRed(/^scholar\.google\./i, 'Debe ser un enlace de Google Académico'),
  url_researchgate: urlRed(/(^|\.)researchgate\.net$/i, 'Debe ser un enlace de researchgate.net'),
};

/** Lista de etiquetas cortas (especialidades, fortalezas): sin vacías ni repetidas. */
const listaEtiquetas = z
  .array(z.string().trim().min(1).max(60))
  .max(15, 'Máximo 15 elementos')
  .transform((lista) => [...new Set(lista)])
  .optional();

const textoPerfil = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

const telefonoSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'Teléfono inválido: use entre 7 y 20 dígitos');

/** PATCH /auth/me: datos que el propio usuario puede editar (no rol, email ni documento). */
export const actualizarMiPerfilSchema = z
  .object({
    telefono: telefonoSchema.optional(),
    profesion: z
      .string()
      .trim()
      .max(255)
      .transform((v) => v || null)
      .nullable()
      .optional(),
    ...redesContactoShape,
    ...redesAcademicasShape,
    titular: textoPerfil(160),
    biografia: textoPerfil(2000),
    especialidades: listaEtiquetas,
    fortalezas: listaEtiquetas,
    mostrar_telefono: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envíe al menos un campo para actualizar' });

const anioFormacion = z.number().int().min(1950).max(2100);

export const formacionSchema = z
  .object({
    titulo: z.string().trim().min(1).max(255),
    institucion: z.string().trim().min(1).max(255),
    nivel: z.enum(['tecnico', 'tecnologo', 'pregrado', 'especializacion', 'maestria', 'doctorado', 'curso', 'otro']),
    anio_inicio: anioFormacion.nullable().optional(),
    /** null = en curso */
    anio_fin: anioFormacion.nullable().optional(),
  })
  .refine((d) => !d.anio_inicio || !d.anio_fin || d.anio_fin >= d.anio_inicio, {
    message: 'El año de fin no puede ser anterior al de inicio',
    path: ['anio_fin'],
  });

export const formacionParamSchema = z.object({
  idFormacion: z.coerce.number().int().positive(),
});

/** PUT /proyectos/:id/autores: compañeros (coautores) del proyecto; el creador se mantiene siempre. */
export const autoresProyectoSchema = z.object({
  ids_estudiantes: z.array(z.number().int().positive()).max(9, 'Máximo 9 coautores'),
});

export const companerosQuerySchema = z.object({
  busqueda: z.string().trim().max(100).optional(),
});

export const cambiarMiPasswordSchema = z
  .object({
    password_actual: z.string().min(1),
    nueva_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(128),
  })
  .refine((d) => d.password_actual !== d.nueva_password, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['nueva_password'],
  });

export const consultaUsuariosSchema = z.object({
  rol: z.enum(['Profesor', 'Estudiante']).optional(),
  id_escuela: z.coerce.number().int().positive().optional(),
  busqueda: z.string().trim().max(100).optional(),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1),
});

export const completarPerfilSchema = z.object({
  documento_identidad: z.string().min(1),
  telefono: z.string().min(1),
  codigo_estudiantil: z.string().optional(),
  id_escuela: z.number().int().positive().optional(),
  institucion: z.string().optional(),
  ocupacion: z.string().optional(),
  ...redesContactoShape,
});

export const registerSchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  email: z.string().email(),
  documento_identidad: z.string().min(1),
  telefono: z.string().min(1),
  rol: z.enum(['Estudiante', 'Externo']),
  codigo_estudiantil: z.string().optional(),
  id_escuela: z.number().int().positive().optional(),
  institucion: z.string().optional(),
  ocupacion: z.string().optional(),
});

export const cambiarPasswordSchema = z.object({
  nueva_password: z.string().min(8).optional(),
  email: z.string().email().optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const crearUsuarioSchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  email: z.string().email(),
  documento_identidad: z.string().min(1),
  telefono: z.string().min(1),
  rol: z.enum(['Administrador', 'Coordinador', 'Profesor', 'Estudiante', 'Externo']),
  codigo_docente: z.string().optional(),
  codigo_estudiantil: z.string().optional(),
  id_escuela: z.number().int().positive().optional(),
  id_escuela_secundaria: z.number().int().positive().nullable().optional(),
  cargo: z.string().optional(),
  profesion: z.string().trim().max(255).optional(),
  dependencia: z.string().optional(),
  institucion: z.string().optional(),
  ocupacion: z.string().optional(),
  ...redesContactoShape,
});

export const actualizarUsuarioSchema = z.object({
  nombres: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  email: z.string().email().optional(),
  documento_identidad: z.string().optional(),
  telefono: z.string().optional(),
  rol: z.enum(['Administrador', 'Coordinador', 'Profesor', 'Estudiante', 'Externo']).optional(),
  id_escuela: z.number().int().positive().optional(),
  id_escuela_secundaria: z.number().int().positive().nullable().optional(),
  codigo_docente: z.string().optional(),
  codigo_estudiantil: z.string().optional(),
  cargo: z.string().optional(),
  profesion: z.string().trim().max(255).optional(),
  dependencia: z.string().optional(),
  institucion: z.string().optional(),
  ocupacion: z.string().optional(),
  ...redesContactoShape,
});

export const filtroUsuariosSchema = z.object({
  rol: z.enum(['Administrador', 'Coordinador', 'Profesor', 'Estudiante', 'Externo']).optional(),
});

/** Texto opcional; cadena vacía o null borran el valor guardado. */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

export const escuelaSchema = z.object({
  nombre_escuela: z.string().trim().min(1).max(255),
  descripcion: textoOpcional(2000),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido: use el formato #RRGGBB')
    .nullable()
    .optional(),
  /** Clase de ícono Phosphor, p. ej. `ph-code`. */
  icono: z
    .string()
    .regex(/^ph-[a-z0-9-]{1,96}$/, 'Ícono inválido: use una clase Phosphor como ph-code')
    .nullable()
    .optional(),
  id_encargado: z.number().int().positive().nullable().optional(),
});

export const escuelaUpdateSchema = escuelaSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);

export const imagenEscuelaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idImagen: z.coerce.number().int().positive(),
});

export const cursoSchema = z.object({
  id_escuela: z.number().int().positive(),
  nombre_curso: z.string().min(1),
  periodo_academico: z.string().min(1),
});

export const cursoUpdateSchema = cursoSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);

export const autorizacionCursoSchema = z.object({
  id_estudiante: z.number().int().positive(),
});

const proyectoUrlsSchema = z.object({
  url_aplicativo: z.string().url().optional(),
  url_imagen: z.string().url().optional(),
  url_apk: z.string().url().optional(),
  url_youtube: z.string().url().optional(),
  url_spotify: z.string().url().optional(),
});

function validarUrlsPorTipoProyecto(
  tipo: 'web' | 'movil' | 'podcast' | 'otro',
  urls: z.infer<typeof proyectoUrlsSchema>,
  ctx: z.RefinementCtx,
): void {
  if (!urls.url_youtube) {
    ctx.addIssue({
      code: 'custom',
      message: 'La URL de YouTube es obligatoria',
      path: ['url_youtube'],
    });
  }

  if (tipo === 'podcast') {
    return;
  }

  if (!urls.url_aplicativo) {
    ctx.addIssue({
      code: 'custom',
      message: 'La URL del aplicativo es obligatoria',
      path: ['url_aplicativo'],
    });
  }

  if (tipo === 'movil' && !urls.url_apk) {
    ctx.addIssue({
      code: 'custom',
      message: 'La URL del APK es obligatoria para aplicaciones móviles',
      path: ['url_apk'],
    });
  }
}

const proyectoBaseSchema = z
  .object({
    id_curso: z.number().int().positive(),
    id_semillero: z.number().int().positive().optional(),
    id_profesor_coordinador: z.number().int().positive().optional(),
    titulo: z.string().min(1),
    descripcion: z.string().min(1),
    tipo_proyecto: z.enum(['web', 'movil', 'podcast', 'otro']),
  })
  .merge(proyectoUrlsSchema);

export const proyectoSchema = proyectoBaseSchema.superRefine((data, ctx) => {
  validarUrlsPorTipoProyecto(data.tipo_proyecto, data, ctx);
});

export const imagenProyectoParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idImagen: z.coerce.number().int().positive(),
});

export const evidenciaJornadaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idEvidencia: z.coerce.number().int().positive(),
});

export const evidenciaSemilleroParamSchema = evidenciaJornadaParamSchema;

export const actualizarProyectoSchema = proyectoBaseSchema.partial().superRefine((data, ctx) => {
  if (!data.tipo_proyecto) return;
  validarUrlsPorTipoProyecto(data.tipo_proyecto, data, ctx);
});

export const estadoProyectoSchema = z.object({
  estado_proyecto: z.enum(['borrador', 'en_revision', 'aprobado', 'publicado', 'rechazado']),
});

export const comentarioSchema = z.object({
  contenido: z.string().min(1),
  id_comentario_padre: z.number().int().positive().optional(),
});

export const calificacionSchema = z.object({
  puntuacion: z.number().int().min(1).max(5),
});

export const semilleroSchema = z.object({
  nombre_semillero: z.string().min(1),
  descripcion: z.string().min(1),
  id_escuela: z.number().int().positive(),
  id_profesor_lider: z.number().int().positive(),
});

export const semilleroUpdateSchema = semilleroSchema
  .extend({ activo: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

/** Roles editables de un profesor del semillero; «lider» se cambia con id_profesor_lider. */
export const ROLES_PROFESOR_SEMILLERO = ['coordinador', 'acompanante'] as const;
export const ROLES_ESTUDIANTE_SEMILLERO = ['integrante', 'lider', 'coordinador'] as const;

export const asignarProfesorSemilleroSchema = z.object({
  id_profesor: z.number().int().positive(),
  es_lider: z.boolean().optional(),
  rol: z.enum(ROLES_PROFESOR_SEMILLERO).optional(),
});

export const rolProfesorSemilleroSchema = z.object({
  rol: z.enum(ROLES_PROFESOR_SEMILLERO),
});

export const rolMiembroSemilleroSchema = z.object({
  rol: z.enum(ROLES_ESTUDIANTE_SEMILLERO),
});

export const solicitudMembresiaSchema = z.object({});

export const resolverMembresiaSchema = z.object({
  estado_solicitud: z.enum(['aprobado', 'rechazado']),
});

export const eventoSchema = z.object({
  nombre_evento: z.string().min(1),
  tipo_evento: z.string().min(1),
  descripcion: z.string().min(1),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  lugar: z.string().min(1),
  estado: z.enum(['planeado', 'activo', 'finalizado']),
  requiere_pago: z.boolean().optional(),
});

export const eventoUpdateSchema = eventoSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);

export const jornadaSchema = z.object({
  nombre_jornada: z.string().min(1),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
});

export const inscripcionSchema = z.object({
  tipo_asistente: z.enum(['externo', 'estudiante', 'profesor']),
  nombre_completo: z.string().min(1),
  documento_identidad: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().min(1),
  institucion: z.string().optional(),
  genero: z.string().min(1),
});

export const pagoInscripcionSchema = z.object({
  estado_pago: z.enum(['pendiente', 'confirmado', 'exento']),
});

export const asistenciaSchema = z.object({
  codigo_qr: z.string().min(1),
});

export const asistenciaPublicaSchema = z.object({
  codigo_qr: z.string().min(1),
  documento_identidad: z.string().min(1),
});

export const inscripcionPublicaSchema = z.object({
  nombre_completo: z.string().min(1),
  documento_identidad: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().min(1),
  institucion: z.string().optional(),
  genero: z.string().min(1),
});

export const inscripcionDocumentoQuerySchema = z.object({
  documento_identidad: z.string().min(1),
});

export const idEstudianteParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idEstudiante: z.coerce.number().int().positive(),
});

export const idProfesorParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idProfesor: z.coerce.number().int().positive(),
});

/** Claves válidas: CONFIGURACION_POR_DEFECTO en configuracion.service.ts. */
export const configuracionUpdateSchema = z
  .object({
    registro_abierto: z.boolean(),
    semilleros_solicitudes_abiertas: z.boolean(),
    mensaje_portal: z.string().trim().max(280),
    certificado_porcentaje_minimo: z.number().int().min(1).max(100),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un parámetro para actualizar',
  });

export const publicoSemillerosQuerySchema = z.object({
  id_escuela: z.coerce.number().int().positive().optional(),
  busqueda: z.string().trim().max(100).optional(),
  pagina: z.coerce.number().int().positive().optional().default(1),
  limite: z.coerce.number().int().min(1).max(50).optional().default(12),
});

const publicoSinSemilleroQuery = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((val) => val === true || val === 'true');

export const publicoProyectosQuerySchema = z
  .object({
    id_escuela: z.coerce.number().int().positive().optional(),
    id_semillero: z.coerce.number().int().positive().optional(),
    sin_semillero: publicoSinSemilleroQuery,
    /** `valorados`: mejor calificados primero (portada). Por defecto, más recientes. */
    orden: z.enum(['recientes', 'valorados']).optional(),
    limite: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict()
  .refine((data) => !(data.id_semillero !== undefined && data.sin_semillero === true), {
    message: 'No combine id_semillero con sin_semillero',
  });

export const certificadoCodigoSchema = z.object({
  codigo: z.string().uuid('Código de verificación inválido'),
});

/** Descarga del certificado sin cuenta: cédula y correo de la inscripción. */
export const certificadoPublicoSchema = z.object({
  documento_identidad: z.string().trim().min(3, 'Documento inválido').max(50),
  email: z.string().trim().email('Correo inválido'),
});
