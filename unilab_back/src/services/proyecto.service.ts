import { AppError } from '../utils/AppError';
import { proyectoRepository } from '../models/proyecto.repository';
import { cursoRepository } from '../models/escuela.repository';
import { semilleroRepository } from '../models/semillero.repository';
import { proyectoImagenService } from './proyecto-imagen.service';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';

const TRANSICIONES: Record<string, string[]> = {
  borrador: ['en_revision'],
  en_revision: ['aprobado', 'rechazado', 'publicado'],
  aprobado: ['publicado'],
  publicado: [],
  rechazado: [],
};

type ProyectoConRelaciones = NonNullable<Awaited<ReturnType<typeof proyectoRepository.findById>>>;

function enriquecerProyecto(proyecto: ProyectoConRelaciones) {
  const imagenes = proyecto.imagenes?.length
    ? proyectoImagenService.mapImagenes(proyecto.imagenes)
    : [];

  return {
    ...proyecto,
    imagenes,
    url_imagen: imagenes[0]?.url ?? proyecto.url_imagen ?? null,
  };
}

async function obtenerProyectoEnriquecido(id: number) {
  const proyecto = await proyectoRepository.findById(id);
  if (!proyecto) throw new AppError('Proyecto no encontrado', 404);
  return enriquecerProyecto(proyecto);
}

async function resolverProfesorCoordinador(
  id_curso: number,
  id_estudiante: number,
  id_semillero?: number,
  id_profesor_elegido?: number,
): Promise<number> {
  const autorizadoCurso = await cursoRepository.buscarAutorizacionVigente(
    id_curso,
    id_estudiante,
  );
  if (autorizadoCurso) return autorizadoCurso.id_profesor_autorizador;

  if (id_semillero) {
    const membresia = await semilleroRepository.membresiaConPublicacion(
      id_semillero,
      id_estudiante,
    );
    if (membresia?.id_profesor_autorizador) return membresia.id_profesor_autorizador;

    const semillero = await semilleroRepository.findById(id_semillero);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);
    return semillero.id_profesor_lider;
  }

  if (!id_profesor_elegido) {
    throw new AppError('Debe seleccionar un profesor coordinador', 422);
  }

  const valido = await cursoRepository.profesorPerteneceEscuelaCurso(
    id_profesor_elegido,
    id_curso,
  );
  if (!valido) {
    throw new AppError('El profesor seleccionado no pertenece a la escuela del curso', 422);
  }

  return id_profesor_elegido;
}

