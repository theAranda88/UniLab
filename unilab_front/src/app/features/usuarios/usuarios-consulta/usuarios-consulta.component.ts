import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UsuariosService } from '../usuarios.service';
import type { EscuelaResumen, UsuarioConsulta } from '../../../core/models/usuario.model';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { RedesContactoComponent } from '../../../shared/ui/redes-contacto/redes-contacto.component';

const PAGE_SIZE = 10;

type RolConsulta = 'Profesor' | 'Estudiante';

/**
 * Listado de solo lectura de profesores o estudiantes (Coordinador).
 * El rol a listar llega en `data.rolConsulta` de la ruta; búsqueda, escuela y paginación en cliente.
 */
@Component({
  selector: 'app-usuarios-consulta',
  standalone: true,
  imports: [TranslatePipe, EmptyStateComponent, SkeletonComponent, RedesContactoComponent],
  templateUrl: './usuarios-consulta.component.html',
  styleUrls: ['../usuarios-list/usuarios-list.component.scss', './usuarios-consulta.component.scss'],
})
export class UsuariosConsultaComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private route = inject(ActivatedRoute);

  readonly rol = signal<RolConsulta>('Estudiante');
  readonly usuarios = signal<UsuarioConsulta[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly filtroEscuela = signal<number | null>(null);
  readonly pagina = signal(1);

  /** Escuelas presentes en el listado, para el filtro. */
  readonly escuelas = computed<EscuelaResumen[]>(() => {
    const porId = new Map<number, EscuelaResumen>();
    for (const u of this.usuarios()) {
      if (u.escuela) porId.set(u.escuela.id_escuela, u.escuela);
    }
    return [...porId.values()].sort((a, b) => a.nombre_escuela.localeCompare(b.nombre_escuela));
  });

  readonly filtrados = computed(() => {
    const texto = normalizar(this.busqueda());
    const escuela = this.filtroEscuela();
    return this.usuarios().filter(
      (u) =>
        (!escuela || u.escuela?.id_escuela === escuela) &&
        (!texto || normalizar(`${u.nombres} ${u.apellidos} ${u.email} ${u.codigo ?? ''}`).includes(texto)),
    );
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / PAGE_SIZE)));

  readonly paginaActual = computed(() => {
    const inicio = (Math.min(this.pagina(), this.totalPaginas()) - 1) * PAGE_SIZE;
    return this.filtrados().slice(inicio, inicio + PAGE_SIZE);
  });

  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  readonly hayFiltros = computed(() => !!this.busqueda() || this.filtroEscuela() !== null);

  ngOnInit(): void {
    this.rol.set((this.route.snapshot.data['rolConsulta'] as RolConsulta) ?? 'Estudiante');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuariosService.consultar({ rol: this.rol() }).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('usuarios.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  setBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
  }

  setEscuela(valor: string): void {
    this.filtroEscuela.set(valor ? Number(valor) : null);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEscuela.set(null);
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
  }

  iniciales(u: UsuarioConsulta): string {
    return `${u.nombres?.charAt(0) ?? ''}${u.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  }
}

/** Minúsculas y sin tildes, para que «gomez» encuentre «Gómez». */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
