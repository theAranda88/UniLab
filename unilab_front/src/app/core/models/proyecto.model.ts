import type { Curso, ProyectoImagen, ProyectoPublico, SemilleroResumen, UsuarioResumen } from './portal.model';

export type TipoProyecto = 'web' | 'movil' | 'podcast' | 'otro';

export type EstadoProyecto =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'publicado'
  | 'rechazado';

export interface ProyectoCoordinador {
  id_profesor: number;
  profesor: UsuarioResumen;
}

export interface Proyecto extends ProyectoPublico {
  id_estudiante_creador: number;
  id_curso: number;
  id_semillero?: number | null;
  curso?: Curso;
  semillero?: SemilleroResumen | null;
  imagenes?: ProyectoImagen[];
  coordinadores?: ProyectoCoordinador[];
}

export interface CreateProyectoDto {
  id_curso: number;
  id_semillero?: number;
  id_profesor_coordinador?: number;
  titulo: string;
  descripcion: string;
  tipo_proyecto: TipoProyecto;
  url_aplicativo: string;
  url_apk?: string;
  url_youtube?: string;
  url_spotify?: string;
}

export type UpdateProyectoDto = Partial<CreateProyectoDto>;

export interface CambiarEstadoProyectoDto {
  estado_proyecto: EstadoProyecto;
}

export interface ProfesorCoordinadorDisponible {
  id_profesor: number;
  nombres: string;
  apellidos: string;
  email: string;
  codigo_docente: string;
}
