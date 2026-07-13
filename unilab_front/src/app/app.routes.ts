import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { CambiarPasswordComponent } from './features/auth/cambiar-password/cambiar-password.component';
import { CambiarPasswordGuard } from './core/auth/cambiar-password.guard';
import { EventosListComponent } from './features/eventos/eventos-list.component';
import { EventoDetalleComponent } from './features/eventos/evento-detalle.component';
import { EventoFormComponent } from './features/eventos/evento-form.component';
import { JornadaFormComponent } from './features/eventos/jornada-form.component';
import { AsistenciaQrComponent } from './features/eventos/asistencia-qr.component';
import { ReporteEventoComponent } from './features/eventos/reporte-evento.component';
import { AdminShellComponent } from './shared/layout/admin-shell/admin-shell.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { CoordDashboardComponent } from './features/coordinador/dashboard/coord-dashboard.component';
import { ProfDashboardComponent } from './features/profesor/dashboard/prof-dashboard.component';
import { authGuard, roleGuard, primerLoginGuard, roleRedirectGuard } from './core/auth/auth.guard';

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
  styles: [
    `
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
      }
    `,
  ],
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/login']);
  }
}

const eventosShellChildren: Routes = [
  { path: 'eventos', component: EventosListComponent },
  {
    path: 'eventos/crear',
    component: EventoFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
  },
  {
    path: 'eventos/:id/editar',
    component: EventoFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
  },
  { path: 'eventos/:id', component: EventoDetalleComponent },
  {
    path: 'eventos/:id/jornadas/crear',
    component: JornadaFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
  },
  { path: 'eventos/:id/asistencia', component: AsistenciaQrComponent, data: { shellMode: true } },
  {
    path: 'eventos/:id/reporte',
    component: ReporteEventoComponent,
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
];

const eventosProfChildren: Routes = [
  { path: 'eventos', component: EventosListComponent },
  { path: 'eventos/:id', component: EventoDetalleComponent },
  { path: 'eventos/:id/asistencia', component: AsistenciaQrComponent, data: { shellMode: true } },
];

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'cambiar-password',
    component: CambiarPasswordComponent,
    canActivate: [CambiarPasswordGuard],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, primerLoginGuard, roleRedirectGuard],
    children: [],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard, primerLoginGuard, roleGuard],
    data: { roles: ['Administrador'], shellRole: 'Administrador', shellPrefix: '/admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      ...eventosShellChildren,
    ],
  },
  {
    path: 'coord',
    component: AdminShellComponent,
    canActivate: [authGuard, primerLoginGuard, roleGuard],
    data: { roles: ['Coordinador'], shellRole: 'Coordinador', shellPrefix: '/coord' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CoordDashboardComponent },
      ...eventosShellChildren,
    ],
  },
  {
    path: 'prof',
    component: AdminShellComponent,
    canActivate: [authGuard, primerLoginGuard, roleGuard],
    data: { roles: ['Profesor'], shellRole: 'Profesor', shellPrefix: '/prof' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ProfDashboardComponent },
      ...eventosProfChildren,
    ],
  },
  {
    path: 'eventos/:id/asistencia',
    component: AsistenciaQrComponent,
    canActivate: [authGuard, primerLoginGuard],
    data: { mobileMode: true },
  },
  {
    path: 'eventos',
    canActivate: [authGuard, primerLoginGuard],
    children: [
      { path: '', component: EventosListComponent },
      {
        path: 'crear',
        component: EventoFormComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
      },
      {
        path: ':id/editar',
        component: EventoFormComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
      },
      { path: ':id', component: EventoDetalleComponent },
      {
        path: ':id/jornadas/crear',
        component: JornadaFormComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
      },
      {
        path: ':id/reporte',
        component: ReporteEventoComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Coordinador'] },
      },
    ],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: 'login' },
];
