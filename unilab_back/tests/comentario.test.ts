import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  proyectoRepository: {
    findComentarioById: vi.fn(),
    softDeleteComentario: vi.fn(),
  },
}));

vi.mock('../src/models/proyecto.repository', () => ({ proyectoRepository: m.proyectoRepository }));
vi.mock('../src/models/escuela.repository', () => ({ cursoRepository: {} }));
vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: {} }));
vi.mock('../src/models/prisma.client', () => ({ prisma: {} }));

import { proyectoService } from '../src/services/proyecto.service';

const COMENTARIO = { id_comentario: 7, id_proyecto: 1, id_usuario: 20 };

describe('proyectoService.eliminarComentario', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.proyectoRepository.findComentarioById.mockResolvedValue(COMENTARIO);
  });

  it('el autor puede eliminar su comentario', async () => {
    await proyectoService.eliminarComentario(7, 'Estudiante', 20);
    expect(m.proyectoRepository.softDeleteComentario).toHaveBeenCalledWith(7);
  });

  it('el administrador puede eliminar cualquier comentario', async () => {
    await proyectoService.eliminarComentario(7, 'Administrador', 1);
    expect(m.proyectoRepository.softDeleteComentario).toHaveBeenCalledWith(7);
  });

  it('otro usuario recibe 403, aunque sea Coordinador', async () => {
    await expect(proyectoService.eliminarComentario(7, 'Coordinador', 2)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(m.proyectoRepository.softDeleteComentario).not.toHaveBeenCalled();
  });

  it('responde 404 si el comentario no existe o ya fue eliminado', async () => {
    m.proyectoRepository.findComentarioById.mockResolvedValue(null);

    await expect(proyectoService.eliminarComentario(99, 'Administrador', 1)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
