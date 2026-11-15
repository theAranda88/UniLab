import { AppError } from '../utils/AppError';
import { escuelaRepository, cursoRepository } from '../models/escuela.repository';
import { proyectoRepository } from '../models/proyecto.repository';
import { semilleroRepository } from '../models/semillero.repository';
import { proyectoImagenService } from './proyecto-imagen.service';
import { escuelaImagenService } from './escuela-imagen.service';
import { semilleroEvidenciaService } from './semillero-evidencia.service';
import { eventoService } from './evento.service';
import type { Prisma } from '@prisma/client';
import { urlPublicaImagen } from '../utils/uploadPaths';

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

/** Añade a cada proyecto su calificación pública: promedio redondeado a un decimal y número de votos. */
async function conCalificacion<T extends { id_proyecto: number }>(proyectos: T[]) {
  const calificaciones = await proyectoRepository.calificacionesPorProyecto(proyectos.map((p) => p.id_proyecto));
  return proyectos.map((p) => {
    const c = calificaciones[p.id_proyecto];
    return {
      ...p,
      calificacion: c ? { promedio: Math.round(c.promedio * 10) / 10, total: c.total } : { promedio: null, total: 0 },
    };
  });
}

/** Mejor valorados primero; a igual promedio, más votos y luego más vistas. Los no calificados van al final. */
function compararValoracion(
  a: { calificacion: { promedio: number | null; total: number }; contador_vistas: number },
  b: { calificacion: { promedio: number | null; total: number }; contador_vistas: number },
) {
  return (
    (b.calificacion.promedio ?? -1) - (a.calificacion.promedio ?? -1) ||
    b.calificacion.total - a.calificacion.total ||
    b.contador_vistas - a.contador_vistas
  );
}

type SemilleroPublicoRow = Awaited<ReturnType<typeof semilleroRepository.findManyPublicos>>[number];
type SemilleroPublicoDetalleRow = NonNullable<Awaited<ReturnType<typeof semilleroRepository.findPublicoById>>>;

function mapSemilleroPublicoResumen(semillero: SemilleroPublicoRow | SemilleroPublicoDetalleRow) {
  const primeraEvidencia =
    'evidencias' in semillero && semillero.evidencias?.length
      ? semillero.evidencias[0]
      : null;
  const urlPreviewEvidencia = primeraEvidencia
    ? urlPublicaImagen(primeraEvidencia.ruta_archivo)
    : null;

  return {
    id_semillero: semillero.id_semillero,
    nombre_semillero: semillero.nombre_semillero,
    descripcion: semillero.descripcion,
    url_foto_portada: semillero.url_foto_portada,
    url_imagen_destacada: semillero.url_foto_portada ?? urlPreviewEvidencia,
    escuela: semillero.escuela,
    lider: semillero.profesor_lider,
    total_miembros_aprobados: semillero._count.miembros,
    total_proyectos_publicados: semillero._count.proyectos,
  };
}

