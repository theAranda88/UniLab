import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  escuelaRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findEncargadoValido: vi.fn(),
  },
  prisma: {
    escuela_imagenes: { count: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
  unlink: vi.fn(),
}));

vi.mock('../src/models/escuela.repository', () => ({
  escuelaRepository: m.escuelaRepository,
  cursoRepository: {},
}));
vi.mock('../src/models/prisma.client', () => ({ prisma: m.prisma }));
vi.mock('fs', () => ({ default: { unlink: m.unlink } }));

import { escuelaService } from '../src/services/escuela.service';
import { escuelaImagenService } from '../src/services/escuela-imagen.service';

function escuela(extra: Record<string, unknown> = {}) {
  return {
    id_escuela: 1,
    nombre_escuela: 'Software',
    descripcion: null,
    color: null,
    icono: null,
    id_encargado: null,
    encargado: null,
    cursos: [],
    imagenes: [],
    ...extra,
  };
}

function archivo(nombre: string) {
  return { path: `/tmp/${nombre}`, originalname: nombre, mimetype: 'image/png' } as Express.Multer.File;
}

describe('escuelaService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.escuelaRepository.findById.mockResolvedValue(escuela());
    m.escuelaRepository.create.mockResolvedValue(escuela());
    m.escuelaRepository.update.mockResolvedValue(escuela());
  });

  it('crea la escuela con descripción, color, ícono y encargado', async () => {
    m.escuelaRepository.findEncargadoValido.mockResolvedValue({ id_usuario: 10 });

    await escuelaService.crear(
      { nombre_escuela: 'Software', descripcion: 'Desc', color: '#2563eb', icono: 'ph-code', id_encargado: 10 },
      1,
    );

    expect(m.escuelaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        descripcion: 'Desc',
        color: '#2563eb',
        icono: 'ph-code',
        encargado: { connect: { id_usuario: 10 } },
      }),
    );
  });

  it('rechaza un encargado que no es Profesor activo', async () => {
    m.escuelaRepository.findEncargadoValido.mockResolvedValue(null);

    await expect(
      escuelaService.crear({ nombre_escuela: 'Software', id_encargado: 99 }, 1),
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(m.escuelaRepository.create).not.toHaveBeenCalled();
  });

  it('id_encargado null quita el encargado al actualizar', async () => {
    await escuelaService.actualizar(1, { id_encargado: null });

    expect(m.escuelaRepository.findEncargadoValido).not.toHaveBeenCalled();
    expect(m.escuelaRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ encargado: { disconnect: true } }),
    );
  });

  it('agrega la URL pública a las imágenes', async () => {
    m.escuelaRepository.findById.mockResolvedValue(
      escuela({
        imagenes: [
          {
            id_imagen: 3,
            id_escuela: 1,
            ruta_archivo: '/uploads/escuelas/1/a.png',
            nombre_original: 'a.png',
            mime_type: 'image/png',
            orden: 1,
          },
        ],
      }),
    );

    const resultado = await escuelaService.obtener(1);

    expect(resultado.imagenes[0].url).toMatch(/\/uploads\/escuelas\/1\/a\.png$/);
  });
});

describe('escuelaImagenService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.escuelaRepository.findById.mockResolvedValue(escuela());
  });

  it('no supera el máximo de imágenes por escuela y descarta los archivos', async () => {
    m.prisma.escuela_imagenes.count.mockResolvedValue(4);

    await expect(
      escuelaImagenService.subir(1, 1, [archivo('a.png'), archivo('b.png')]),
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(m.unlink).toHaveBeenCalledTimes(2);
    expect(m.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('responde 404 y descarta los archivos si la escuela no existe', async () => {
    m.escuelaRepository.findById.mockResolvedValue(null);

    await expect(escuelaImagenService.subir(9, 1, [archivo('a.png')])).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(m.unlink).toHaveBeenCalledTimes(1);
  });

  it('exige al menos un archivo', async () => {
    await expect(escuelaImagenService.subir(1, 1, [])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('responde 404 al eliminar una imagen que no es de la escuela', async () => {
    m.prisma.escuela_imagenes.findFirst.mockResolvedValue(null);

    await expect(escuelaImagenService.eliminar(1, 50)).rejects.toMatchObject({ statusCode: 404 });
    expect(m.prisma.$transaction).not.toHaveBeenCalled();
  });
});