export const proyectoService = {
  async listar(rol: string, id_usuario: number) {
    let proyectos;

    if (rol === 'Administrador' || rol === 'Coordinador') {
      proyectos = await proyectoRepository.findMany();
    } else if (rol === 'Profesor') {
      proyectos = await proyectoRepository.findMany({
        OR: [
          { coordinadores: { some: { id_profesor: id_usuario, ...activo } } },
          {
            semillero: {
              id_profesor_lider: id_usuario,
              ...activo,
            },
          },
          { estado_proyecto: 'publicado' },
        ],
      });
    } else if (rol === 'Estudiante') {
      proyectos = await proyectoRepository.findMany({
        OR: [
          { id_estudiante_creador: id_usuario },
          { estado_proyecto: 'publicado' },
        ],
      });
    } else {
      proyectos = await proyectoRepository.findMany({ estado_proyecto: 'publicado' });
    }

    return proyectos.map(enriquecerProyecto);
  },

  async obtener(id: number, id_usuario?: number) {
    const proyecto = await proyectoRepository.findById(id);
    if (!proyecto) throw new AppError('Proyecto no encontrado', 404);
    await proyectoRepository.registrarVista(id, id_usuario ?? null);
    return obtenerProyectoEnriquecido(id);
  },

  async crear(data: {
    id_estudiante: number;
    id_curso: number;
    id_semillero?: number;
    id_profesor_coordinador?: number;
    titulo: string;
    descripcion: string;
    tipo_proyecto: string;
    url_aplicativo: string;
    url_imagen?: string;
    url_apk?: string;
    url_youtube?: string;
    url_spotify?: string;
  }) {
    const id_profesor_autorizador = await resolverProfesorCoordinador(
      data.id_curso,
      data.id_estudiante,
      data.id_semillero,
      data.id_profesor_coordinador,
    );

    const proyecto = await prisma.$transaction(async (tx) => {
      const creado = await tx.proyectos.create({
        data: {
          titulo: data.titulo,
          descripcion: data.descripcion,
          tipo_proyecto: data.tipo_proyecto,
          url_aplicativo: data.url_aplicativo,
          url_imagen: data.url_imagen ?? null,
          url_apk: data.url_apk,
          url_youtube: data.url_youtube,
          url_spotify: data.url_spotify,
          estado_proyecto: 'borrador',
          contador_vistas: 0,
          curso: { connect: { id_curso: data.id_curso } },
          ...(data.id_semillero ? { semillero: { connect: { id_semillero: data.id_semillero } } } : {}),
          estudiante_creador: { connect: { id_usuario: data.id_estudiante } },
          creador: { connect: { id_usuario: data.id_estudiante } },
        },
      });

      await tx.proyecto_autores.create({
        data: {
          id_proyecto: creado.id_proyecto,
          id_estudiante: data.id_estudiante,
          rol_autor: 'principal',
          created_by: data.id_estudiante,
        },
      });

      await tx.proyecto_coordinadores.create({
        data: {
          id_proyecto: creado.id_proyecto,
          id_profesor: id_profesor_autorizador,
          created_by: id_profesor_autorizador,
        },
      });

      return creado;
    });

    return obtenerProyectoEnriquecido(proyecto.id_proyecto);
  },

  async actualizar(id: number, rol: string, id_usuario: number, data: Record<string, unknown>) {
    await verificarPermisoGestion(id, rol, id_usuario);
    await proyectoRepository.update(id, {
      titulo: data.titulo as string | undefined,
      descripcion: data.descripcion as string | undefined,
      tipo_proyecto: data.tipo_proyecto as string | undefined,
      url_aplicativo: data.url_aplicativo as string | undefined,
      url_imagen: data.url_imagen as string | undefined,
      url_apk: data.url_apk as string | undefined,
      url_youtube: data.url_youtube as string | undefined,
      url_spotify: data.url_spotify as string | undefined,
    });
    return obtenerProyectoEnriquecido(id);
  },

  async eliminar(id: number, rol: string, id_usuario: number) {
    await verificarPermisoGestion(id, rol, id_usuario);
    await proyectoRepository.softDelete(id);
  },

  async cambiarEstado(id: number, rol: string, id_usuario: number, nuevoEstado: string) {
    const proyecto = await proyectoRepository.findById(id);
    if (!proyecto) throw new AppError('Proyecto no encontrado', 404);

    const permitidos = TRANSICIONES[proyecto.estado_proyecto] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      throw new AppError(
        `Transición no permitida: ${proyecto.estado_proyecto} → ${nuevoEstado}`,
        422,
      );
    }

    if (nuevoEstado === 'en_revision') {
      if (proyecto.id_estudiante_creador !== id_usuario) {
        throw new AppError('Solo el creador puede enviar a revisión', 403);
      }
      const totalImagenes = await proyectoImagenService.contarActivas(id);
      if (totalImagenes < 1 && !proyecto.url_imagen?.trim()) {
        throw new AppError(
          'Debe subir al menos una imagen del proyecto antes de enviar a revisión',
          422,
        );
      }
    } else {
      await verificarPermisoGestion(id, rol, id_usuario);
    }

    await proyectoRepository.update(id, {
      estado_proyecto: nuevoEstado,
      ...(nuevoEstado === 'publicado' || nuevoEstado === 'aprobado'
        ? { id_aprobador: id_usuario }
        : {}),
      ...(nuevoEstado === 'publicado' ? { fecha_publicacion: new Date() } : {}),
    });

    return obtenerProyectoEnriquecido(id);
  },

  async comentar(id_proyecto: number, id_usuario: number, contenido: string, id_padre?: number) {
    const proyecto = await proyectoRepository.findById(id_proyecto);
    if (!proyecto) throw new AppError('Proyecto no encontrado', 404);

    if (id_padre) {
      const padre = await prisma.comentarios.findFirst({
        where: { id_comentario: id_padre, id_proyecto, ...activo },
      });
      if (!padre) throw new AppError('Comentario padre no encontrado', 404);
    }

    return proyectoRepository.crearComentario({
      contenido,
      fecha_comentario: new Date(),
      proyecto: { connect: { id_proyecto } },
      usuario: { connect: { id_usuario } },
      ...(id_padre ? { comentario_padre: { connect: { id_comentario: id_padre } } } : {}),
      creador: { connect: { id_usuario } },
    });
  },

  async calificar(id_proyecto: number, id_usuario: number, puntuacion: number) {
    const proyecto = await proyectoRepository.findById(id_proyecto);
    if (!proyecto) throw new AppError('Proyecto no encontrado', 404);

    const existente = await prisma.calificaciones.findFirst({
      where: { id_proyecto, id_usuario, ...activo },
    });

    if (existente) {
      return prisma.calificaciones.update({
        where: { id_calificacion: existente.id_calificacion },
        data: { puntuacion },
      });
    }

    return prisma.calificaciones.create({
      data: {
        id_proyecto,
        id_usuario,
        puntuacion,
        created_by: id_usuario,
      },
    });
  },
};

async function verificarPermisoGestion(id_proyecto: number, rol: string, id_usuario: number) {
  const proyecto = await proyectoRepository.findById(id_proyecto);
  if (!proyecto) throw new AppError('Proyecto no encontrado', 404);

  if (rol === 'Administrador' || rol === 'Coordinador') return;

  if (rol === 'Estudiante') {
    if (
      proyecto.id_estudiante_creador === id_usuario &&
      proyecto.estado_proyecto !== 'publicado'
    ) {
      return;
    }
    throw new AppError('Sin permiso para gestionar este proyecto', 403);
  }

  if (rol === 'Profesor') {
    const esCoord = await proyectoRepository.esCoordinador(id_proyecto, id_usuario);
    if (esCoord) return;

    if (proyecto.id_semillero) {
      const semillero = await semilleroRepository.findById(proyecto.id_semillero);
      if (semillero?.id_profesor_lider === id_usuario) return;
    }
  }

  throw new AppError('Sin permiso para gestionar este proyecto', 403);
}
