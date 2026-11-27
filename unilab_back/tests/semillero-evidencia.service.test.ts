import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  semilleroRepository: { findById: vi.fn() },
  prisma: {
    semillero_evidencias: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));
vi.mock('../src/models/prisma.client', () => ({ prisma: m.prisma }));

import { semilleroEvidenciaService } from '../src/services/semillero-evidencia.service';

const file = { path: '/tmp/u.webp', originalname: 'f.webp', mimetype: 'image/webp' } as Express.Multer.File;

describe('semilleroEvidenciaService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.semilleroRepository.findById.mockResolvedValue({ id_semillero: 1 });
    m.prisma.$transaction.mockImplementation(async (fn: (tx: typeof m.prisma) => Promise<unknown>) =>
      fn(m.prisma),
    );
  });

  it('listar responde 404 si el semillero no existe', async () => {
    m.semilleroRepository.findById.mockResolvedValue(null);
    await expect(semilleroEvidenciaService.listar(1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('subir exige al menos un archivo', async () => {
    await expect(semilleroEvidenciaService.subir(1, 5, [])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('subir respeta el máximo de evidencias por semillero', async () => {
    m.prisma.semillero_evidencias.count.mockResolvedValue(10);

    await expect(semilleroEvidenciaService.subir(1, 5, [file])).rejects.toMatchObject({ statusCode: 422 });
  });

  it('subir crea registros y devuelve la galería ordenada', async () => {
    m.prisma.semillero_evidencias.count.mockResolvedValue(0);
    m.prisma.semillero_evidencias.findMany.mockResolvedValue([
      {
        id_evidencia: 1,
        id_semillero: 1,
        ruta_archivo: '/uploads/semilleros/1/evidencias/u.webp',
        nombre_original: 'f.webp',
        mime_type: 'image/webp',
        orden: 1,
      },
    ]);

    const result = await semilleroEvidenciaService.subir(1, 5, [file]);

    expect(m.prisma.semillero_evidencias.create).toHaveBeenCalled();
    expect(result[0].url).toContain('/uploads/semilleros/1/evidencias/');
  });

  it('eliminar responde 404 si la evidencia no existe', async () => {
    m.prisma.semillero_evidencias.findFirst.mockResolvedValue(null);

    await expect(semilleroEvidenciaService.eliminar(1, 9)).rejects.toMatchObject({ statusCode: 404 });
  });
});
