import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  dependencia: z.string().optional(),
  institucion: z.string().optional(),
  ocupacion: z.string().optional(),
});

export const actualizarUsuarioSchema = z.object({
  nombres: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  email: z.string().email().optional(),
  documento_identidad: z.string().optional(),
  telefono: z.string().optional(),
  id_escuela: z.number().int().positive().optional(),
  codigo_docente: z.string().optional(),
  codigo_estudiantil: z.string().optional(),
  cargo: z.string().optional(),
  dependencia: z.string().optional(),
  institucion: z.string().optional(),
  ocupacion: z.string().optional(),
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

export const autorizacionCursoSchema = z.object({
  id_estudiante: z.number().int().positive(),
});

export const proyectoSchema = z.object({
  id_curso: z.number().int().positive(),
  id_semillero: z.number().int().positive().optional(),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  tipo_proyecto: z.enum(['web', 'movil', 'podcast', 'otro']),
  url_aplicativo: z.string().url(),
  url_apk: z.string().url().optional(),
  url_youtube: z.string().url().optional(),
  url_spotify: z.string().url().optional(),
});

export const actualizarProyectoSchema = proyectoSchema.partial();

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

export const asignarProfesorSemilleroSchema = z.object({
  id_profesor: z.number().int().positive(),
  es_lider: z.boolean().optional(),
});

export const solicitudMembresiaSchema = z.object({
  id_estudiante: z.number().int().positive().optional(),
});

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

export const idEstudianteParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idEstudiante: z.coerce.number().int().positive(),
});
