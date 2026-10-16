import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogHostComponent } from './shared/ui/dialog/dialog-host.component';
import { ToastHostComponent } from './shared/ui/toast/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DialogHostComponent, ToastHostComponent],
  template: `
    <router-outlet />
    <app-dialog-host />
    <app-toast-host />
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class App {}
