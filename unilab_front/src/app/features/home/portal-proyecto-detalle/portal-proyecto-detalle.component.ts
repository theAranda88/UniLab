import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import { ProyectoInteraccionService } from '../proyecto-interaccion.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import {
  urlsImagenesProyecto,
  type ComentarioProyecto,
  type ProyectoPublico,
} from '../../../core/models/portal.model';
import { estiloDeEscuela } from '../../../core/utils/portal-theme.util';
import { recursosDeProyecto } from '../../../core/utils/recursos-externos.util';
import { RecursosExternosComponent } from '../../../shared/ui/recursos-externos/recursos-externos.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

const ICONOS_TIPO: Record<string, string> = {
  web: 'ti-world-www',
  movil: 'ti-device-mobile',
  podcast: 'ti-microphone',
  otro: 'ti-flask',
};

interface HiloComentario {
  comentario: ComentarioProyecto;
  respuestas: ComentarioProyecto[];
}

/**
 * Pantalla 23 · Portal — detalle de proyecto. Una sola plantilla para todos los proyectos:
 * cada bloque aparece solo si el proyecto tiene esos datos.
 */
@Component({
  selector: 'app-portal-proyecto-detalle',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    TranslatePipe,
    ProjectImageCarouselComponent,
    EmptyStateComponent,
    SkeletonComponent,
    RecursosExternosComponent,
  ],
  templateUrl: './portal-proyecto-detalle.component.html',
  styleUrl: './portal-proyecto-detalle.component.scss',
})
export class PortalProyectoDetalleComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);
  private interaccion = inject(ProyectoInteraccionService);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  readonly proyecto = signal<ProyectoPublico | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  private readonly idUsuario = computed(() => (this.isLoggedIn() ? this.auth.getCurrentUser()?.id_usuario : null));

  readonly estilo = computed(() => estiloDeEscuela(this.proyecto()?.curso?.escuela));
  readonly iconoTipo = computed(() => ICONOS_TIPO[this.proyecto()?.tipo_proyecto ?? ''] ?? 'ti-flask');
  readonly imagenes = computed(() => {
    const p = this.proyecto();
    return p ? urlsImagenesProyecto(p) : [];
  });

  readonly recursos = computed(() => {
    const p = this.proyecto();
    return p ? recursosDeProyecto(p) : [];
  });

  readonly director = computed(() => {
    const coord = this.proyecto()?.coordinadores?.[0]?.profesor;
    return coord ? `${coord.nombres} ${coord.apellidos}` : null;
  });

  /** Integrantes con su rol; si no hay autores registrados, el estudiante creador. */
  readonly integrantes = computed(() => {
    const p = this.proyecto();
    if (!p) return [];
    if (p.autores?.length) {
      return p.autores.map((a) => ({
        nombre: `${a.estudiante.nombres} ${a.estudiante.apellidos}`,
        rolKey: `home.authorRoles.${a.rol_autor ?? 'colaborador'}`,
      }));
    }
    return p.estudiante_creador
      ? [
          {
            nombre: `${p.estudiante_creador.nombres} ${p.estudiante_creador.apellidos}`,
            rolKey: 'home.authorRoles.principal',
          },
        ]
      : [];
  });

  // ---- Calificación (datos reales del proyecto) ----
  readonly calificaciones = computed(() => this.proyecto()?.calificaciones ?? []);
  readonly promedio = computed(() => {
    const lista = this.calificaciones();
    return lista.length ? lista.reduce((n, c) => n + c.puntuacion, 0) / lista.length : null;
  });
  readonly miCalificacion = computed(
    () => this.calificaciones().find((c) => c.id_usuario === this.idUsuario())?.puntuacion ?? 0,
  );
  readonly estrellas = [1, 2, 3, 4, 5];
  readonly guardandoCalificacion = signal(false);
  readonly hoverEstrella = signal(0);

  // ---- Comentarios ----
  readonly hilos = computed<HiloComentario[]>(() => {
    const lista = [...(this.proyecto()?.comentarios ?? [])].sort((a, b) =>
      a.fecha_comentario.localeCompare(b.fecha_comentario),
    );
    return lista
      .filter((c) => !c.id_comentario_padre)
      .map((comentario) => ({
        comentario,
        respuestas: lista.filter((r) => r.id_comentario_padre === comentario.id_comentario),
      }));
  });
  readonly totalComentarios = computed(() => this.proyecto()?.comentarios?.length ?? 0);
  nuevoComentario = '';
  readonly enviandoComentario = signal(false);

  /** Comentario al que se está respondiendo (solo un formulario de respuesta abierto a la vez). */
  readonly respondiendoA = signal<number | null>(null);
  respuesta = '';
  readonly enviandoRespuesta = signal(false);
  readonly maxComentario = 1000;
  readonly eliminandoComentario = signal<number | null>(null);

  constructor() {
    // Escucha el parámetro: el componente se reutiliza si se navega de un proyecto a otro
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('idProyecto'))),
        tap(() => {
          this.loading.set(true);
          this.loadError.set(false);
        }),
        switchMap((id) => this.portal.obtenerProyecto(id).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.loading.set(false);
        if (!data) {
          this.loadError.set(true);
          return;
        }
        this.proyecto.set(data);
      });
  }

  /** Calificar y comentar exigen sesión (lo exige la API): va al login y vuelve a esta ficha. */
  irALogin(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  esMio(c: ComentarioProyecto): boolean {
    return c.id_usuario === this.idUsuario();
  }

  /** Nombre del autor; si la API no lo trae, el texto genérico de siempre. */
  autor(c: ComentarioProyecto): string | null {
    return c.usuario ? `${c.usuario.nombres} ${c.usuario.apellidos}` : null;
  }

  /** Solo el autor ve «Eliminar»; al borrar un comentario también se quitan sus respuestas. */
  async eliminarComentario(c: ComentarioProyecto): Promise<void> {
    if (!this.esMio(c) || this.eliminandoComentario()) return;
    const ok = await this.dialog.confirm({
      titleKey: 'home.comments.deleteTitle',
      messageKey: c.id_comentario_padre ? 'home.comments.deleteReplyMessage' : 'home.comments.deleteMessage',
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.eliminandoComentario.set(c.id_comentario);
    this.interaccion.eliminarComentario(c.id_comentario).subscribe({
      next: () => {
        this.proyecto.update((actual) =>
          actual
            ? {
                ...actual,
                comentarios: (actual.comentarios ?? []).filter(
                  (x) => x.id_comentario !== c.id_comentario && x.id_comentario_padre !== c.id_comentario,
                ),
              }
            : actual,
        );
        if (this.respondiendoA() === c.id_comentario) this.cancelarRespuesta();
        this.eliminandoComentario.set(null);
        this.toast.success('home.comments.deleted');
      },
      error: () => {
        this.eliminandoComentario.set(null);
        this.toast.error('home.comments.deleteError');
      },
    });
  }

  calificar(puntuacion: number): void {
    const p = this.proyecto();
    if (!p || this.guardandoCalificacion()) return;
    this.guardandoCalificacion.set(true);
    this.interaccion.calificar(p.id_proyecto, puntuacion).subscribe({
      next: (guardada) => {
        // Se actualiza en local: volver a pedir el detalle sumaría una vista más al proyecto
        this.proyecto.update((actual) =>
          actual
            ? {
                ...actual,
                calificaciones: [
                  ...(actual.calificaciones ?? []).filter((c) => c.id_usuario !== guardada.id_usuario),
                  guardada,
                ],
              }
            : actual,
        );
        this.guardandoCalificacion.set(false);
        this.toast.success('home.rating.saved');
      },
      error: () => {
        this.guardandoCalificacion.set(false);
        this.toast.error('home.rating.error');
      },
    });
  }

  comentar(): void {
    const p = this.proyecto();
    const contenido = this.nuevoComentario.trim();
    if (!p || !contenido || this.enviandoComentario()) return;
    this.enviandoComentario.set(true);
    this.interaccion.comentar(p.id_proyecto, contenido).subscribe({
      next: (creado) => {
        this.proyecto.update((actual) =>
          actual ? { ...actual, comentarios: [...(actual.comentarios ?? []), creado] } : actual,
        );
        this.nuevoComentario = '';
        this.enviandoComentario.set(false);
        this.toast.success('home.comments.sent');
      },
      error: () => {
        this.enviandoComentario.set(false);
        this.toast.error('home.comments.error');
      },
    });
  }

  abrirRespuesta(idComentario: number): void {
    this.respondiendoA.set(idComentario);
    this.respuesta = '';
  }

  cancelarRespuesta(): void {
    this.respondiendoA.set(null);
    this.respuesta = '';
  }

  responder(): void {
    const p = this.proyecto();
    const idPadre = this.respondiendoA();
    const contenido = this.respuesta.trim();
    if (!p || !idPadre || !contenido || this.enviandoRespuesta()) return;
    this.enviandoRespuesta.set(true);
    this.interaccion.comentar(p.id_proyecto, contenido, idPadre).subscribe({
      next: (creada) => {
        this.proyecto.update((actual) =>
          actual ? { ...actual, comentarios: [...(actual.comentarios ?? []), creada] } : actual,
        );
        this.enviandoRespuesta.set(false);
        this.cancelarRespuesta();
        this.toast.success('home.comments.sent');
      },
      error: () => {
        this.enviandoRespuesta.set(false);
        this.toast.error('home.comments.error');
      },
    });
  }

  etiquetaEstrella(n: number): string {
    return this.translate.instant('home.rating.starLabel', { n });
  }
}
