import { AppError } from '../utils/AppError';
import { escuelaRepository, cursoRepository } from '../models/escuela.repository';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';
import { escuelaImagenService } from './escuela-imagen.service';

type EscuelaConDetalle = NonNullable<Awaited<ReturnType<typeof escuelaRepository.findById>>>;

export interface EscuelaDatos {
  nombre_escuela: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  id_encargado?: number | null;
}

/** Agrega la URL pública a cada imagen de la escuela. */
function mapEscuela(escuela: EscuelaConDetalle) {
  return { ...escuela, imagenes: escuelaImagenService.mapImagenes(escuela.imagenes) };
}

async function verificarEncargado(id_encargado: number | null | undefined): Promise<void> {
  if (!id_encargado) return;
  const encargado = await escuelaRepository.findEncargadoValido(id_encargado);
  if (!encargado) throw new AppError('El encargado debe ser un Profesor activo', 422);
}

export const escuelaService = {
  async listar() {
    const escuelas = await escuelaRepository.findMany();
    return escuelas.map(mapEscuela);
  },

  async obtener(id: number) {
    const escuela = await escuelaRepository.findById(id);
    if (!escuela) throw new AppError('Escuela no encontrada', 404);
    return mapEscuela(escuela);
  },

  async crear(data: EscuelaDatos, created_by: number) {
    await verificarEncargado(data.id_encargado);
    const escuela = await escuelaRepository.create({
      nombre_escuela: data.nombre_escuela,
      descripcion: data.descripcion ?? null,
      color: data.color ?? null,
      icono: data.icono ?? null,
      ...(data.id_encargado ? { encargado: { connect: { id_usuario: data.id_encargado } } } : {}),
      creador: { connect: { id_usuario: created_by } },
    });
    return mapEscuela(escuela);
  },

  async actualizar(id: number, data: Partial<EscuelaDatos>) {
    await escuelaService.obtener(id);
    await verificarEncargado(data.id_encargado);
    const escuela = await escuelaRepository.update(id, {
      nombre_escuela: data.nombre_escuela,
      descripcion: data.descripcion,
      color: data.color,
      icono: data.icono,
      // undefined: no cambia · null: quita el encargado · número: lo reemplaza
      ...(data.id_encargado === null ? { encargado: { disconnect: true } } : {}),
      ...(data.id_encargado ? { encargado: { connect: { id_usuario: data.id_encargado } } } : {}),
    });
    return mapEscuela(escuela);
  },

  async eliminar(id: number) {
    await escuelaService.obtener(id);
    const ahora = new Date();
    // Cascada lógica: soft-delete escuela → cursos e imágenes
    await prisma.$transaction([
      prisma.cursos.updateMany({
        where: { id_escuela: id, ...activo },
        data: { deleted_at: ahora },
      }),
      prisma.escuela_imagenes.updateMany({
        where: { id_escuela: id, ...activo },
        data: { deleted_at: ahora },
      }),
      prisma.escuelas.update({
        where: { id_escuela: id },
        data: { deleted_at: ahora },
      }),
    ]);
  },
};

export const cursoService = {
  listar(id_escuela?: number) {
    return cursoRepository.findMany(id_escuela ? { id_escuela } : undefined);
  },

  async obtener(id: number) {
    const curso = await cursoRepository.findById(id);
    if (!curso) throw new AppError('Curso no encontrado', 404);
    return curso;
  },

  async crear(data: {
    id_escuela: number;
    nombre_curso: string;
    periodo_academico: string;
    created_by: number;
  }) {
    await escuelaService.obtener(data.id_escuela);
    return cursoRepository.create({
      nombre_curso: data.nombre_curso,
      periodo_academico: data.periodo_academico,
      escuela: { connect: { id_escuela: data.id_escuela } },
      creador: { connect: { id_usuario: data.created_by } },
    });
  },

  async actualizar(
    id: number,
    data: Partial<{ nombre_curso: string; periodo_academico: string; id_escuela: number }>,
  ) {
    await cursoService.obtener(id);
    if (data.id_escuela) await escuelaService.obtener(data.id_escuela);
    return cursoRepository.update(id, {
      nombre_curso: data.nombre_curso,
      periodo_academico: data.periodo_academico,
      ...(data.id_escuela ? { escuela: { connect: { id_escuela: data.id_escuela } } } : {}),
    });
  },

  async eliminar(id: number) {
    await cursoService.obtener(id);
    const proyectos = await prisma.proyectos.count({ where: { id_curso: id, ...activo } });
    if (proyectos > 0) {
      throw new AppError(
        `No se puede eliminar: el curso tiene ${proyectos} proyecto(s) asociado(s)`,
        422,
      );
    }
    await cursoRepository.softDelete(id);
  },

  async autorizarEstudiante(id_curso: number, id_estudiante: number, id_profesor: number) {
    await cursoService.obtener(id_curso);
    const estudiante = await prisma.usuarios.findFirst({
      where: { id_usuario: id_estudiante, ...activo },
      include: { rol: true },
    });
    if (!estudiante || estudiante.rol.nombre_rol !== 'Estudiante') {
      throw new AppError('El usuario debe ser Estudiante', 422);
    }

    const existente = await cursoRepository.buscarAutorizacionVigente(id_curso, id_estudiante);
    if (existente) throw new AppError('El estudiante ya tiene autorización vigente', 409);

    return cursoRepository.crearAutorizacion({
      curso: { connect: { id_curso } },
      estudiante: { connect: { id_usuario: id_estudiante } },
      profesor_autorizador: { connect: { id_usuario: id_profesor } },
      autorizado: true,
      fecha_autorizacion: new Date(),
      creador: { connect: { id_usuario: id_profesor } },
    });
  },

  async listarCoordinadoresDisponibles(id_curso: number) {
    const curso = await cursoRepository.findById(id_curso);
    if (!curso) throw new AppError('Curso no encontrado', 404);

    const resultado = await cursoRepository.listarProfesoresCoordinadores(id_curso);
    const perfiles = resultado?.escuela?.perfiles_profesor ?? [];

    return perfiles.map((perfil) => ({
      id_profesor: perfil.id_usuario,
      nombres: perfil.usuario.nombres,
      apellidos: perfil.usuario.apellidos,
      email: perfil.usuario.email,
      codigo_docente: perfil.codigo_docente,
    }));
  },
};
