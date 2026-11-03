import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SemillerosService } from '../semilleros.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import type {
  EstadoMembresia,
  Semillero,
  SemilleroMiembro,
} from '../../../core/models/semillero.model';
import type { UsuarioAdmin } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/auth/auth.service';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { SemilleroGaleriaComponent } from '../semillero-galeria/semillero-galeria.component';

type FiltroMiembros = EstadoMembresia | 'todos';

/**
 * RF-015 · Detalle de semillero.
 * Administrador: asigna/retira profesores. Profesor líder: resuelve solicitudes y autoriza publicación.
 */
@Component({
  selector: 'app-semillero-detalle',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TranslatePipe,
    EmptyStateComponent,
    SkeletonComponent,
    SemilleroGaleriaComponent,
  ],
  templateUrl: './semillero-detalle.component.html',
  styleUrl: './semillero-detalle.component.scss',
})
export class SemilleroDetalleComponent implements OnInit {
  private semillerosService = inject(SemillerosService);
  private usuariosService = inject(UsuariosService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  readonly semillero = signal<Semillero | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly ocupado = signal<string | null>(null);
  readonly filtro = signal<FiltroMiembros>('todos');
  readonly profesoresDisponibles = signal<UsuarioAdmin[]>([]);
  profesorSeleccionado = 0;

  readonly esAdmin = this.auth.hasRole('Administrador');
  readonly basePath = this.semillerosService.getBasePath();
  readonly filtros: FiltroMiembros[] = ['pendiente', 'aprobado', 'rechazado', 'todos'];
  private readonly idUsuario = this.auth.getCurrentUser()?.id_usuario;
  private idSemillero = 0;

  readonly esLider = computed(() => this.semillero()?.id_profesor_lider === this.idUsuario);

  readonly conteo = computed(() => {
    const miembros = this.semillero()?.miembros ?? [];
    return {
      pendiente: miembros.filter((m) => m.estado_solicitud === 'pendiente').length,
      aprobado: miembros.filter((m) => m.estado_solicitud === 'aprobado').length,
      rechazado: miembros.filter((m) => m.estado_solicitud === 'rechazado').length,
      todos: miembros.length,
    };
  });

  readonly miembrosFiltrados = computed(() => {
    const miembros = this.semillero()?.miembros ?? [];
    const f = this.filtro();
    return f === 'todos' ? miembros : miembros.filter((m) => m.estado_solicitud === f);
  });

  /** Profesores activos que aún no están asignados (para el selector del administrador). */
  readonly candidatos = computed(() => {
    const asignados = new Set(this.semillero()?.profesores.map((p) => p.id_profesor) ?? []);
    return this.profesoresDisponibles().filter((p) => p.activo && !asignados.has(p.id_usuario));
  });

  ngOnInit(): void {
    this.idSemillero = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(true);
    if (this.esAdmin) {
      this.usuariosService.listar('Profesor').subscribe({
        next: (profesores) => this.profesoresDisponibles.set(profesores),
      });
    }
  }

  cargar(inicial = false): void {
    if (inicial) this.cargando.set(true);
    this.error.set(null);
    this.semillerosService.obtener(this.idSemillero).subscribe({
      next: (s) => {
        this.semillero.set(s);
        this.cargando.set(false);
        // Al entrar, el líder ve primero lo que requiere su acción.
        if (inicial && this.esLider() && this.conteo().pendiente > 0) this.filtro.set('pendiente');
      },
      error: () => {
        this.error.set('semilleros.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  nombre(u?: { nombres: string; apellidos: string }): string {
    return u ? `${u.nombres} ${u.apellidos}` : '—';
  }

  iniciales(u?: { nombres: string; apellidos: string }): string {
    return u ? `${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase() : '?';
  }

  asignarProfesor(): void {
    if (!this.profesorSeleccionado) return;
    this.ejecutar(
      `prof-add`,
      this.semillerosService.asignarProfesor(this.idSemillero, this.profesorSeleccionado),
      'semilleros.exitoAsignarProfesor',
      () => (this.profesorSeleccionado = 0),
    );
  }

  async quitarProfesor(idProfesor: number, nombre: string): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'semilleros.quitarProfesorTitulo',
      message: this.translate.instant('semilleros.quitarProfesorMensaje', { nombre }),
      confirmKey: 'semilleros.quitar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;
    this.ejecutar(
      `prof-${idProfesor}`,
      this.semillerosService.quitarProfesor(this.idSemillero, idProfesor),
      'semilleros.exitoQuitarProfesor',
    );
  }

  resolver(miembro: SemilleroMiembro, estado: 'aprobado' | 'rechazado'): void {
    this.ejecutar(
      `m-${miembro.id_estudiante}`,
      this.semillerosService.resolverSolicitud(this.idSemillero, miembro.id_estudiante, estado),
      estado === 'aprobado' ? 'semilleros.exitoAprobar' : 'semilleros.exitoRechazar',
    );
  }

  autorizar(miembro: SemilleroMiembro): void {
    this.ejecutar(
      `m-${miembro.id_estudiante}`,
      this.semillerosService.autorizarPublicacion(this.idSemillero, miembro.id_estudiante),
      'semilleros.exitoAutorizar',
    );
  }

  /** Ejecuta una acción, bloquea su botón mientras tanto y recarga el detalle al terminar. */
  private ejecutar(
    clave: string,
    accion$: Observable<unknown>,
    exitoKey: string,
    alTerminar?: () => void,
  ): void {
    this.ocupado.set(clave);
    accion$.subscribe({
      next: () => {
        this.ocupado.set(null);
        this.toast.success(exitoKey);
        alTerminar?.();
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.ocupado.set(null);
        this.toast.error(err?.message ?? 'semilleros.errorAccion');
      },
    });
  }
}
