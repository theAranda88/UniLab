import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  semilleroRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    agregarProfesor: vi.fn(),
    buscarProfesor: vi.fn(),
    quitarProfesor: vi.fn(),
    buscarMembresia: vi.fn(),
    crearMembresia: vi.fn(),
    actualizarMembresia: vi.fn(),
  },
  prisma: {
    semillero_profesores: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
  usuarioRepository: { findById: vi.fn() },
  escuelaRepository: { findById: vi.fn() },
  configuracionService: { obtener: vi.fn() },
}));

vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));
vi.mock('../src/models/prisma.client', () => ({ prisma: m.prisma }));
vi.mock('../src/models/usuario.repository', () => ({ usuarioRepository: m.usuarioRepository }));
vi.mock('../src/models/escuela.repository', () => ({ escuelaRepository: m.escuelaRepository }));
vi.mock('../src/services/configuracion.service', () => ({ configuracionService: m.configuracionService }));

import { semilleroService } from '../src/services/semillero.service';

const SEMILLERO = { id_semillero: 1, id_profesor_lider: 10, id_escuela: 2, activo: true };
const usuario = (rol: string) => ({ rol: { nombre_rol: rol } });

describe('semilleroService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.semilleroRepository.findById.mockResolvedValue(SEMILLERO);
    m.configuracionService.obtener.mockResolvedValue(true);
  });

  describe('crear', () => {
    it('exige que el líder sea Profesor', async () => {
      m.escuelaRepository.findById.mockResolvedValue({ id_escuela: 2 });
      m.usuarioRepository.findById.mockResolvedValue(usuario('Estudiante'));

      await expect(
        semilleroService.crear({
          nombre_semillero: 'IA',
          descripcion: 'd',
          id_escuela: 2,
          id_profesor_lider: 5,
          created_by: 1,
        }),
      ).rejects.toMatchObject({ statusCode: 422 });
      expect(m.semilleroRepository.create).not.toHaveBeenCalled();
    });

    it('registra al líder también como profesor del semillero', async () => {
      m.escuelaRepository.findById.mockResolvedValue({ id_escuela: 2 });
      m.usuarioRepository.findById.mockResolvedValue(usuario('Profesor'));
      m.semilleroRepository.create.mockResolvedValue({ id_semillero: 3 });

      await semilleroService.crear({
        nombre_semillero: 'IA',
        descripcion: 'd',
        id_escuela: 2,
        id_profesor_lider: 5,
        created_by: 1,
      });

      expect(m.semilleroRepository.agregarProfesor).toHaveBeenCalledWith(
        expect.objectContaining({ es_lider: true, profesor: { connect: { id_usuario: 5 } } }),
      );
    });
  });

  describe('asignarProfesor', () => {
    beforeEach(() => {
      m.usuarioRepository.findById.mockResolvedValue(usuario('Profesor'));
    });

    it('rechaza asignar dos veces al mismo profesor', async () => {
      m.prisma.semillero_profesores.findUnique.mockResolvedValue({ deleted_at: null });

      await expect(semilleroService.asignarProfesor(1, 20, 1)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('restaura la asignación de un profesor retirado en vez de duplicarla', async () => {
      m.prisma.semillero_profesores.findUnique.mockResolvedValue({ deleted_at: new Date() });

      await semilleroService.asignarProfesor(1, 20, 1);

      expect(m.prisma.semillero_profesores.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deleted_at: null }) }),
      );
      expect(m.semilleroRepository.agregarProfesor).not.toHaveBeenCalled();
    });

    it('crea la asignación si nunca existió', async () => {
      m.prisma.semillero_profesores.findUnique.mockResolvedValue(null);

      await semilleroService.asignarProfesor(1, 20, 1);

      expect(m.semilleroRepository.agregarProfesor).toHaveBeenCalledOnce();
    });
  });

  describe('quitarProfesor', () => {
    it('no permite retirar al profesor líder', async () => {
      await expect(semilleroService.quitarProfesor(1, 10)).rejects.toMatchObject({ statusCode: 422 });
      expect(m.semilleroRepository.quitarProfesor).not.toHaveBeenCalled();
    });

    it('responde 404 si el profesor no está asignado', async () => {
      m.semilleroRepository.buscarProfesor.mockResolvedValue(null);

      await expect(semilleroService.quitarProfesor(1, 20)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('actualizar', () => {
    it('al cambiar de líder, quita la marca al anterior y marca al nuevo', async () => {
      m.usuarioRepository.findById.mockResolvedValue(usuario('Profesor'));
      m.prisma.semillero_profesores.findUnique.mockResolvedValue(null);

      await semilleroService.actualizar(1, { id_profesor_lider: 20 }, 1);

      expect(m.semilleroRepository.update).toHaveBeenCalledWith(1, {
        profesor_lider: { connect: { id_usuario: 20 } },
      });
      expect(m.prisma.semillero_profesores.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id_profesor: 10 }), data: { es_lider: false } }),
      );
      expect(m.semilleroRepository.agregarProfesor).toHaveBeenCalledWith(
        expect.objectContaining({ es_lider: true, profesor: { connect: { id_usuario: 20 } } }),
      );
    });
  });

  describe('solicitarMembresia', () => {
    beforeEach(() => {
      m.usuarioRepository.findById.mockResolvedValue(usuario('Estudiante'));
    });

    it('respeta el parámetro de configuración que cierra las solicitudes', async () => {
      m.configuracionService.obtener.mockResolvedValue(false);

      // 422 y no 403: el interceptor del front redirige cualquier 403 a /unauthorized.
      await expect(semilleroService.solicitarMembresia(1, 30)).rejects.toMatchObject({ statusCode: 422 });
      expect(m.semilleroRepository.crearMembresia).not.toHaveBeenCalled();
    });

    it('rechaza solicitudes a semilleros inactivos', async () => {
      m.semilleroRepository.findById.mockResolvedValue({ ...SEMILLERO, activo: false });

      await expect(semilleroService.solicitarMembresia(1, 30)).rejects.toMatchObject({ statusCode: 422 });
    });

    it('crea la solicitud en estado pendiente', async () => {
      m.semilleroRepository.buscarMembresia.mockResolvedValue(null);

      await semilleroService.solicitarMembresia(1, 30);

      expect(m.semilleroRepository.crearMembresia).toHaveBeenCalledWith(
        expect.objectContaining({ estado_solicitud: 'pendiente', puede_publicar: false }),
      );
    });

    it('no duplica una solicitud pendiente o aprobada', async () => {
      m.semilleroRepository.buscarMembresia.mockResolvedValue({ id_membresia: 4, estado_solicitud: 'pendiente' });

      await expect(semilleroService.solicitarMembresia(1, 30)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('permite volver a postularse tras un rechazo', async () => {
      m.semilleroRepository.buscarMembresia.mockResolvedValue({ id_membresia: 4, estado_solicitud: 'rechazado' });

      await semilleroService.solicitarMembresia(1, 30);

      expect(m.semilleroRepository.actualizarMembresia).toHaveBeenCalledWith(4, {
        estado_solicitud: 'pendiente',
        fecha_resolucion: null,
      });
    });
  });

  describe('resolverMembresia y autorizarPublicacion', () => {
    it('solo el profesor líder resuelve solicitudes', async () => {
      await expect(semilleroService.resolverMembresia(1, 30, 99, 'aprobado')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('un rechazo revoca el permiso de publicación', async () => {
      m.semilleroRepository.buscarMembresia.mockResolvedValue({ id_membresia: 4 });

      await semilleroService.resolverMembresia(1, 30, 10, 'rechazado');

      expect(m.semilleroRepository.actualizarMembresia).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ estado_solicitud: 'rechazado', puede_publicar: false }),
      );
    });

    it('solo autoriza publicación a miembros aprobados', async () => {
      m.semilleroRepository.buscarMembresia.mockResolvedValue({ id_membresia: 4, estado_solicitud: 'pendiente' });

      await expect(semilleroService.autorizarPublicacion(1, 30, 10)).rejects.toMatchObject({ statusCode: 422 });
    });
  });
});
