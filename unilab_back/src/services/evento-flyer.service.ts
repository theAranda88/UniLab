import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { eventoRepository } from '../models/evento.repository';
import {
  rutaPublicaEvento,
  urlPublicaImagen,
} from '../utils/uploadPaths';

const ROLES_FLYER = new Set(['Administrador']);

function verificarAdmin(rol: string): void {
  if (!ROLES_FLYER.has(rol)) {
    throw new AppError('Sin permiso para gestionar el flyer del evento', 403);
  }
}

function eliminarArchivoFisico(rutaRelativa: string | null | undefined): void {
  if (!rutaRelativa) return;
  const rutaFisica = path.join(process.cwd(), rutaRelativa.replace(/^\//, ''));
  fs.unlink(rutaFisica, () => undefined);
}

export const eventoFlyerService = {
  async subir(
    id_evento: number,
    rol: string,
    file: Express.Multer.File,
  ) {
    verificarAdmin(rol);
    if (!file) throw new AppError('Debe enviar el archivo del flyer', 400);

    const evento = await eventoRepository.findById(id_evento);
    if (!evento) throw new AppError('Evento no encontrado', 404);

    const ruta = rutaPublicaEvento(id_evento, path.basename(file.path));
    const url = urlPublicaImagen(ruta);

    if (evento.flyer_ruta_archivo) {
      eliminarArchivoFisico(evento.flyer_ruta_archivo);
    }

    await eventoRepository.update(id_evento, {
      flyer_ruta_archivo: ruta,
      url_flyer: url,
    });

    return { url_flyer: url, flyer_ruta_archivo: ruta };
  },

  async eliminar(id_evento: number, rol: string) {
    verificarAdmin(rol);
    const evento = await eventoRepository.findById(id_evento);
    if (!evento) throw new AppError('Evento no encontrado', 404);
    if (!evento.flyer_ruta_archivo) throw new AppError('El evento no tiene flyer', 404);

    eliminarArchivoFisico(evento.flyer_ruta_archivo);
    await eventoRepository.update(id_evento, {
      flyer_ruta_archivo: null,
      url_flyer: null,
    });
  },
};
