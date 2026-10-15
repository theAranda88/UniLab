import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChildren,
} from '@angular/core';

/** Círculo decorativo; posición en % del contenedor. */
export interface Burbuja {
  size: number;
  top: number;
  left: number;
  tipo: 'ring-accent' | 'ring-light' | 'dot-accent' | 'dot-light' | 'glass';
  float: number;
}

/** Estado físico (resorte) de cada burbuja. */
interface Fisica {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
}

/**
 * Círculos flotantes de fondo para paneles azules (hero del portal, login, registro).
 * Se coloca dentro de un contenedor con `position: relative`; escucha el mouse sobre ese
 * contenedor y solo aparta el círculo que queda bajo el puntero.
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
  private fisica: Fisica[] = [];
  private puntero: { x: number; y: number } | null = null;
  private frame = 0;

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const zona = this.host.nativeElement.parentElement;
      if (!zona) return;
      const mover = (e: PointerEvent) => {
        const r = this.host.nativeElement.getBoundingClientRect();
        this.puntero = { x: e.clientX - r.left, y: e.clientY - r.top };
        this.animar();
      };
      const salir = () => {
        this.puntero = null;
        this.animar();
      };
      zona.addEventListener('pointermove', mover, { passive: true });
      zona.addEventListener('pointerleave', salir);
      // Al hacer scroll la posición del puntero queda desfasada: los círculos vuelven a su sitio
      window.addEventListener('scroll', salir, { passive: true, capture: true });
      this.destroyRef.onDestroy(() => {
        zona.removeEventListener('pointermove', mover);
        zona.removeEventListener('pointerleave', salir);
        window.removeEventListener('scroll', salir, { capture: true });
        cancelAnimationFrame(this.frame);
      });
    });
  }

  /** Arranca el bucle de animación si no está corriendo. */
  private animar(): void {
    if (!this.frame) this.frame = requestAnimationFrame(() => this.paso());
  }

  /** Un paso de física: solo el círculo bajo el puntero se aparta; el resto queda quieto. */
  private paso(): void {
    this.frame = 0;
    const burbujas = this.burbujas();
    let activo = false;

    this.burbujaEls().forEach((ref, i) => {
      const el = ref.nativeElement;
      const b = burbujas[i];
      const f = (this.fisica[i] ??= { x: 0, y: 0, vx: 0, vy: 0, s: 1 });
      let tx = 0;
      let ty = 0;
      let ts = 1;

      if (this.puntero) {
        // Distancia a la posición base (sin el desplazamiento) para que no tiemble
        const cx = el.offsetLeft + b.size / 2;
        const cy = el.offsetTop + b.size / 2;
        const dx = cx - this.puntero.x;
        const dy = cy - this.puntero.y;
        const d = Math.hypot(dx, dy) || 1;
        const radio = b.size / 2 + 12;
        if (d < radio) {
          const fuerza = (1 - d / radio) * Math.min(40, 14 + b.size * 0.12);
          tx = (dx / d) * fuerza;
          ty = (dy / d) * fuerza;
          ts = 1 + (1 - d / radio) * 0.12;
        }
      }

      // Resorte amortiguado hacia el objetivo
      f.vx = (f.vx + (tx - f.x) * 0.08) * 0.82;
      f.vy = (f.vy + (ty - f.y) * 0.08) * 0.82;
      f.x += f.vx;
      f.y += f.vy;
      f.s += (ts - f.s) * 0.12;

      el.style.transform = `translate3d(${f.x.toFixed(2)}px, ${f.y.toFixed(2)}px, 0) scale(${f.s.toFixed(3)})`;
      el.classList.toggle('bubble--near', ts > 1.03);

      if (
        Math.abs(f.vx) + Math.abs(f.vy) > 0.02 ||
        Math.abs(tx - f.x) + Math.abs(ty - f.y) > 0.1 ||
        Math.abs(ts - f.s) > 0.002
      ) {
        activo = true;
      }
    });

    if (activo) this.animar();
  }
}
