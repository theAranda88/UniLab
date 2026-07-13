import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.scss',
})
export class ModalShellComponent {
  @Input() open = true;
  @Input() titleKey = '';
  @Input() title = '';
  @Input() loading = false;
  @Input() dismissible = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

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
