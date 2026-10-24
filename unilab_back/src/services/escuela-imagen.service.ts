import { urlPublicaImagen } from '../utils/uploadPaths';

interface EscuelaImagenRow {
  id_imagen: number;
  id_escuela: number;
  ruta_archivo: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}

export interface EscuelaImagenDto extends EscuelaImagenRow {
  url: string;
}

function mapImagen(imagen: EscuelaImagenRow): EscuelaImagenDto {
  return {
    id_imagen: imagen.id_imagen,
    id_escuela: imagen.id_escuela,
    ruta_archivo: imagen.ruta_archivo,
    nombre_original: imagen.nombre_original,
    mime_type: imagen.mime_type,
    orden: imagen.orden,
    url: urlPublicaImagen(imagen.ruta_archivo),
  };
}

export const escuelaImagenService = {
  mapImagen,
  mapImagenes(imagenes: EscuelaImagenRow[]): EscuelaImagenDto[] {
    return imagenes.map(mapImagen);
  },
};
