import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ImageLightboxComponent } from '../../../shared/ui/image-lightbox/image-lightbox.component';

@Component({
  selector: 'app-project-image-carousel',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ImageLightboxComponent],
  templateUrl: './project-image-carousel.component.html',
  styleUrl: './project-image-carousel.component.scss',
})
export class ProjectImageCarouselComponent implements OnInit, OnDestroy {
  @Input({ required: true }) images: string[] = [];
  @Input() alt = '';
  @Input() autoplayMs = 4500;
  /** Permite abrir las imágenes en el visor con zoom (fichas de detalle). */
  @Input() zoomable = false;

  readonly visorAbierto = signal(false);

  readonly activeIndex = signal(0);
  /** URLs que el navegador no pudo cargar: se retiran del carrusel en vez de mostrar un hueco. */
  private readonly rotas = signal<ReadonlySet<string>>(new Set());
  readonly visibles = computed(() => this.images.filter((src) => !this.rotas().has(src)));
  readonly hasMultiple = computed(() => this.visibles().length > 1);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const reducirMovimiento =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (this.images.length > 1 && this.autoplayMs > 0 && !reducirMovimiento) {
      this.timer = setInterval(() => this.next(), this.autoplayMs);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  abrirVisor(event?: Event): void {
    event?.stopPropagation();
    if (!this.zoomable || this.visibles().length === 0) return;
    this.visorAbierto.set(true);
  }

  cerrarVisor(): void {
    this.visorAbierto.set(false);
  }

  marcarRota(src: string): void {
    this.rotas.update((set) => new Set(set).add(src));
    this.activeIndex.set(0);
  }

  goTo(index: number, event?: Event): void {
    event?.stopPropagation();
    if (index < 0 || index >= this.visibles().length) return;
    this.activeIndex.set(index);
  }

  next(event?: Event): void {
    event?.stopPropagation();
    // El avance automático se detiene mientras el visor está abierto
    if (!event && this.visorAbierto()) return;
    const total = this.visibles().length;
    if (total <= 1) return;
    this.activeIndex.update((i) => (i + 1) % total);
  }

  prev(event?: Event): void {
    event?.stopPropagation();
    const total = this.visibles().length;
    if (total <= 1) return;
    this.activeIndex.update((i) => (i - 1 + total) % total);
  }
}
