import { AppError } from '../utils/AppError';
import { prisma } from '../models/prisma.client';
import { semilleroRepository } from '../models/semillero.repository';
import { escuelaRepository } from '../models/escuela.repository';
import { usuarioRepository } from '../models/usuario.repository';
import { configuracionService } from './configuracion.service';
import { urlFotoUsuario } from '../utils/uploadPaths';

async function validarProfesor(id_profesor: number, mensaje = 'Debe ser un Profesor') {
  const profesor = await usuarioRepository.findById(id_profesor);
  if (!profesor || profesor.rol.nombre_rol !== 'Profesor') {
    throw new AppError(mensaje, 422);
  }
  return profesor;
}

type RolProfesor = 'coordinador' | 'acompanante';
type RolEstudiante = 'integrante' | 'lider' | 'coordinador';

/** Los roles dentro del semillero los cambia el Administrador o el profesor líder de ese semillero. */
function exigirGestorRoles(semillero: { id_profesor_lider: number }, solicitante: { id_usuario: number; id_rol: string }) {
  if (solicitante.id_rol === 'Administrador') return;
  if (solicitante.id_rol === 'Profesor' && semillero.id_profesor_lider === solicitante.id_usuario) return;
  throw new AppError('Solo el administrador o el profesor líder pueden cambiar roles del semillero', 403);
}

