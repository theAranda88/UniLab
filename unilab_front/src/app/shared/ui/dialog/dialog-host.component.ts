import { Component, inject, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { shouldUsePortalUi } from '../../../core/utils/portal-theme.util';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './dialog-host.component.html',
  styleUrl: './dialog-host.component.scss',
  host: {
    '[class.dialog-host--portal]': 'portalTheme()',
  },
})
export class DialogHostComponent {
  dialog = inject(DialogService);
  private router = inject(Router);
  private auth = inject(AuthService);

  private readonly navigationTick = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => Date.now()),
    ),
    { initialValue: Date.now() },
  );

  readonly portalTheme = computed(() => {
    this.navigationTick();
    return shouldUsePortalUi(this.router, this.auth.currentRole());
  });

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
