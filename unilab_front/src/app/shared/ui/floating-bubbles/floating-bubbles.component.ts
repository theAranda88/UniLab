import { Component, DestroyRef, ElementRef, afterNextRender, inject, input, viewChildren } from '@angular/core';

/** Círculo decorativo; posición en % del contenedor. */
export interface Burbuja {
  size: number;
  top: number;
  left: number;
  tipo: 'ring-accent' | 'ring-light' | 'dot-accent' | 'dot-light' | 'glass';
  /** Variante de deriva lenta (0–3). */
  float: number;
  /** Capa de profundidad: 0 = fondo (tenue y desenfocada), 1 = primer plano (nítida). */
  profundidad: number;
}

/**
 * Círculos de fondo del hero del portal, en capas de profundidad.
 * - Entrada escalonada al cargar y deriva lenta continua (CSS).
 * - Interacción localizada: solo la burbuja que está bajo el cursor responde (se ilumina y
 *   crece levemente); las demás y el contenido no se mueven.
 * - Animaciones en pausa fuera de pantalla; sin interacción en pantallas táctiles ni con
 *   `prefers-reduced-motion`.
 *
 * El host tiene `pointer-events: none` para no bloquear textos ni botones, así que el
 * puntero se escucha en el contenedor y se busca qué burbuja queda debajo (prueba de radio).
 */
@Component({
  selector: 'app-floating-bubbles',
  standalone: true,
  templateUrl: './floating-bubbles.component.html',
  styleUrl: './floating-bubbles.component.scss',
  host: { 'aria-hidden': 'true' },
})
export class FloatingBubblesComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);

  readonly burbujas = input.required<Burbuja[]>();
  private readonly burbujaEls = viewChildren<ElementRef<HTMLElement>>('burbuja');

  /** Burbujas mayores no reaccionan: son fondo y su respuesta movería media escena. */
  private static readonly TAMANO_MAX_INTERACTIVO = 200;

  private activa: HTMLElement | null = null;
  private puntero: { x: number; y: number } | null = null;
  private frame = 0;

  constructor() {
    afterNextRender(() => {
      const hostEl = this.host.nativeElement;

      const observer = new IntersectionObserver(([entrada]) =>
        hostEl.classList.toggle('bubbles--paused', !entrada.isIntersecting),
      );
      observer.observe(hostEl);
      this.destroyRef.onDestroy(() => observer.disconnect());

      const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const zona = hostEl.parentElement;
      if (reducirMovimiento || !punteroFino || !zona) return;

      const mover = (e: PointerEvent) => {
        this.puntero = { x: e.clientX, y: e.clientY };
        // Una comprobación por fotograma como máximo
        if (!this.frame) this.frame = requestAnimationFrame(() => this.actualizar());
      };
      const salir = () => {
        this.puntero = null;
        this.marcar(null);
      };
      zona.addEventListener('pointermove', mover, { passive: true });
      zona.addEventListener('pointerleave', salir);
      this.destroyRef.onDestroy(() => {
        zona.removeEventListener('pointermove', mover);
        zona.removeEventListener('pointerleave', salir);
        cancelAnimationFrame(this.frame);
      });
    });
  }

  /** Capa visual (0 fondo, 1 media, 2 frente) a partir de la profundidad. */
  capa(b: Burbuja): number {
    return b.profundidad < 0.34 ? 0 : b.profundidad < 0.67 ? 1 : 2;
  }

  interactiva(b: Burbuja): boolean {
    return b.size <= FloatingBubblesComponent.TAMANO_MAX_INTERACTIVO;
  }

  /** Encuentra la burbuja interactiva bajo el cursor (la más pequeña si se solapan). */
  private actualizar(): void {
    this.frame = 0;
    const p = this.puntero;
    if (!p) return;
    const burbujas = this.burbujas();
    let elegida: HTMLElement | null = null;
    let menor = Infinity;

    this.burbujaEls().forEach((ref, i) => {
      const b = burbujas[i];
      if (!b || !this.interactiva(b)) return;
      const r = ref.nativeElement.getBoundingClientRect();
      const radio = r.width / 2 + 6; // pequeño margen para las burbujas diminutas
      const d = Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2));
      if (d <= radio && b.size < menor) {
        menor = b.size;
        elegida = ref.nativeElement;
      }
    });
    this.marcar(elegida);
  }

  private marcar(el: HTMLElement | null): void {
    if (el === this.activa) return;
    this.activa?.classList.remove('bubble--hover');
    el?.classList.add('bubble--hover');
    this.activa = el;
  }
}
