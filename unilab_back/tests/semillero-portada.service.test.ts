import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  semilleroRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));

import { semilleroPortadaService } from '../src/services/semillero-portada.service';

const file = { path: '/tmp/portada-abc.webp' } as Express.Multer.File;

describe('semilleroPortadaService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rechaza subida sin archivo', async () => {
    await expect(semilleroPortadaService.subir(1, undefined as unknown as Express.Multer.File)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('responde 404 si el semillero no existe', async () => {
    m.semilleroRepository.findById.mockResolvedValue(null);

    await expect(semilleroPortadaService.subir(1, file)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('guarda ruta y url pública al subir portada', async () => {
    m.semilleroRepository.findById.mockResolvedValue({ id_semillero: 1, foto_portada_ruta: null });
    m.semilleroRepository.update.mockResolvedValue({});

    const result = await semilleroPortadaService.subir(1, file);

    expect(result.url_foto_portada).toContain('/uploads/semilleros/1/');
    expect(m.semilleroRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        foto_portada_ruta: expect.stringContaining('/uploads/semilleros/1/'),
        url_foto_portada: expect.stringContaining('http'),
      }),
    );
  });

  it('eliminar responde 404 si no hay portada', async () => {
    m.semilleroRepository.findById.mockResolvedValue({ id_semillero: 1, foto_portada_ruta: null });

    await expect(semilleroPortadaService.eliminar(1)).rejects.toMatchObject({ statusCode: 404 });
  });
});
