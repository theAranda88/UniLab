import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CambiarPasswordComponent } from './features/auth/cambiar-password/cambiar-password.component';
import { CambiarPasswordGuard } from './core/auth/cambiar-password.guard';
import { EventosListComponent } from './features/eventos/eventos-list.component';
import { EventoDetalleComponent } from './features/eventos/evento-detalle.component';
import { EventoFormComponent } from './features/eventos/evento-form.component';
import { JornadaFormComponent } from './features/eventos/jornada-form.component';
import { AsistenciaQrComponent } from './features/eventos/asistencia-qr.component';
import { ReporteEventoComponent } from './features/eventos/reporte-evento.component';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div class="error-container">
      <h1>403 - Acceso Denegado</h1>
      <p>No tienes permiso para acceder a este recurso.</p>
      <button (click)="goBack()">Volver</button>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #243b8e 0%, #1c9dd8 100%);
      color: white;
      text-align: center;
      gap: 16px;
    }

    h1 {
      font-size: 48px;
      margin: 0;
    }

    p {
      font-size: 18px;
      margin: 0;
    }

    button {
      background-color: #fcc202;
      color: #243b8e;
      border: none;
      padding: 10px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    button:hover {
      background-color: #e5b001;
      transform: translateY(-2px);
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'cambiar-password',
    component: CambiarPasswordComponent,
    canActivate: [CambiarPasswordGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { requireAuth: true }
  },
  {
    path: 'eventos',
    component: EventosListComponent,
    data: { requireAuth: true }
  },
  {
    path: 'eventos/crear',
    component: EventoFormComponent,
    data: { requireAuth: true, roles: ['Administrador'] }
  },
  {
    path: 'eventos/:id',
    component: EventoDetalleComponent,
    data: { requireAuth: true }
  },
  {
    path: 'eventos/:id/jornadas/crear',
    component: JornadaFormComponent,
    data: { requireAuth: true, roles: ['Administrador'] }
  },
  {
    path: 'eventos/:id/asistencia',
    component: AsistenciaQrComponent,
    data: { requireAuth: true }
  },
  {
    path: 'eventos/:id/reporte',
    component: ReporteEventoComponent,
    data: { requireAuth: true, roles: ['Administrador', 'Coordinador'] }
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
