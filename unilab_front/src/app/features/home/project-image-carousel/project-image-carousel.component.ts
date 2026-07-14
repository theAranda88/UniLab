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

@Component({
  selector: 'app-project-image-carousel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './project-image-carousel.component.html',
  styleUrl: './project-image-carousel.component.scss',
})
export class ProjectImageCarouselComponent implements OnInit, OnDestroy {
  @Input({ required: true }) images: string[] = [];
  @Input() alt = '';
  @Input() autoplayMs = 4500;

  readonly activeIndex = signal(0);
  readonly hasMultiple = computed(() => this.images.length > 1);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (this.images.length > 1 && this.autoplayMs > 0) {
      this.timer = setInterval(() => this.next(), this.autoplayMs);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  goTo(index: number, event?: Event): void {
    event?.stopPropagation();
    if (index < 0 || index >= this.images.length) return;
    this.activeIndex.set(index);
  }

  next(event?: Event): void {
    event?.stopPropagation();
    if (this.images.length <= 1) return;
    this.activeIndex.update((i) => (i + 1) % this.images.length);
  }

  prev(event?: Event): void {
    event?.stopPropagation();
    if (this.images.length <= 1) return;
    this.activeIndex.update((i) => (i - 1 + this.images.length) % this.images.length);
  }
}
