import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './dialog-host.component.html',
  styleUrl: './dialog-host.component.scss',
})
export class DialogHostComponent {
  dialog = inject(DialogService);

  iconFor(type: string): string {
    const map: Record<string, string> = {
      confirm: 'ti-help-circle',
      success: 'ti-circle-check',
      warning: 'ti-alert-triangle',
      error: 'ti-alert-circle',
      info: 'ti-info-circle',
    };
    return map[type] ?? 'ti-info-circle';
  }

  onOverlayClick(): void {
    const cfg = this.dialog.active();
    if (cfg?.dismissible && cfg.type !== 'confirm') {
      this.dialog.acknowledge();
    } else if (cfg?.dismissible && cfg.type === 'confirm') {
      this.dialog.cancelAction();
    }
  }
}
