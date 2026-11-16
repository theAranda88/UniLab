import { prisma } from './prisma.client';
import { activo } from './base.repository';

const escuelaResumen = { select: { id_escuela: true, nombre_escuela: true } } as const;
const semilleroResumen = { select: { id_semillero: true, nombre_semillero: true, id_escuela: true } } as const;

export const perfilRepository = {
  listarFormacion(id_usuario: number) {
    return prisma.usuario_formacion.findMany({
      where: { id_usuario, ...activo },
      orderBy: [{ anio_inicio: { sort: 'desc', nulls: 'last' } }, { id_formacion: 'desc' }],
    });
  },

  findFormacion(id_formacion: number) {
    return prisma.usuario_formacion.findFirst({ where: { id_formacion, ...activo } });
  },

  crearFormacion(id_usuario: number, data: { titulo: string; institucion: string; nivel: string; anio_inicio?: number | null; anio_fin?: number | null }) {
    return prisma.usuario_formacion.create({
      data: { ...data, usuario: { connect: { id_usuario } }, creador: { connect: { id_usuario } } },
    });
  },

  actualizarFormacion(id_formacion: number, data: { titulo: string; institucion: string; nivel: string; anio_inicio?: number | null; anio_fin?: number | null }) {
    return prisma.usuario_formacion.update({ where: { id_formacion }, data });
  },

  eliminarFormacion(id_formacion: number) {
    return prisma.usuario_formacion.update({ where: { id_formacion }, data: { deleted_at: new Date() } });
  },

  /** Datos públicos del perfil: sin correo, documento ni credenciales. */
  findPerfilPublico(id_usuario: number) {
    return prisma.usuarios.findFirst({
      where: { id_usuario, ...activo, activo: true },
      select: {
        id_usuario: true,
        nombres: true,
        apellidos: true,
        telefono: true,
        mostrar_telefono: true,
        titular: true,
        biografia: true,
        especialidades: true,
        fortalezas: true,
        url_linkedin: true,
        url_github: true,
        url_portafolio: true,
        url_cvlac: true,
        url_orcid: true,
        url_google_scholar: true,
        url_researchgate: true,
        foto_ruta: true,
        rol: { select: { nombre_rol: true } },
        perfil_profesor: { where: activo, select: { escuela: escuelaResumen } },
        perfil_estudiante: { where: activo, select: { escuela: escuelaResumen } },
        perfil_coordinador: { where: activo, select: { cargo: true, dependencia: true, profesion: true } },
        perfil_externo: { where: activo, select: { institucion: true, ocupacion: true } },
        formacion: {
          where: activo,
          orderBy: [{ anio_inicio: { sort: 'desc', nulls: 'last' } }, { id_formacion: 'desc' }],
          select: { id_formacion: true, titulo: true, institucion: true, nivel: true, anio_inicio: true, anio_fin: true },
        },
        semilleros_como_lider: { where: { ...activo, activo: true }, ...semilleroResumen },
        semilleros_como_profesor: {
          where: { ...activo, semillero: { ...activo, activo: true } },
          select: { es_lider: true, semillero: semilleroResumen },
        },
        membresias_semillero: {
          where: { ...activo, estado_solicitud: 'aprobado', semillero: { ...activo, activo: true } },
          select: { semillero: semilleroResumen },
        },
      },
    });
  },

  /** Eventos en los que la persona registró asistencia al menos a una jornada. */
  eventosAsistidos(id_usuario: number) {
    return prisma.inscripciones.findMany({
      where: { id_usuario, ...activo, evento: activo, asistencias: { some: activo } },
      select: {
        evento: {
          select: {
            id_evento: true,
            nombre_evento: true,
            tipo_evento: true,
            fecha_inicio: true,
            fecha_fin: true,
            lugar: true,
            _count: { select: { jornadas: { where: activo } } },
          },
        },
        _count: { select: { asistencias: { where: activo } } },
      },
      orderBy: { evento: { fecha_inicio: 'desc' } },
    });
  },
};
