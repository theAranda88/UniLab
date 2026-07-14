import { AppError } from '../utils/AppError';
import { escuelaRepository, cursoRepository } from '../models/escuela.repository';
import { proyectoRepository } from '../models/proyecto.repository';
import { proyectoImagenService } from './proyecto-imagen.service';

type ProyectoConImagenes = Awaited<ReturnType<typeof proyectoRepository.findMany>>[number];

function enriquecerProyectoPublico<T extends ProyectoConImagenes>(proyecto: T) {
  const imagenes = proyecto.imagenes?.length
    ? proyectoImagenService.mapImagenes(proyecto.imagenes)
    : [];
  return {
    ...proyecto,
    imagenes,
    url_imagen: imagenes[0]?.url ?? proyecto.url_imagen ?? null,
  };
}

export const publicoService = {
  async listarEscuelas() {
    const [escuelas, conteos] = await Promise.all([
      escuelaRepository.findMany(),
      proyectoRepository.countPublicadosPorEscuela(),
    ]);

    return escuelas.map(({ id_escuela, nombre_escuela }) => ({
      id_escuela,
      nombre_escuela,
      total_proyectos_publicados: conteos[id_escuela] ?? 0,
    }));
  },

  async listarCursos(id_escuela?: number) {
    if (id_escuela) {
      const escuela = await escuelaRepository.findById(id_escuela);
      if (!escuela) throw new AppError('Escuela no encontrada', 404);
    }
    return cursoRepository.findMany(id_escuela ? { id_escuela } : undefined);
  },

  listarProyectosPublicados(id_escuela?: number) {
    return proyectoRepository
      .findMany({
        estado_proyecto: 'publicado',
        ...(id_escuela
          ? {
              curso: {
                id_escuela,
              },
            }
          : {}),
      })
      .then((proyectos) => proyectos.map(enriquecerProyectoPublico));
  },

  async obtenerProyectoPublico(id: number) {
    const proyecto = await proyectoRepository.findById(id);
    if (!proyecto || proyecto.estado_proyecto !== 'publicado') {
      throw new AppError('Proyecto no encontrado', 404);
    }
    await proyectoRepository.registrarVista(id, null);
    const actualizado = await proyectoRepository.findById(id);
    if (!actualizado) throw new AppError('Proyecto no encontrado', 404);
    return enriquecerProyectoPublico(actualizado);
  },
};
