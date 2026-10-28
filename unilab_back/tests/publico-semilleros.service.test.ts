import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  semilleroRepository: {
    countPublicos: vi.fn(),
    findManyPublicos: vi.fn(),
    findPublicoById: vi.fn(),
  },
  escuelaRepository: { findById: vi.fn() },
  semilleroEvidenciaService: { mapEvidencias: vi.fn((evs: unknown[]) => evs) },
}));

vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));
vi.mock('../src/models/escuela.repository', () => ({ escuelaRepository: m.escuelaRepository }));
vi.mock('../src/services/semillero-evidencia.service', () => ({
  semilleroEvidenciaService: m.semilleroEvidenciaService,
}));

import { publicoService } from '../src/services/publico.service';

const SEMILLERO_LISTA = {
  id_semillero: 1,
  nombre_semillero: 'IA',
  descripcion: 'Desc',
  url_foto_portada: null,
  escuela: { id_escuela: 2, nombre_escuela: 'Software' },
  profesor_lider: { nombres: 'Ana', apellidos: 'López' },
  _count: { miembros: 5 },
};

describe('publicoService · semilleros', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('listarSemilleros valida que la escuela exista', async () => {
    m.escuelaRepository.findById.mockResolvedValue(null);

    await expect(
      publicoService.listarSemilleros({ id_escuela: 99, pagina: 1, limite: 12 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('listarSemilleros devuelve paginación', async () => {
    m.escuelaRepository.findById.mockResolvedValue({ id_escuela: 2 });
    m.semilleroRepository.countPublicos.mockResolvedValue(1);
    m.semilleroRepository.findManyPublicos.mockResolvedValue([SEMILLERO_LISTA]);

    const result = await publicoService.listarSemilleros({ id_escuela: 2, pagina: 1, limite: 12 });

    expect(result.data[0].total_miembros_aprobados).toBe(5);
    expect(result.paginacion.total).toBe(1);
    expect(result.data[0].lider).toEqual({ nombres: 'Ana', apellidos: 'López' });
  });

  it('obtenerSemilleroPublico responde 404 si no existe', async () => {
    m.semilleroRepository.findPublicoById.mockResolvedValue(null);

    await expect(publicoService.obtenerSemilleroPublico(1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('obtenerSemilleroPublico incluye evidencias mapeadas', async () => {
    m.semilleroRepository.findPublicoById.mockResolvedValue({
      ...SEMILLERO_LISTA,
      evidencias: [{ id_evidencia: 3, ruta_archivo: '/x', orden: 1, nombre_original: 'a.webp', mime_type: 'image/webp', id_semillero: 1 }],
    });
    m.semilleroEvidenciaService.mapEvidencias.mockReturnValue([
      { id_evidencia: 3, url: 'http://localhost/x', orden: 1, nombre_original: 'a.webp' },
    ]);

    const detalle = await publicoService.obtenerSemilleroPublico(1);

    expect(detalle.evidencias).toHaveLength(1);
    expect(detalle.evidencias[0].url).toContain('http');
  });
});
