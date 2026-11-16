import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { usuarioRepository } from '../models/usuario.repository';
import { rutaPublicaUsuario } from '../utils/uploadPaths';
import { authService } from './auth.service';

/** Solo borra archivos propios; las fotos del seed son URLs externas. */
function eliminarArchivoFisico(ruta: string | null | undefined): void {
  if (!ruta || /^https?:\/\//i.test(ruta)) return;
  const rutaFisica = path.join(process.cwd(), ruta.replace(/^\//, ''));
  fs.unlink(rutaFisica, () => undefined);
}

export const usuarioFotoService = {
  /** Reemplaza la foto de perfil y devuelve la sesión actualizada. */
  async subir(id_usuario: number, file: Express.Multer.File | undefined) {
    if (!file) throw new AppError('Debe enviar la foto', 400);

    const usuario = await usuarioRepository.findPerfilSesion(id_usuario);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);

    eliminarArchivoFisico(usuario.foto_ruta);
    await usuarioRepository.update(id_usuario, {
      foto_ruta: rutaPublicaUsuario(id_usuario, path.basename(file.path)),
    });
    return authService.obtenerSesion(id_usuario);
  },

  async eliminar(id_usuario: number) {
    const usuario = await usuarioRepository.findPerfilSesion(id_usuario);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    if (!usuario.foto_ruta) throw new AppError('No tiene foto de perfil', 404);

    eliminarArchivoFisico(usuario.foto_ruta);
    await usuarioRepository.update(id_usuario, { foto_ruta: null });
    return authService.obtenerSesion(id_usuario);
  },
};
