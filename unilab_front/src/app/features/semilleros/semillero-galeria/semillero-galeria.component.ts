import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { SemillerosService, MAX_EVIDENCIAS_SEMILLERO } from '../semilleros.service';
import type { SemilleroEvidencia } from '../../../core/models/semillero.model';
import { ProjectImageCarouselComponent } from '../../home/project-image-carousel/project-image-carousel.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

/** HU-3.2 · Galería de evidencias del semillero (visualización y gestión admin). */
@Component({
  selector: 'app-semillero-galeria',
  standalone: true,
  imports: [TranslatePipe, ProjectImageCarouselComponent, EmptyStateComponent],
  templateUrl: './semillero-galeria.component.html',
  styleUrl: './semillero-galeria.component.scss',
})
export class SemilleroGaleriaComponent implements OnInit {
  @Input({ required: true }) idSemillero!: number;
  @Input() puedeGestionar = false;

  private semillerosService = inject(SemillerosService);
  private toast = inject(ToastService);

  readonly evidencias = signal<SemilleroEvidencia[]>([]);
  readonly cargando = signal(false);
  readonly subiendo = signal(false);
  readonly maxEvidencias = MAX_EVIDENCIAS_SEMILLERO;

  readonly urlsCarrusel = computed(() => this.evidencias().map((e) => e.url));
  readonly evidenciasRestantes = computed(() =>
    Math.max(0, MAX_EVIDENCIAS_SEMILLERO - this.evidencias().length),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.semillerosService
      .listarEvidencias(this.idSemillero)
      .pipe(catchError(() => of([] as SemilleroEvidencia[])))
      .subscribe({
        next: (lista) => {
          this.evidencias.set(lista);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  onArchivosSeleccionados(event: Event): void {
    if (!this.puedeGestionar) return;
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) return;

    if (files.length > this.evidenciasRestantes()) {
      this.toast.error('semilleros.evidenciasError');
      return;
    }

    this.subiendo.set(true);
    this.semillerosService.subirEvidencias(this.idSemillero, files).subscribe({
      next: (lista) => {
        this.evidencias.set(lista);
        this.subiendo.set(false);
        this.toast.success('semilleros.evidenciasExito');
      },
      error: () => {
        this.subiendo.set(false);
        this.toast.error('semilleros.evidenciasError');
      },
    });
  }

  eliminar(idEvidencia: number): void {
    if (!this.puedeGestionar) return;
    this.semillerosService.eliminarEvidencia(this.idSemillero, idEvidencia).subscribe({
      next: () => {
        this.evidencias.update((lista) => lista.filter((e) => e.id_evidencia !== idEvidencia));
        this.toast.success('semilleros.evidenciaEliminada');
      },
      error: () => this.toast.error('semilleros.evidenciasError'),
    });
  }
}
