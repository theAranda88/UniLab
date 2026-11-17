import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  usuarioRepository: { findPerfilSesion: vi.fn(), update: vi.fn() },
  authService: { obtenerSesion: vi.fn() },
  unlink: vi.fn(),
}));

vi.mock('../src/models/usuario.repository', () => ({ usuarioRepository: m.usuarioRepository }));
vi.mock('../src/services/auth.service', () => ({ authService: m.authService }));
vi.mock('fs', () => ({ default: { unlink: m.unlink } }));

import { usuarioFotoService } from '../src/services/usuario-foto.service';

const archivo = { path: '/tmp/uploads/usuarios/7/foto-abc.png' } as Express.Multer.File;

describe('usuarioFotoService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.authService.obtenerSesion.mockResolvedValue({ id_usuario: 7 });
  });

  it('exige el archivo', async () => {
    await expect(usuarioFotoService.subir(7, undefined)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('guarda la ruta pública y borra la foto anterior subida', async () => {
    m.usuarioRepository.findPerfilSesion.mockResolvedValue({ foto_ruta: '/uploads/usuarios/7/foto-vieja.jpg' });

    await usuarioFotoService.subir(7, archivo);

    expect(m.usuarioRepository.update).toHaveBeenCalledWith(7, { foto_ruta: '/uploads/usuarios/7/foto-abc.png' });
    expect(m.unlink).toHaveBeenCalledTimes(1);
    expect(m.authService.obtenerSesion).toHaveBeenCalledWith(7);
  });

  it('no intenta borrar del disco una foto externa (seed)', async () => {
    m.usuarioRepository.findPerfilSesion.mockResolvedValue({ foto_ruta: 'https://randomuser.me/api/portraits/women/1.jpg' });

    await usuarioFotoService.eliminar(7);

    expect(m.unlink).not.toHaveBeenCalled();
    expect(m.usuarioRepository.update).toHaveBeenCalledWith(7, { foto_ruta: null });
  });

  it('responde 404 al quitar una foto que no existe', async () => {
    m.usuarioRepository.findPerfilSesion.mockResolvedValue({ foto_ruta: null });
    await expect(usuarioFotoService.eliminar(7)).rejects.toMatchObject({ statusCode: 404 });
  });
});
