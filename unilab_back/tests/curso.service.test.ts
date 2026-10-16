import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  escuelaRepository: { findById: vi.fn() },
  cursoRepository: { findById: vi.fn(), update: vi.fn(), softDelete: vi.fn() },
  prisma: { proyectos: { count: vi.fn() } },
}));

vi.mock('../src/models/escuela.repository', () => ({
  escuelaRepository: m.escuelaRepository,
  cursoRepository: m.cursoRepository,
}));
vi.mock('../src/models/prisma.client', () => ({ prisma: m.prisma }));

import { cursoService } from '../src/services/escuela.service';

describe('cursoService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.cursoRepository.findById.mockResolvedValue({ id_curso: 1, id_escuela: 2 });
  });

  it('no elimina un curso con proyectos activos', async () => {
    m.prisma.proyectos.count.mockResolvedValue(3);

    await expect(cursoService.eliminar(1)).rejects.toMatchObject({ statusCode: 422 });
    expect(m.cursoRepository.softDelete).not.toHaveBeenCalled();
  });

  it('elimina (soft-delete) un curso sin proyectos', async () => {
    m.prisma.proyectos.count.mockResolvedValue(0);

    await cursoService.eliminar(1);

    expect(m.cursoRepository.softDelete).toHaveBeenCalledWith(1);
  });

  it('valida que la escuela destino exista al mover un curso', async () => {
    m.escuelaRepository.findById.mockResolvedValue(null);

    await expect(cursoService.actualizar(1, { id_escuela: 99 })).rejects.toMatchObject({ statusCode: 404 });
    expect(m.cursoRepository.update).not.toHaveBeenCalled();
  });

  it('responde 404 si el curso no existe', async () => {
    m.cursoRepository.findById.mockResolvedValue(null);

    await expect(cursoService.obtener(5)).rejects.toMatchObject({ statusCode: 404 });
  });
});