export const semilleroService = {
  listar() {
    return semilleroRepository.findMany();
  },

  async obtener(id: number) {
    const semillero = await semilleroRepository.findById(id);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);
    return {
      ...semillero,
      profesores: semillero.profesores.map((p) => ({ ...p, profesor: { ...p.profesor, url_foto: urlFotoUsuario(p.profesor.foto_ruta) } })),
      miembros: semillero.miembros.map((m) => ({ ...m, estudiante: { ...m.estudiante, url_foto: urlFotoUsuario(m.estudiante.foto_ruta) } })),
    };
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

    await validarProfesor(data.id_profesor_lider, 'El líder debe ser un Profesor');

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
      rol: 'lider',
      fecha_asignacion: new Date(),
      creador: { connect: { id_usuario: data.created_by } },
    });

    return semilleroService.obtener(semillero.id_semillero);
  },

  async actualizar(
    id: number,
    data: Partial<{
      nombre_semillero: string;
      descripcion: string;
      activo: boolean;
      id_escuela: number;
      id_profesor_lider: number;
    }>,
    updated_by: number,
  ) {
    const actual = await semilleroService.obtener(id);
    const { id_escuela, id_profesor_lider, ...campos } = data;

    if (id_escuela !== undefined && id_escuela !== actual.id_escuela) {
      const escuela = await escuelaRepository.findById(id_escuela);
      if (!escuela) throw new AppError('Escuela no encontrada', 404);
    }

    const cambiaLider = id_profesor_lider !== undefined && id_profesor_lider !== actual.id_profesor_lider;
    if (cambiaLider) {
      await validarProfesor(id_profesor_lider, 'El líder debe ser un Profesor');
    }

    await semilleroRepository.update(id, {
      ...campos,
      ...(id_escuela !== undefined ? { escuela: { connect: { id_escuela } } } : {}),
      ...(cambiaLider ? { profesor_lider: { connect: { id_usuario: id_profesor_lider } } } : {}),
    });

    if (cambiaLider) {
      // El líder anterior sigue como profesor del semillero, pero sin marca de líder.
      await prisma.semillero_profesores.updateMany({
        where: { id_semillero: id, id_profesor: actual.id_profesor_lider, deleted_at: null },
        data: { es_lider: false, rol: 'acompanante' },
      });
      await semilleroService.asignarProfesor(id, id_profesor_lider, updated_by, true, true);
    }

    return semilleroService.obtener(id);
  },

  async eliminar(id: number) {
    await semilleroService.obtener(id);
    await semilleroRepository.softDelete(id);
  },

  /**
   * La tabla usa PK compuesta (semillero, profesor): si el profesor fue retirado antes,
   * se restaura el registro en lugar de crear uno nuevo.
   */
  async asignarProfesor(
    id_semillero: number,
    id_profesor: number,
    created_by: number,
    es_lider = false,
    permitirExistente = false,
    rolInicial: RolProfesor = 'acompanante',
  ) {
    await semilleroService.obtener(id_semillero);
    await validarProfesor(id_profesor);
    const rol = es_lider ? 'lider' : rolInicial;

    const clave = { id_semillero_id_profesor: { id_semillero, id_profesor } };
    const existente = await prisma.semillero_profesores.findUnique({ where: clave });

    if (existente && !existente.deleted_at) {
      if (!permitirExistente) throw new AppError('El profesor ya está asignado a este semillero', 409);
      return prisma.semillero_profesores.update({ where: clave, data: { es_lider, rol } });
    }

    if (existente) {
      return prisma.semillero_profesores.update({
        where: clave,
        data: { deleted_at: null, es_lider, rol, fecha_asignacion: new Date() },
      });
    }

    return semilleroRepository.agregarProfesor({
      semillero: { connect: { id_semillero } },
      profesor: { connect: { id_usuario: id_profesor } },
      es_lider,
      rol,
      fecha_asignacion: new Date(),
      creador: { connect: { id_usuario: created_by } },
    });
  },

  async quitarProfesor(id_semillero: number, id_profesor: number) {
    const semillero = await semilleroService.obtener(id_semillero);
    if (semillero.id_profesor_lider === id_profesor) {
      throw new AppError('No se puede retirar al profesor líder; asigne otro líder primero', 422);
    }
    const asignado = await semilleroRepository.buscarProfesor(id_semillero, id_profesor);
    if (!asignado) throw new AppError('El profesor no está asignado a este semillero', 404);
    await semilleroRepository.quitarProfesor(id_semillero, id_profesor);
  },

  /** Coordinador o acompañante; el líder se cambia desde los datos del semillero. */
  async cambiarRolProfesor(
    id_semillero: number,
    id_profesor: number,
    rol: RolProfesor,
    solicitante: { id_usuario: number; id_rol: string },
  ) {
    const semillero = await semilleroService.obtener(id_semillero);
    exigirGestorRoles(semillero, solicitante);
    if (semillero.id_profesor_lider === id_profesor) {
      throw new AppError('El rol del líder se cambia asignando otro líder al semillero', 422);
    }
    const asignado = await semilleroRepository.buscarProfesor(id_semillero, id_profesor);
    if (!asignado) throw new AppError('El profesor no está asignado a este semillero', 404);
    return semilleroRepository.actualizarProfesor(id_semillero, id_profesor, { rol });
  },

  /** Rol del estudiante en el semillero: integrante, líder o coordinador (solo miembros aprobados). */
  async cambiarRolMiembro(
    id_semillero: number,
    id_estudiante: number,
    rol: RolEstudiante,
    solicitante: { id_usuario: number; id_rol: string },
  ) {
    const semillero = await semilleroService.obtener(id_semillero);
    exigirGestorRoles(semillero, solicitante);
    const membresia = await semilleroRepository.buscarMembresia(id_semillero, id_estudiante);
    if (!membresia) throw new AppError('Membresía no encontrada', 404);
    if (membresia.estado_solicitud !== 'aprobado') {
      throw new AppError('Solo los integrantes aprobados pueden tener un rol', 422);
    }
    return semilleroRepository.actualizarMembresia(membresia.id_membresia, { rol });
  },

  async solicitarMembresia(id_semillero: number, id_estudiante: number) {
    if (!(await configuracionService.obtener('semilleros_solicitudes_abiertas'))) {
      throw new AppError('Las solicitudes a semilleros están cerradas temporalmente', 422);
    }
    const semillero = await semilleroService.obtener(id_semillero);
    if (!semillero.activo) throw new AppError('El semillero no está recibiendo solicitudes', 422);

    const estudiante = await usuarioRepository.findById(id_estudiante);
    if (!estudiante || estudiante.rol.nombre_rol !== 'Estudiante') {
      throw new AppError('Debe ser un Estudiante', 422);
    }

    const existente = await semilleroRepository.buscarMembresia(id_semillero, id_estudiante);
    if (existente) {
      // Tras un rechazo, el estudiante puede volver a postularse.
      if (existente.estado_solicitud === 'rechazado') {
        return semilleroRepository.actualizarMembresia(existente.id_membresia, {
          estado_solicitud: 'pendiente',
          fecha_resolucion: null,
        });
      }
      throw new AppError('Ya existe solicitud o membresía', 409);
    }

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
      // Un rechazo revoca cualquier permiso de publicación previo y el rol que tuviera.
      ...(estado === 'rechazado' ? { puede_publicar: false, rol: 'integrante' } : {}),
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