export const publicoService = {
  async listarEscuelas() {
    const [escuelas, conteos, semilleros] = await Promise.all([
      escuelaRepository.findMany(),
      proyectoRepository.countPublicadosPorEscuela(),
      semilleroRepository.countPublicosPorEscuela(),
    ]);

    return escuelas.map(({ id_escuela, nombre_escuela, descripcion, color, icono, imagenes }) => ({
      id_escuela,
      nombre_escuela,
      descripcion,
      color,
      icono,
      imagenes: escuelaImagenService.mapImagenes(imagenes).map(({ id_imagen, url, orden }) => ({
        id_imagen,
        url,
        orden,
      })),
      total_proyectos_publicados: conteos[id_escuela] ?? 0,
      total_semilleros: semilleros[id_escuela] ?? 0,
    }));
  },

  async listarCursos(id_escuela?: number) {
    if (id_escuela) {
      const escuela = await escuelaRepository.findById(id_escuela);
      if (!escuela) throw new AppError('Escuela no encontrada', 404);
    }
    return cursoRepository.findMany(id_escuela ? { id_escuela } : undefined);
  },

  async listarProyectosPublicados(params?: {
    id_escuela?: number;
    id_semillero?: number;
    sin_semillero?: boolean;
    orden?: 'recientes' | 'valorados';
    limite?: number;
  }) {
    if (params?.id_escuela !== undefined) {
      const escuela = await escuelaRepository.findById(params.id_escuela);
      if (!escuela) throw new AppError('Escuela no encontrada', 404);
    }

    if (params?.id_semillero !== undefined) {
      const semillero = await semilleroRepository.findPublicoById(params.id_semillero);
      if (!semillero) throw new AppError('Semillero no encontrado', 404);
    }

    const where: Prisma.proyectosWhereInput = {
      estado_proyecto: 'publicado',
    };

    if (params?.id_semillero !== undefined) {
      where.id_semillero = params.id_semillero;
    } else if (params?.sin_semillero) {
      where.id_semillero = null;
      if (params.id_escuela !== undefined) {
        where.curso = { id_escuela: params.id_escuela };
      }
    } else if (params?.id_escuela !== undefined) {
      where.curso = { id_escuela: params.id_escuela };
    }

    const proyectos = await conCalificacion((await proyectoRepository.findMany(where)).map(enriquecerProyectoPublico));
    if (params?.orden === 'valorados') proyectos.sort(compararValoracion);
    return params?.limite ? proyectos.slice(0, params.limite) : proyectos;
  },

  async obtenerProyectoPublico(id: number) {
    const proyecto = await proyectoRepository.findById(id);
    if (!proyecto || proyecto.estado_proyecto !== 'publicado') {
      throw new AppError('Proyecto no encontrado', 404);
    }
    await proyectoRepository.registrarVista(id, null);
    const actualizado = await proyectoRepository.findById(id);
    if (!actualizado) throw new AppError('Proyecto no encontrado', 404);
    const [conNota] = await conCalificacion([enriquecerProyectoPublico(actualizado)]);
    return conNota;
  },

  listarEventosActivos() {
    return eventoService.listarPublicos();
  },

  obtenerEventoActivo(id: number) {
    return eventoService.obtenerPublico(id);
  },

  inscribirEvento(
    id_evento: number,
    data: {
      nombre_completo: string;
      documento_identidad: string;
      email: string;
      telefono: string;
      institucion?: string;
      genero: string;
    },
  ) {
    return eventoService.inscribirPublico(id_evento, data);
  },

  consultarInscripcionEvento(id_evento: number, documento_identidad: string) {
    return eventoService.obtenerInscripcionPorDocumento(id_evento, documento_identidad);
  },

  registrarAsistenciaEvento(codigo_qr: string, documento_identidad: string) {
    return eventoService.registrarAsistenciaPublica(codigo_qr, documento_identidad);
  },

  async listarSemilleros(params: { id_escuela?: number; busqueda?: string; pagina: number; limite: number }) {
    if (params.id_escuela !== undefined) {
      const escuela = await escuelaRepository.findById(params.id_escuela);
      if (!escuela) throw new AppError('Escuela no encontrada', 404);
    }

    const filtro = { id_escuela: params.id_escuela, busqueda: params.busqueda || undefined };
    const total = await semilleroRepository.countPublicos(filtro);
    const skip = (params.pagina - 1) * params.limite;
    const semilleros = await semilleroRepository.findManyPublicos({
      ...filtro,
      skip,
      take: params.limite,
    });

    return {
      data: semilleros.map(mapSemilleroPublicoResumen),
      paginacion: {
        pagina: params.pagina,
        limite: params.limite,
        total,
        total_paginas: total === 0 ? 0 : Math.ceil(total / params.limite),
      },
    };
  },

  async obtenerSemilleroPublico(id: number) {
    const semillero = await semilleroRepository.findPublicoById(id);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);

    const evidencias = semilleroEvidenciaService
      .mapEvidencias(semillero.evidencias)
      .map(({ id_evidencia, url, orden, nombre_original }) => ({
        id_evidencia,
        url,
        orden,
        nombre_original,
      }));

    const proyectos = await this.listarProyectosPublicados({ id_semillero: id });

    return {
      ...mapSemilleroPublicoResumen(semillero),
      evidencias,
      proyectos,
    };
  },
};
