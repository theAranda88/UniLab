import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { requireRole } from '../src/middlewares/roles/requireRole';
import { checkPerfilPendiente, checkPrimerLogin } from '../src/middlewares/auth/checkPrimerLogin';
import { validate } from '../src/middlewares/validation/validate';

function respuesta() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

const req = (parcial: Record<string, unknown>) => parcial as unknown as Request;

describe('requireRole', () => {
  it('responde 401 sin usuario autenticado', () => {
    const next = vi.fn();
    requireRole(['Administrador'])(req({}), respuesta(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it('responde 403 si el rol no está permitido', () => {
    const next = vi.fn();
    requireRole(['Administrador'])(req({ user: { id_rol: 'Estudiante' } }), respuesta(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });

  it('deja pasar a un rol permitido', () => {
    const next = vi.fn();
    requireRole(['Administrador', 'Coordinador'])(req({ user: { id_rol: 'Coordinador' } }), respuesta(), next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('checkPrimerLogin / checkPerfilPendiente', () => {
  it('bloquea con primer_login salvo en cambiar-password', () => {
    const bloqueado = vi.fn();
    checkPrimerLogin(req({ user: { primer_login: true }, originalUrl: '/api/semilleros' }), respuesta(), bloqueado);
    expect(bloqueado.mock.calls[0][0]).toMatchObject({ statusCode: 403 });

    const permitido = vi.fn();
    checkPrimerLogin(
      req({ user: { primer_login: true }, originalUrl: '/api/auth/cambiar-password' }),
      respuesta(),
      permitido,
    );
    expect(permitido).toHaveBeenCalledWith();
  });

  it('bloquea con perfil pendiente salvo en completar-perfil', () => {
    const bloqueado = vi.fn();
    checkPerfilPendiente(req({ user: { perfil_pendiente: true }, originalUrl: '/api/reportes/resumen' }), respuesta(), bloqueado);
    expect(bloqueado.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });
});

describe('validate', () => {
  const schema = z.object({ nombre: z.string().min(1), edad: z.coerce.number().int() });

  it('responde 400 con el detalle de los campos inválidos', () => {
    const res = respuesta();
    const next: NextFunction = vi.fn();

    validate(schema)(req({ body: { nombre: '' } }), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const cuerpo = res.json.mock.calls[0][0];
    expect(cuerpo.detalles.map((d: { campo: string }) => d.campo).sort()).toEqual(['edad', 'nombre']);
    expect(next).not.toHaveBeenCalled();
  });

  it('reemplaza el body por los datos parseados', () => {
    const r = req({ body: { nombre: 'Ana', edad: '21', extra: 'x' } });
    const next = vi.fn();

    validate(schema)(r, respuesta(), next);

    expect(r.body).toEqual({ nombre: 'Ana', edad: 21 });
    expect(next).toHaveBeenCalledOnce();
  });
});
