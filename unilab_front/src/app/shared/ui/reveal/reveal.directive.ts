import { Directive, ElementRef, OnDestroy, afterNextRender, computed, inject, input } from '@angular/core';

/**
 * Aparición al hacer scroll: el elemento entra con un leve desplazamiento y opacidad cuando
 * llega a la pantalla (una sola vez). `appReveal` acepta un retraso en ms para escalonar listas.
 * Los estilos viven en `styles/global.scss` (`.scroll-reveal`) y respetan «reducir movimiento».
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: {
    class: 'scroll-reveal',
    '[style.--reveal-delay.ms]': 'retraso()',
  },
})
export class RevealDirective implements OnDestroy {
  /** Retraso en ms; usado como atributo sin valor (`appReveal`) llega como cadena vacía. */
  readonly appReveal = input<number | '' | undefined>(0);
  readonly retraso = computed(() => {
    const v = this.appReveal();
    return typeof v === 'number' ? v : 0;
  });

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      const nodo = this.el.nativeElement;
      if (typeof IntersectionObserver === 'undefined') {
        nodo.classList.add('is-visible');
        return;
      }
      this.observer = new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            if (!e.isIntersecting) continue;
            nodo.classList.add('is-visible');
            this.observer?.disconnect();
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      this.observer.observe(nodo);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
