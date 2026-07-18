import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { UiVariant } from '../ui-variant';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.scss',
  host: {
    '[class.modal-host--portal]': 'variant === "portal"',
  },
})
export class ModalShellComponent {
  @Input() open = true;
  @Input() titleKey = '';
  @Input() title = '';
  @Input() loading = false;
  @Input() dismissible = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: UiVariant = 'default';

  @Output() closed = new EventEmitter<void>();

  onOverlayClick() {
    if (this.dismissible && !this.loading) {
      this.closed.emit();
    }
  }

  onCloseClick() {
    if (!this.loading) {
      this.closed.emit();
    }
  }
}
