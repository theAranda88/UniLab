import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  eventoRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    findInscripcionEventoUsuario: vi.fn(),
    crearInscripcion: vi.fn(),
  },
  escuelaRepository: { findById: vi.fn() },
  semilleroRepository: { findById: vi.fn() },
}));

vi.mock('../src/models/evento.repository', () => ({ eventoRepository: m.eventoRepository }));
vi.mock('../src/models/escuela.repository', () => ({ escuelaRepository: m.escuelaRepository }));
vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));
vi.mock('../src/models/prisma.client', () => ({ prisma: {} }));

import { eventoService } from '../src/services/evento.service';

const BASE = {
  nombre_evento: 'Foro',
  tipo_evento: 'Foro',
  descripcion: 'D',
  fecha_inicio: '2026-12-01',
  fecha_fin: '2026-12-02',
  lugar: 'Auditorio',
  estado: 'planeado',
  id_organizador: 1,
  created_by: 1,
};

const datosCreados = () => m.eventoRepository.create.mock.calls[0][0];

describe('eventoService.crear — alcance', () => {
  beforeEach(() => vi.resetAllMocks());

  it('sin alcance queda institucional y sin escuela ni semillero', async () => {
    await eventoService.crear(BASE);
    expect(datosCreados()).toMatchObject({ alcance: 'institucional', organizacion_externa: null });
    expect(datosCreados().escuela).toBeUndefined();
    expect(datosCreados().semillero).toBeUndefined();
  });

  it('de escuela: exige escuela existente y la conecta', async () => {
    await expect(eventoService.crear({ ...BASE, alcance: 'escuela' })).rejects.toMatchObject({ statusCode: 422 });

    m.escuelaRepository.findById.mockResolvedValue({ id_escuela: 3 });
    await eventoService.crear({ ...BASE, alcance: 'escuela', id_escuela: 3 });
    expect(datosCreados().escuela).toEqual({ connect: { id_escuela: 3 } });
  });

  it('de semillero: toma la escuela del semillero', async () => {
    m.semilleroRepository.findById.mockResolvedValue({ id_semillero: 8, id_escuela: 5 });
    await eventoService.crear({ ...BASE, alcance: 'semillero', id_semillero: 8 });
    expect(datosCreados()).toMatchObject({
      alcance: 'semillero',
      escuela: { connect: { id_escuela: 5 } },
      semillero: { connect: { id_semillero: 8 } },
    });
  });

  it('externo: exige la organización y no admite escuela', async () => {
    await expect(eventoService.crear({ ...BASE, alcance: 'externo' })).rejects.toMatchObject({ statusCode: 422 });
    await expect(
      eventoService.crear({ ...BASE, alcance: 'externo', organizacion_externa: 'ONG', id_escuela: 1 }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('institucional no admite escuela', async () => {
    await expect(eventoService.crear({ ...BASE, alcance: 'institucional', id_escuela: 2 })).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});

describe('eventoService.actualizar — alcance', () => {
  beforeEach(() => vi.resetAllMocks());

  it('al pasar de escuela a institucional desconecta la escuela', async () => {
    m.eventoRepository.findById.mockResolvedValue({
      id_evento: 1,
      estado: 'planeado',
      alcance: 'escuela',
      id_escuela: 3,
      id_semillero: null,
      organizacion_externa: null,
    });
    await eventoService.actualizar(1, { alcance: 'institucional' });
    expect(m.eventoRepository.update.mock.calls[0][1]).toMatchObject({
      alcance: 'institucional',
      escuela: { disconnect: true },
      semillero: { disconnect: true },
    });
  });

  it('no permite cambiar el estado de una solicitud sin resolverla', async () => {
    m.eventoRepository.findById.mockResolvedValue({ id_evento: 1, estado: 'solicitado', alcance: 'externo' });
    await expect(eventoService.actualizar(1, { estado: 'activo' })).rejects.toMatchObject({ statusCode: 422 });
  });
});

describe('solicitudes de eventos externos', () => {
  beforeEach(() => vi.resetAllMocks());

  it('el externo crea la solicitud en estado solicitado, como organizador', async () => {
    const { estado: _e, id_organizador: _o, created_by: _c, ...datos } = BASE;
    await eventoService.solicitar({ ...datos, organizacion_externa: 'Fundación X', id_usuario: 9 });
    expect(datosCreados()).toMatchObject({
      estado: 'solicitado',
      alcance: 'externo',
      organizacion_externa: 'Fundación X',
      organizador: { connect: { id_usuario: 9 } },
    });
  });

  it('aprobar pasa a planeado; rechazar guarda el motivo', async () => {
    m.eventoRepository.findById.mockResolvedValue({ id_evento: 4, estado: 'solicitado' });
    await eventoService.resolverSolicitud(4, 'aprobar');
    expect(m.eventoRepository.update).toHaveBeenLastCalledWith(4, { estado: 'planeado', motivo_rechazo: null });

    await eventoService.resolverSolicitud(4, 'rechazar', ' Fechas cruzadas ');
    expect(m.eventoRepository.update).toHaveBeenLastCalledWith(4, {
      estado: 'rechazado',
      motivo_rechazo: 'Fechas cruzadas',
    });
  });

  it('no resuelve un evento que no está solicitado', async () => {
    m.eventoRepository.findById.mockResolvedValue({ id_evento: 4, estado: 'planeado' });
    await expect(eventoService.resolverSolicitud(4, 'aprobar')).rejects.toMatchObject({ statusCode: 422 });
  });

  it('solo el administrador lista solicitudes', async () => {
    eventoService.listar('Administrador');
    expect(m.eventoRepository.findMany).toHaveBeenLastCalledWith(undefined);
    eventoService.listar('Estudiante');
    expect(m.eventoRepository.findMany).toHaveBeenLastCalledWith({ excluirEstados: ['solicitado', 'rechazado'] });
  });

  it('una solicitud ajena no es visible para otros usuarios', async () => {
    m.eventoRepository.findById.mockResolvedValue({ id_evento: 4, estado: 'solicitado', id_organizador: 9 });
    await expect(eventoService.obtenerVisible(4, { id_usuario: 5, id_rol: 'Estudiante' })).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(eventoService.obtenerVisible(4, { id_usuario: 9, id_rol: 'Externo' })).resolves.toBeTruthy();
    await expect(eventoService.obtenerVisible(4, { id_usuario: 1, id_rol: 'Administrador' })).resolves.toBeTruthy();
  });

  it('no se puede inscribir a un evento no aprobado', async () => {
    m.eventoRepository.findById.mockResolvedValue({ id_evento: 4, estado: 'solicitado' });
    await expect(
      eventoService.inscribir(4, 5, {
        tipo_asistente: 'estudiante',
        nombre_completo: 'A',
        documento_identidad: '1',
        email: 'a@a.co',
        telefono: '3',
        genero: 'F',
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});
