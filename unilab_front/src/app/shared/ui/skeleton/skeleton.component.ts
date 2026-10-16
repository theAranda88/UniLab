import { Component, Input, computed, signal } from '@angular/core';

type SkeletonVariant = 'table' | 'cards' | 'stats' | 'list';

/**
 * C24 · Esqueleto de carga con la forma del contenido real.
 * Uso: <app-skeleton variant="table" [rows]="5" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @switch (variantSig()) {
      @case ('table') {
        <div class="sk-table">
          <div class="sk-table__head"><span class="sk sk--line"></span></div>
          @for (r of filas(); track r) {
            <div class="sk-table__row">
              <span class="sk sk--line sk--w40"></span>
              <span class="sk sk--line sk--w30"></span>
              <span class="sk sk--pill"></span>
            </div>
          }
        </div>
      }
      @case ('cards') {
        <div class="sk-cards">
          @for (r of filas(); track r) {
            <div class="sk-card">
              <span class="sk sk--media"></span>
              <span class="sk sk--line sk--w60"></span>
              <span class="sk sk--line sk--w90"></span>
              <span class="sk sk--line sk--w40"></span>
            </div>
          }
        </div>
      }
      @case ('stats') {
        <div class="sk-stats">
          @for (r of filas(); track r) {
            <div class="sk-stat">
              <span class="sk sk--line sk--w50"></span>
              <span class="sk sk--number"></span>
              <span class="sk sk--line sk--w40"></span>
            </div>
          }
        </div>
      }
      @default {
        <div class="sk-list">
          @for (r of filas(); track r) {
            <div class="sk-list__row">
              <span class="sk sk--square"></span>
              <span class="sk-list__text">
                <span class="sk sk--line sk--w70"></span>
                <span class="sk sk--line sk--w40"></span>
              </span>
            </div>
          }
        </div>
      }
    }
  `,
  styleUrl: './skeleton.component.scss',
  host: { 'aria-busy': 'true', role: 'status' },
})
export class SkeletonComponent {
  protected readonly variantSig = signal<SkeletonVariant>('list');
  protected readonly rowsSig = signal(3);
  protected readonly filas = computed(() => Array.from({ length: this.rowsSig() }, (_, i) => i));

  @Input() set variant(value: SkeletonVariant) {
    this.variantSig.set(value);
  }

  @Input() set rows(value: number) {
    this.rowsSig.set(value);
  }
}
