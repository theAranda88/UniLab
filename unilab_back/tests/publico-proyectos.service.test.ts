import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  proyectoRepository: { findMany: vi.fn(), calificacionesPorProyecto: vi.fn() },
  escuelaRepository: { findById: vi.fn() },
  semilleroRepository: { findPublicoById: vi.fn() },
  proyectoImagenService: { mapImagenes: vi.fn((imgs: unknown[]) => imgs) },
}));

vi.mock('../src/models/proyecto.repository', () => ({ proyectoRepository: m.proyectoRepository }));
vi.mock('../src/models/escuela.repository', () => ({ escuelaRepository: m.escuelaRepository }));
vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));
vi.mock('../src/services/proyecto-imagen.service', () => ({
  proyectoImagenService: m.proyectoImagenService,
}));

import { publicoService } from '../src/services/publico.service';

const PROYECTO = {
  id_proyecto: 10,
  titulo: 'Demo',
  estado_proyecto: 'publicado',
  id_semillero: 1,
  imagenes: [],
  url_imagen: null,
};

describe('publicoService · proyectos públicos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.proyectoRepository.calificacionesPorProyecto.mockResolvedValue({});
  });

  it('listarProyectosPublicados valida escuela', async () => {
    m.escuelaRepository.findById.mockResolvedValue(null);

    await expect(
      publicoService.listarProyectosPublicados({ id_escuela: 99, sin_semillero: true }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('listarProyectosPublicados sin semillero filtra id_semillero null', async () => {
    m.escuelaRepository.findById.mockResolvedValue({ id_escuela: 2 });
    m.proyectoRepository.findMany.mockResolvedValue([PROYECTO]);

    await publicoService.listarProyectosPublicados({ id_escuela: 2, sin_semillero: true });

    expect(m.proyectoRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        estado_proyecto: 'publicado',
        id_semillero: null,
        curso: { id_escuela: 2 },
      }),
    );
  });

  it('listarProyectosPublicados por semillero exige semillero público activo', async () => {
    m.semilleroRepository.findPublicoById.mockResolvedValue(null);

    await expect(publicoService.listarProyectosPublicados({ id_semillero: 1 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('listarProyectosPublicados por semillero filtra id_semillero', async () => {
    m.semilleroRepository.findPublicoById.mockResolvedValue({ id_semillero: 1 });
    m.proyectoRepository.findMany.mockResolvedValue([PROYECTO]);

    const listado = await publicoService.listarProyectosPublicados({ id_semillero: 1 });

    expect(m.proyectoRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ id_semillero: 1, estado_proyecto: 'publicado' }),
    );
    expect(listado).toHaveLength(1);
  });

  it('expone la calificación de cada proyecto (null si no tiene votos)', async () => {
    m.proyectoRepository.findMany.mockResolvedValue([
      { ...PROYECTO, id_proyecto: 1, contador_vistas: 0 },
      { ...PROYECTO, id_proyecto: 2, contador_vistas: 0 },
    ]);
    m.proyectoRepository.calificacionesPorProyecto.mockResolvedValue({ 1: { promedio: 4.333, total: 3 } });

    const [a, b] = await publicoService.listarProyectosPublicados();

    expect(a.calificacion).toEqual({ promedio: 4.3, total: 3 });
    expect(b.calificacion).toEqual({ promedio: null, total: 0 });
  });

  it('orden valorados: promedio, luego votos, luego vistas; sin votos al final; respeta el límite', async () => {
    m.proyectoRepository.findMany.mockResolvedValue([
      { ...PROYECTO, id_proyecto: 1, contador_vistas: 500 },
      { ...PROYECTO, id_proyecto: 2, contador_vistas: 1 },
      { ...PROYECTO, id_proyecto: 3, contador_vistas: 1 },
      { ...PROYECTO, id_proyecto: 4, contador_vistas: 9 },
    ]);
    m.proyectoRepository.calificacionesPorProyecto.mockResolvedValue({
      2: { promedio: 4, total: 2 },
      3: { promedio: 4, total: 5 },
      4: { promedio: 5, total: 1 },
    });

    const lista = await publicoService.listarProyectosPublicados({ orden: 'valorados' });
    expect(lista.map((p) => p.id_proyecto)).toEqual([4, 3, 2, 1]);

    const top = await publicoService.listarProyectosPublicados({ orden: 'valorados', limite: 2 });
    expect(top.map((p) => p.id_proyecto)).toEqual([4, 3]);
  });
});
