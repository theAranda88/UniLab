import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import type {
  CambiarEstadoProyectoDto,
  CreateProyectoDto,
  ProfesorCoordinadorDisponible,
  Proyecto,
  UpdateProyectoDto,
} from '../../core/models/proyecto.model';
import type { Curso, ProyectoImagen } from '../../core/models/portal.model';
import { getProyectosBasePath } from '../../core/config/proyectos-paths';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getBasePath(): string {
    return getProyectosBasePath(this.auth.getCurrentUser()?.id_rol);
  }

  esEstudiante(): boolean {
    return this.auth.hasRole('Estudiante');
  }

  esProfesor(): boolean {
    return this.auth.hasRole('Profesor');
  }

  esCoordinadorDelProyecto(proyecto: Proyecto): boolean {
    const userId = this.auth.getCurrentUser()?.id_usuario;
    if (!userId) return false;
    return proyecto.coordinadores?.some((c) => c.id_profesor === userId) ?? false;
  }

  esAsignadoAMi(proyecto: Proyecto): boolean {
    return this.esCoordinadorDelProyecto(proyecto) || this.esLiderSemilleroProyecto(proyecto);
  }

  esLiderSemilleroProyecto(proyecto: Proyecto): boolean {
    const userId = this.auth.getCurrentUser()?.id_usuario;
    if (!userId || !proyecto.semillero) return false;
    const lider = (proyecto.semillero as { id_profesor_lider?: number }).id_profesor_lider;
    return lider === userId;
  }

  puedeRevisar(proyecto: Proyecto): boolean {
    return this.esAsignadoAMi(proyecto) && proyecto.estado_proyecto === 'en_revision';
  }

  puedePublicar(proyecto: Proyecto): boolean {
    return this.esAsignadoAMi(proyecto) && proyecto.estado_proyecto === 'aprobado';
  }

  puedeGestionarComoProfesor(proyecto: Proyecto): boolean {
    return this.esCoordinadorDelProyecto(proyecto);
  }

  esCreador(proyecto: Pick<Proyecto, 'id_estudiante_creador'>): boolean {
    const user = this.auth.getCurrentUser();
    return !!user && proyecto.id_estudiante_creador === user.id_usuario;
  }

  puedeCrear(): boolean {
    return this.esEstudiante();
  }

  puedeEditar(proyecto: Proyecto): boolean {
    return (
      this.esEstudiante() &&
      this.esCreador(proyecto) &&
      proyecto.estado_proyecto !== 'publicado'
    );
  }

  puedeEliminar(proyecto: Proyecto): boolean {
    return this.puedeEditar(proyecto);
  }

  puedeGestionarImagenes(proyecto: Proyecto): boolean {
    return this.puedeEditar(proyecto);
  }

  puedeEnviarRevision(proyecto: Proyecto): boolean {
    return (
      this.esCreador(proyecto) &&
      proyecto.estado_proyecto === 'borrador'
    );
  }

  listar(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${API}/proyectos`);
  }

  obtener(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${API}/proyectos/${id}`);
  }

  crear(data: CreateProyectoDto): Observable<Proyecto> {
    if (!this.puedeCrear()) {
      throw new Error('proyectosEstudiante.permisoCrear');
    }
    return this.http.post<Proyecto>(`${API}/proyectos`, data);
  }

  actualizar(id: number, data: UpdateProyectoDto): Observable<Proyecto> {
    return this.http.patch<Proyecto>(`${API}/proyectos/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/proyectos/${id}`);
  }

  cambiarEstado(id: number, data: CambiarEstadoProyectoDto): Observable<Proyecto> {
    return this.http.patch<Proyecto>(`${API}/proyectos/${id}/estado`, data);
  }

  listarImagenes(id: number): Observable<ProyectoImagen[]> {
    return this.http.get<ProyectoImagen[]>(`${API}/proyectos/${id}/imagenes`);
  }

  subirImagenes(id: number, files: File[]): Observable<ProyectoImagen[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('imagenes', file);
    }
    return this.http.post<ProyectoImagen[]>(`${API}/proyectos/${id}/imagenes`, formData);
  }

  eliminarImagen(idProyecto: number, idImagen: number): Observable<void> {
    return this.http.delete<void>(`${API}/proyectos/${idProyecto}/imagenes/${idImagen}`);
  }

  listarCursos(idEscuela?: number): Observable<Curso[]> {
    const url = idEscuela
      ? `${API}/cursos?id_escuela=${idEscuela}`
      : `${API}/cursos`;
    return this.http.get<Curso[]>(url);
  }

  listarSemilleros(): Observable<
    {
      id_semillero: number;
      nombre_semillero: string;
      id_profesor_lider: number;
      profesor_lider?: { nombres: string; apellidos: string };
    }[]
  > {
    return this.http.get<
      {
        id_semillero: number;
        nombre_semillero: string;
        id_profesor_lider: number;
        profesor_lider?: { nombres: string; apellidos: string };
      }[]
    >(`${API}/semilleros`);
  }

  listarCoordinadoresDisponibles(idCurso: number): Observable<ProfesorCoordinadorDisponible[]> {
    return this.http.get<ProfesorCoordinadorDisponible[]>(
      `${API}/cursos/${idCurso}/coordinadores-disponibles`,
    );
  }
}
