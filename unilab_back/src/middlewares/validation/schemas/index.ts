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
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envíe al menos un campo para actualizar' });

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

export const escuelaSchema = z.object({
  nombre_escuela: z.string().min(1),
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

export const asignarProfesorSemilleroSchema = z.object({
  id_profesor: z.number().int().positive(),
  es_lider: z.boolean().optional(),
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
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un parámetro para actualizar',
  });
