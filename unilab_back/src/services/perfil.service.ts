import { AppError } from '../utils/AppError';
import { perfilRepository } from '../models/perfil.repository';
import { publicoService } from './publico.service';
import { urlPublicaImagen } from '../utils/uploadPaths';
import { rolVisibleEstudiante, rolVisibleProfesor, unirSemillerosConRol } from '../utils/rolSemillero';

type DatosFormacion = {
  titulo: string;
  institucion: string;
  nivel: string;
  anio_inicio?: number | null;
  anio_fin?: number | null;
};

async function formacionPropia(id_formacion: number, id_usuario: number) {
  const formacion = await perfilRepository.findFormacion(id_formacion);
  if (!formacion || formacion.id_usuario !== id_usuario) throw new AppError('Formación no encontrada', 404);
  return formacion;
}

export const perfilService = {
  listarFormacion(id_usuario: number) {
    return perfilRepository.listarFormacion(id_usuario);
  },

  crearFormacion(id_usuario: number, data: DatosFormacion) {
    return perfilRepository.crearFormacion(id_usuario, data);
  },

  async actualizarFormacion(id_usuario: number, id_formacion: number, data: DatosFormacion) {
    await formacionPropia(id_formacion, id_usuario);
    return perfilRepository.actualizarFormacion(id_formacion, data);
  },

  async eliminarFormacion(id_usuario: number, id_formacion: number) {
    await formacionPropia(id_formacion, id_usuario);
    await perfilRepository.eliminarFormacion(id_formacion);
  },

  /**
   * Perfil público tipo CvLAC. Lo que la persona escribe (titular, biografía, enlaces, formación) se
   * muestra tal cual; semilleros, proyectos publicados y eventos asistidos salen de la plataforma y
   * no se pueden editar. El teléfono solo aparece si el usuario lo autorizó.
   */
  async perfilPublico(id_usuario: number) {
    const u = await perfilRepository.findPerfilPublico(id_usuario);
    if (!u) throw new AppError('Perfil no encontrado', 404);

    const semilleros = unirSemillerosConRol([
      ...u.membresias_semillero.map((m) => ({ semillero: m.semillero, rol: rolVisibleEstudiante(m.rol) })),
      ...u.semilleros_como_profesor.map((p) => ({ semillero: p.semillero, rol: rolVisibleProfesor(p) })),
      ...u.semilleros_como_lider.map((s) => ({ semillero: s, rol: 'lider' as const })),
    ]).map(({ semillero, rol }) => ({ id_semillero: semillero.id_semillero, nombre_semillero: semillero.nombre_semillero, rol }));

    const [proyectos, inscripciones] = await Promise.all([
      publicoService.listarProyectosPublicados({ id_participante: id_usuario }),
      perfilRepository.eventosAsistidos(id_usuario),
    ]);

    const escuela = u.perfil_profesor?.escuela ?? u.perfil_estudiante?.escuela ?? null;

    return {
      id_usuario: u.id_usuario,
      nombres: u.nombres,
      apellidos: u.apellidos,
      rol: u.rol.nombre_rol,
      url_foto: u.foto_ruta ? urlPublicaImagen(u.foto_ruta) : null,
      titular: u.titular,
      biografia: u.biografia,
      especialidades: u.especialidades,
      fortalezas: u.fortalezas,
      telefono: u.mostrar_telefono ? u.telefono : null,
      escuelas: escuela ? [escuela] : [],
      cargo: u.perfil_coordinador?.cargo ?? null,
      dependencia: u.perfil_coordinador?.dependencia ?? null,
      profesion: u.perfil_coordinador?.profesion ?? null,
      institucion: u.perfil_externo?.institucion ?? null,
      ocupacion: u.perfil_externo?.ocupacion ?? null,
      redes: {
        linkedin: u.url_linkedin,
        github: u.url_github,
        portafolio: u.url_portafolio,
        cvlac: u.url_cvlac,
        orcid: u.url_orcid,
        google_scholar: u.url_google_scholar,
        researchgate: u.url_researchgate,
      },
      formacion: u.formacion,
      semilleros,
      proyectos: proyectos.map((p) => ({
        ...p,
        participacion: p.coordinadores?.some((c) => c.id_profesor === id_usuario) ? 'director' : 'autor',
      })),
      eventos: inscripciones.map((i) => ({
        ...i.evento,
        total_jornadas: i.evento._count.jornadas,
        jornadas_asistidas: i._count.asistencias,
        _count: undefined,
      })),
    };
  },
};
