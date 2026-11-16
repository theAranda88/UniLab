import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  perfilRepository: {
    findPerfilPublico: vi.fn(),
    eventosAsistidos: vi.fn(),
    findFormacion: vi.fn(),
    actualizarFormacion: vi.fn(),
    eliminarFormacion: vi.fn(),
  },
  publicoService: { listarProyectosPublicados: vi.fn() },
}));

vi.mock('../src/models/perfil.repository', () => ({ perfilRepository: m.perfilRepository }));
vi.mock('../src/services/publico.service', () => ({ publicoService: m.publicoService }));

import { perfilService } from '../src/services/perfil.service';
import {
  actualizarMiPerfilSchema,
  autoresProyectoSchema,
  formacionSchema,
} from '../src/middlewares/validation/schemas';

const SEM = (id: number, nombre: string) => ({ id_semillero: id, nombre_semillero: nombre, id_escuela: 1 });

function usuario(extra: Record<string, unknown> = {}) {
  return {
    id_usuario: 7,
    nombres: 'Ana',
    apellidos: 'Ruiz',
    telefono: '3001112233',
    mostrar_telefono: false,
    titular: 'Desarrolladora web',
    biografia: null,
    especialidades: ['Angular'],
    fortalezas: [],
    url_linkedin: null,
    url_github: 'https://github.com/ana',
    url_portafolio: null,
    url_cvlac: null,
    url_orcid: null,
    url_google_scholar: null,
    url_researchgate: null,
    rol: { nombre_rol: 'Estudiante' },
    perfil_profesor: null,
    perfil_estudiante: { escuela: { id_escuela: 1, nombre_escuela: 'Software' } },
    perfil_coordinador: null,
    perfil_externo: null,
    formacion: [],
    semilleros_como_lider: [],
    semilleros_como_profesor: [],
    membresias_semillero: [],
    ...extra,
  };
}

