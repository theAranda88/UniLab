import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { semilleroRepository } from '../models/semillero.repository';
import { rutaPublicaSemillero, urlPublicaImagen } from '../utils/uploadPaths';

function eliminarArchivoFisico(rutaRelativa: string | null | undefined): void {
  if (!rutaRelativa) return;
  const rutaFisica = path.join(process.cwd(), rutaRelativa.replace(/^\//, ''));
  fs.unlink(rutaFisica, () => undefined);
}

export const semilleroPortadaService = {
  async subir(id_semillero: number, file: Express.Multer.File) {
    if (!file) throw new AppError('Debe enviar la imagen de portada', 400);

    const semillero = await semilleroRepository.findById(id_semillero);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);

    const ruta = rutaPublicaSemillero(id_semillero, path.basename(file.path));
    const url = urlPublicaImagen(ruta);

    if (semillero.foto_portada_ruta) {
      eliminarArchivoFisico(semillero.foto_portada_ruta);
    }

    await semilleroRepository.update(id_semillero, {
      foto_portada_ruta: ruta,
      url_foto_portada: url,
    });

    return { url_foto_portada: url, foto_portada_ruta: ruta };
  },

  async eliminar(id_semillero: number) {
    const semillero = await semilleroRepository.findById(id_semillero);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);
    if (!semillero.foto_portada_ruta) throw new AppError('El semillero no tiene portada', 404);

    eliminarArchivoFisico(semillero.foto_portada_ruta);
    await semilleroRepository.update(id_semillero, {
      foto_portada_ruta: null,
      url_foto_portada: null,
    });
  },
};
