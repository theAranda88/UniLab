import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const PASO = 0.5;

/**
 * Visor de imágenes a pantalla completa con zoom.
 * - Zoom: botones +/−, rueda del ratón, doble clic / doble toque, pellizco (2 dedos), teclas + y −.
 * - Con zoom, arrastrar desplaza la imagen.
 * - ← / → cambian de imagen; Escape cierra. Bloquea el scroll de la página mientras está abierto.
 */
@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './image-lightbox.component.html',
  styleUrl: './image-lightbox.component.scss',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': 'alt()',
    '(document:keydown)': 'onKey($event)',
  },
})
export class ImageLightboxComponent {
  private destroyRef = inject(DestroyRef);

  readonly images = input.required<string[]>();
  readonly alt = input('');
  readonly startIndex = input(0);
  readonly closed = output<void>();

  private readonly cerrarBtn = viewChild<ElementRef<HTMLButtonElement>>('cerrarBtn');

  readonly index = signal(0);
  readonly zoom = signal(1);
  readonly desplazamiento = signal({ x: 0, y: 0 });
  readonly arrastrando = signal(false);

  readonly actual = computed(() => this.images()[this.index()] ?? '');
  readonly hayVarias = computed(() => this.images().length > 1);
  readonly porcentaje = computed(() => Math.round(this.zoom() * 100));
  readonly transform = computed(() => {
    const d = this.desplazamiento();
    return `translate(${d.x}px, ${d.y}px) scale(${this.zoom()})`;
  });

  // Gestos con puntero (ratón, lápiz o dedos)
  private punteros = new Map<number, { x: number; y: number }>();
  private inicioArrastre: { x: number; y: number; dx: number; dy: number } | null = null;
  private distanciaPellizco = 0;
  private zoomPellizco = 1;
  private ultimoToque = 0;

  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      // Se traslada al <body>: dentro del contenido quedaría bajo la cabecera fija del panel
      // (otro contexto de apilamiento) y esta interceptaría los clics de la barra del visor.
      document.body.appendChild(this.host.nativeElement);
      this.index.set(Math.min(this.startIndex(), this.images().length - 1));
      const anterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const foco = document.activeElement as HTMLElement | null;
      this.cerrarBtn()?.nativeElement.focus();
      this.destroyRef.onDestroy(() => {
        document.body.style.overflow = anterior;
        foco?.focus?.();
      });
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  anterior(): void {
    const n = this.images().length;
    this.irA((this.index() - 1 + n) % n);
  }

  siguiente(): void {
    this.irA((this.index() + 1) % this.images().length);
  }

  irA(i: number): void {
    this.index.set(i);
    this.reiniciar();
  }

  acercar(): void {
    this.fijarZoom(this.zoom() + PASO);
  }

  alejar(): void {
    this.fijarZoom(this.zoom() - PASO);
  }

  reiniciar(): void {
    this.zoom.set(1);
    this.desplazamiento.set({ x: 0, y: 0 });
  }

  onKey(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        this.cerrar();
        break;
      case 'ArrowLeft':
        if (this.hayVarias()) this.anterior();
        break;
      case 'ArrowRight':
        if (this.hayVarias()) this.siguiente();
        break;
      case '+':
      case '=':
        this.acercar();
        break;
      case '-':
        this.alejar();
        break;
      case '0':
        this.reiniciar();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.fijarZoom(this.zoom() * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }

  /** Doble clic: alterna entre ajustado y 2,5×. */
  alternarZoom(): void {
    if (this.zoom() > 1) this.reiniciar();
    else this.fijarZoom(2.5);
  }

  onPointerDown(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.punteros.size === 2) {
      this.distanciaPellizco = this.distancia();
      this.zoomPellizco = this.zoom();
      this.inicioArrastre = null;
    } else if (this.zoom() > 1) {
      const d = this.desplazamiento();
      this.inicioArrastre = { x: e.clientX, y: e.clientY, dx: d.x, dy: d.y };
      this.arrastrando.set(true);
    }
    // Doble toque en pantallas táctiles
    if (e.pointerType === 'touch' && this.punteros.size === 1) {
      const ahora = Date.now();
      if (ahora - this.ultimoToque < 300) this.alternarZoom();
      this.ultimoToque = ahora;
    }
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.punteros.has(e.pointerId)) return;
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.punteros.size === 2 && this.distanciaPellizco > 0) {
      this.fijarZoom(this.zoomPellizco * (this.distancia() / this.distanciaPellizco));
    } else if (this.inicioArrastre) {
      this.desplazamiento.set({
        x: this.inicioArrastre.dx + (e.clientX - this.inicioArrastre.x),
        y: this.inicioArrastre.dy + (e.clientY - this.inicioArrastre.y),
      });
    }
  }

  onPointerUp(e: PointerEvent): void {
    this.punteros.delete(e.pointerId);
    if (this.punteros.size < 2) this.distanciaPellizco = 0;
    if (this.punteros.size === 0) {
      this.inicioArrastre = null;
      this.arrastrando.set(false);
    }
  }

  /** Clic en el fondo (fuera de la imagen) cierra el visor. */
  onFondo(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.cerrar();
  }

  private fijarZoom(valor: number): void {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(valor * 100) / 100));
    this.zoom.set(z);
    if (z === 1) this.desplazamiento.set({ x: 0, y: 0 });
  }

  private distancia(): number {
    const [a, b] = [...this.punteros.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
}