describe('perfilService.perfilPublico', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.publicoService.listarProyectosPublicados.mockResolvedValue([]);
    m.perfilRepository.eventosAsistidos.mockResolvedValue([]);
  });

  it('responde 404 si el usuario no existe o está inactivo', async () => {
    m.perfilRepository.findPerfilPublico.mockResolvedValue(null);
    await expect(perfilService.perfilPublico(99)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('oculta el teléfono salvo que el usuario lo permita', async () => {
    m.perfilRepository.findPerfilPublico.mockResolvedValue(usuario());
    expect((await perfilService.perfilPublico(7)).telefono).toBeNull();

    m.perfilRepository.findPerfilPublico.mockResolvedValue(usuario({ mostrar_telefono: true }));
    expect((await perfilService.perfilPublico(7)).telefono).toBe('3001112233');
  });

  it('une semilleros sin duplicados y el rol de líder prevalece', async () => {
    m.perfilRepository.findPerfilPublico.mockResolvedValue(
      usuario({
        membresias_semillero: [{ semillero: SEM(2, 'Robótica') }],
        semilleros_como_profesor: [{ es_lider: false, semillero: SEM(1, 'IA') }],
        semilleros_como_lider: [SEM(1, 'IA')],
      }),
    );
    const p = await perfilService.perfilPublico(7);
    expect(p.semilleros).toEqual([
      { id_semillero: 1, nombre_semillero: 'IA', rol: 'lider' },
      { id_semillero: 2, nombre_semillero: 'Robótica', rol: 'miembro' },
    ]);
  });

  it('trae solo proyectos publicados donde participa y marca si es director', async () => {
    m.perfilRepository.findPerfilPublico.mockResolvedValue(usuario());
    m.publicoService.listarProyectosPublicados.mockResolvedValue([
      { id_proyecto: 1, coordinadores: [{ id_profesor: 7 }] },
      { id_proyecto: 2, coordinadores: [{ id_profesor: 3 }] },
    ]);
    const p = await perfilService.perfilPublico(7);
    expect(m.publicoService.listarProyectosPublicados).toHaveBeenCalledWith({ id_participante: 7 });
    expect(p.proyectos.map((x) => x.participacion)).toEqual(['director', 'autor']);
  });

  it('lista los eventos asistidos con jornadas asistidas sobre el total', async () => {
    m.perfilRepository.findPerfilPublico.mockResolvedValue(usuario());
    m.perfilRepository.eventosAsistidos.mockResolvedValue([
      { evento: { id_evento: 4, nombre_evento: 'Foro', _count: { jornadas: 2 } }, _count: { asistencias: 1 } },
    ]);
    const [ev] = (await perfilService.perfilPublico(7)).eventos;
    expect(ev).toMatchObject({ id_evento: 4, nombre_evento: 'Foro', total_jornadas: 2, jornadas_asistidas: 1 });
  });
});

describe('perfilService · formación', () => {
  beforeEach(() => vi.resetAllMocks());

  const datos = { titulo: 'Ingeniería', institucion: 'Uniautónoma', nivel: 'pregrado' };

  it('no permite editar ni borrar formación de otro usuario', async () => {
    m.perfilRepository.findFormacion.mockResolvedValue({ id_formacion: 3, id_usuario: 99 });
    await expect(perfilService.actualizarFormacion(7, 3, datos)).rejects.toMatchObject({ statusCode: 404 });
    await expect(perfilService.eliminarFormacion(7, 3)).rejects.toMatchObject({ statusCode: 404 });
    expect(m.perfilRepository.eliminarFormacion).not.toHaveBeenCalled();
  });

  it('edita la formación propia', async () => {
    m.perfilRepository.findFormacion.mockResolvedValue({ id_formacion: 3, id_usuario: 7 });
    await perfilService.actualizarFormacion(7, 3, datos);
    expect(m.perfilRepository.actualizarFormacion).toHaveBeenCalledWith(3, datos);
  });
});

describe('esquemas del perfil', () => {
  it('valida los dominios de las redes académicas', () => {
    expect(actualizarMiPerfilSchema.safeParse({ url_orcid: 'https://orcid.org/0000-0001' }).success).toBe(true);
    expect(actualizarMiPerfilSchema.safeParse({ url_orcid: 'https://evil.com/x' }).success).toBe(false);
    expect(
      actualizarMiPerfilSchema.safeParse({
        url_cvlac: 'https://scienti.minciencias.gov.co/cvlac/visualizador/generarCurriculoCv.do?cod_rh=1',
      }).success,
    ).toBe(true);
    expect(actualizarMiPerfilSchema.safeParse({ url_google_scholar: 'https://scholar.google.com/citations?user=x' }).success).toBe(true);
  });

  it('limpia las etiquetas repetidas y limita su cantidad', () => {
    const r = actualizarMiPerfilSchema.parse({ especialidades: ['IA', 'IA', ' Datos '] });
    expect(r.especialidades).toEqual(['IA', 'Datos']);
    expect(actualizarMiPerfilSchema.safeParse({ fortalezas: Array.from({ length: 16 }, (_, i) => `f${i}`) }).success).toBe(false);
  });

  it('la formación no admite fin anterior al inicio', () => {
    const base = { titulo: 'X', institucion: 'Y', nivel: 'curso' };
    expect(formacionSchema.safeParse({ ...base, anio_inicio: 2020, anio_fin: 2019 }).success).toBe(false);
    expect(formacionSchema.safeParse({ ...base, anio_inicio: 2020, anio_fin: null }).success).toBe(true);
  });

  it('máximo 9 coautores por proyecto', () => {
    expect(autoresProyectoSchema.safeParse({ ids_estudiantes: [1, 2, 3] }).success).toBe(true);
    expect(autoresProyectoSchema.safeParse({ ids_estudiantes: Array.from({ length: 10 }, (_, i) => i + 1) }).success).toBe(false);
  });
});
