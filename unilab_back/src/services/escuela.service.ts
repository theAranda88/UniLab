import { AppError } from '../utils/AppError';
import { escuelaRepository, cursoRepository } from '../models/escuela.repository';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';

export const escuelaService = {
  listar() {
    return escuelaRepository.findMany();
  },

  async obtener(id: number) {
    const escuela = await escuelaRepository.findById(id);
    if (!escuela) throw new AppError('Escuela no encontrada', 404);
    return escuela;
  },

  crear(nombre_escuela: string, created_by: number) {
    return escuelaRepository.create({
      nombre_escuela,
      creador: { connect: { id_usuario: created_by } },
    });
  },

  async actualizar(id: number, nombre_escuela: string) {
    await escuelaService.obtener(id);
    return escuelaRepository.update(id, { nombre_escuela });
  },

  async eliminar(id: number) {
    await escuelaService.obtener(id);
    const ahora = new Date();
    // Cascada lógica: soft-delete escuela → cursos
    await prisma.$transaction([
      prisma.cursos.updateMany({
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
    return cursoRepository.update(id, {
      nombre_curso: data.nombre_curso,
      periodo_academico: data.periodo_academico,
      ...(data.id_escuela ? { escuela: { connect: { id_escuela: data.id_escuela } } } : {}),
    });
  },

  async eliminar(id: number) {
    await cursoService.obtener(id);
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
};
