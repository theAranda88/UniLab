import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { normalizar } from '../../usuarios/usuarios-consulta/usuarios-consulta.component';
import type {
  EstudianteProfesor,
  UsuarioConsulta,
  VinculoProyecto,
  VinculoSemillero,
} from '../../../core/models/usuario.model';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { RedesContactoComponent } from '../../../shared/ui/redes-contacto/redes-contacto.component';

type Vista = 'vinculados' | 'escuela';

/**
 * Mis estudiantes (Profesor):
 * - «Vinculados»: estudiantes de sus semilleros y proyectos, filtrables por cada uno.
 * - «Mi escuela»: estudiantes de su escuela (listado de solo lectura).
 */
@Component({
  selector: 'app-mis-estudiantes',
  standalone: true,
  imports: [RouterLink, TranslatePipe, EmptyStateComponent, SkeletonComponent, RedesContactoComponent],
  templateUrl: './mis-estudiantes.component.html',
  styleUrls: ['../../usuarios/usuarios-list/usuarios-list.component.scss', './mis-estudiantes.component.scss'],
})
export class MisEstudiantesComponent implements OnInit {
  private usuariosService = inject(UsuariosService);

  readonly vista = signal<Vista>('vinculados');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  /** Filtro de la vista «Vinculados»: `s:<id>` semillero, `p:<id>` proyecto, '' todos. */
  readonly vinculo = signal('');

  readonly vinculados = signal<EstudianteProfesor[]>([]);
  readonly semilleros = signal<VinculoSemillero[]>([]);
  readonly proyectos = signal<VinculoProyecto[]>([]);
  readonly deEscuela = signal<UsuarioConsulta[] | null>(null);

  readonly filtradosVinculados = computed(() => {
    const texto = normalizar(this.busqueda());
    const [tipo, id] = this.vinculo().split(':');
    return this.vinculados().filter((e) => {
      if (tipo === 's' && !e.semilleros.some((s) => s.id_semillero === Number(id))) return false;
      if (tipo === 'p' && !e.proyectos.some((p) => p.id_proyecto === Number(id))) return false;
      return !texto || coincide(e, texto);
    });
  });

  readonly filtradosEscuela = computed(() => {
    const texto = normalizar(this.busqueda());
    return (this.deEscuela() ?? []).filter((e) => !texto || coincide(e, texto));
  });

  readonly total = computed(() =>
    this.vista() === 'vinculados' ? this.filtradosVinculados().length : this.filtradosEscuela().length,
  );

  readonly hayFiltros = computed(() => !!this.busqueda() || !!this.vinculo());

  ngOnInit(): void {
    this.cargarVinculados();
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
    this.busqueda.set('');
    this.error.set(null);
    if (vista === 'escuela' && this.deEscuela() === null) this.cargarEscuela();
  }

  recargar(): void {
    if (this.vista() === 'vinculados') this.cargarVinculados();
    else this.cargarEscuela();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.vinculo.set('');
  }

  iniciales(u: UsuarioConsulta): string {
    return `${u.nombres?.charAt(0) ?? ''}${u.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  }

  private cargarVinculados(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuariosService.estudiantesDeProfesor().subscribe({
      next: (data) => {
        this.vinculados.set(data.estudiantes);
        this.semilleros.set(data.semilleros);
        this.proyectos.set(data.proyectos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('misEstudiantes.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  private cargarEscuela(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuariosService.consultar({ rol: 'Estudiante' }).subscribe({
      next: (data) => {
        this.deEscuela.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('misEstudiantes.errorCargar');
        this.cargando.set(false);
      },
    });
  }
}

function coincide(u: UsuarioConsulta, texto: string): boolean {
  return normalizar(`${u.nombres} ${u.apellidos} ${u.email} ${u.codigo ?? ''}`).includes(texto);
}
