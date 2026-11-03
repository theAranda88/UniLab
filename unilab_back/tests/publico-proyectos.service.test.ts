import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  proyectoRepository: { findMany: vi.fn() },
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
});
