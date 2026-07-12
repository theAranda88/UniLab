import { AppError } from '../utils/AppError';
import { semilleroRepository } from '../models/semillero.repository';
import { escuelaRepository } from '../models/escuela.repository';
import { usuarioRepository } from '../models/usuario.repository';

export const semilleroService = {
  listar() {
    return semilleroRepository.findMany();
  },

  async obtener(id: number) {
    const semillero = await semilleroRepository.findById(id);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);
    return semillero;
  },

  async crear(data: {
    nombre_semillero: string;
    descripcion: string;
    id_escuela: number;
    id_profesor_lider: number;
    created_by: number;
  }) {
    const escuela = await escuelaRepository.findById(data.id_escuela);
    if (!escuela) throw new AppError('Escuela no encontrada', 404);

    const profesor = await usuarioRepository.findById(data.id_profesor_lider);
    if (!profesor || profesor.rol.nombre_rol !== 'Profesor') {
      throw new AppError('El líder debe ser un Profesor', 422);
    }

    const semillero = await semilleroRepository.create({
      nombre_semillero: data.nombre_semillero,
      descripcion: data.descripcion,
      escuela: { connect: { id_escuela: data.id_escuela } },
      profesor_lider: { connect: { id_usuario: data.id_profesor_lider } },
      creador: { connect: { id_usuario: data.created_by } },
    });

    await semilleroRepository.agregarProfesor({
      semillero: { connect: { id_semillero: semillero.id_semillero } },
      profesor: { connect: { id_usuario: data.id_profesor_lider } },
      es_lider: true,
      fecha_asignacion: new Date(),
      creador: { connect: { id_usuario: data.created_by } },
    });

    return semillero;
  },

  async actualizar(id: number, data: Partial<{ nombre_semillero: string; descripcion: string; activo: boolean }>) {
    await semilleroService.obtener(id);
    return semilleroRepository.update(id, data);
  },

  async eliminar(id: number) {
    await semilleroService.obtener(id);
    await semilleroRepository.softDelete(id);
  },

  async asignarProfesor(id_semillero: number, id_profesor: number, created_by: number, es_lider = false) {
    await semilleroService.obtener(id_semillero);
    const profesor = await usuarioRepository.findById(id_profesor);
    if (!profesor || profesor.rol.nombre_rol !== 'Profesor') {
      throw new AppError('Debe ser un Profesor', 422);
    }

    return semilleroRepository.agregarProfesor({
      semillero: { connect: { id_semillero } },
      profesor: { connect: { id_usuario: id_profesor } },
      es_lider,
      fecha_asignacion: new Date(),
      creador: { connect: { id_usuario: created_by } },
    });
  },

  async quitarProfesor(id_semillero: number, id_profesor: number) {
    await semilleroService.obtener(id_semillero);
    await semilleroRepository.quitarProfesor(id_semillero, id_profesor);
  },

  async solicitarMembresia(id_semillero: number, id_estudiante: number) {
    await semilleroService.obtener(id_semillero);
    const estudiante = await usuarioRepository.findById(id_estudiante);
    if (!estudiante || estudiante.rol.nombre_rol !== 'Estudiante') {
      throw new AppError('Debe ser un Estudiante', 422);
    }

    const existente = await semilleroRepository.buscarMembresia(id_semillero, id_estudiante);
    if (existente) throw new AppError('Ya existe solicitud o membresía', 409);

    return semilleroRepository.crearMembresia({
      semillero: { connect: { id_semillero } },
      estudiante: { connect: { id_usuario: id_estudiante } },
      estado_solicitud: 'pendiente',
      puede_publicar: false,
      creador: { connect: { id_usuario: id_estudiante } },
    });
  },

  async resolverMembresia(
    id_semillero: number,
    id_estudiante: number,
    id_profesor_lider: number,
    estado: 'aprobado' | 'rechazado',
  ) {
    const semillero = await semilleroService.obtener(id_semillero);
    if (semillero.id_profesor_lider !== id_profesor_lider) {
      throw new AppError('Solo el profesor líder puede resolver solicitudes', 403);
    }

    const membresia = await semilleroRepository.buscarMembresia(id_semillero, id_estudiante);
    if (!membresia) throw new AppError('Membresía no encontrada', 404);

    return semilleroRepository.actualizarMembresia(membresia.id_membresia, {
      estado_solicitud: estado,
      fecha_resolucion: new Date(),
    });
  },

  async autorizarPublicacion(id_semillero: number, id_estudiante: number, id_profesor_lider: number) {
    const semillero = await semilleroService.obtener(id_semillero);
    if (semillero.id_profesor_lider !== id_profesor_lider) {
      throw new AppError('Solo el profesor líder puede autorizar publicación', 403);
    }

    const membresia = await semilleroRepository.buscarMembresia(id_semillero, id_estudiante);
    if (!membresia || membresia.estado_solicitud !== 'aprobado') {
      throw new AppError('El estudiante debe tener membresía aprobada', 422);
    }

    return semilleroRepository.actualizarMembresia(membresia.id_membresia, {
      puede_publicar: true,
      fecha_autorizacion: new Date(),
      profesor_autorizador: { connect: { id_usuario: id_profesor_lider } },
    });
  },
};
