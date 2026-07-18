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
import { EscuelasListComponent } from './features/escuelas/escuelas-list/escuelas-list.component';
import { EscuelasFormComponent } from './features/escuelas/escuelas-form/escuelas-form.component';
import { MisProyectosListComponent } from './features/proyectos-estudiante/mis-proyectos-list/mis-proyectos-list.component';
import { ProyectoEstudiantePageComponent } from './features/proyectos-estudiante/proyecto-estudiante-page/proyecto-estudiante-page.component';
import { ProyectosProfListComponent } from './features/proyectos-profesor/proyectos-prof-list/proyectos-prof-list.component';
import { ProyectosProfDetalleComponent } from './features/proyectos-profesor/proyectos-prof-detalle/proyectos-prof-detalle.component';
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

const escuelasShellChildren: Routes = [
  { path: 'escuelas', component: EscuelasListComponent },
  {
    path: 'escuelas/crear',
    component: EscuelasFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
  {
    path: 'escuelas/:id/editar',
    component: EscuelasFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
];

const proyectosEstudianteChildren: Routes = [
  { path: '', component: MisProyectosListComponent, data: { portalTheme: true } },
  { path: 'nuevo', component: ProyectoEstudiantePageComponent, data: { portalTheme: true } },
  { path: ':id', component: ProyectoEstudiantePageComponent, data: { portalTheme: true } },
];

const eventosPortalChildren: Routes = [
  { path: '', component: EventosListComponent, data: { portalTheme: true } },
  { path: ':id', component: EventoDetalleComponent, data: { portalTheme: true } },
  {
    path: ':id/asistencia',
    component: AsistenciaQrComponent,
    data: { portalTheme: true, shellMode: true },
  },
];

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

const proyectosProfChildren: Routes = [
  { path: 'proyectos', component: ProyectosProfListComponent },
  { path: 'proyectos/:id', component: ProyectosProfDetalleComponent },
  {
    path: 'pendientes',
    component: ProyectosProfListComponent,
    data: { filtroInicial: 'en_revision' },
  },
];

const eventosProfChildren: Routes = [
  { path: 'eventos', component: EventosListComponent },
  { path: 'eventos/:id', component: EventoDetalleComponent },
  { path: 'eventos/:id/asistencia', component: AsistenciaQrComponent, data: { shellMode: true } },
];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/portal-shell/portal-shell.component').then((m) => m.PortalShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home-dashboard/home-dashboard.component').then(
            (m) => m.HomeDashboardComponent,
          ),
      },
      {
        path: 'escuelas/:idEscuela',
        loadComponent: () =>
          import('./features/home/portal-escuela-proyectos/portal-escuela-proyectos.component').then(
            (m) => m.PortalEscuelaProyectosComponent,
          ),
      },
      {
        path: 'proyectos/:idProyecto',
        loadComponent: () =>
          import('./features/home/portal-proyecto-detalle/portal-proyecto-detalle.component').then(
            (m) => m.PortalProyectoDetalleComponent,
          ),
      },
      {
        path: 'eventos',
        canActivate: [authGuard, primerLoginGuard],
        children: eventosPortalChildren,
      },
      {
        path: 'mis-proyectos',
        canActivate: [authGuard, primerLoginGuard, roleGuard],
        data: { roles: ['Estudiante'] },
        children: proyectosEstudianteChildren,
      },
    ],
  },
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
      ...escuelasShellChildren,
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
      ...escuelasShellChildren,
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
      ...proyectosProfChildren,
      ...eventosProfChildren,
    ],
  },
  {
    path: 'eventos/:id/asistencia',
    component: AsistenciaQrComponent,
    canActivate: [authGuard, primerLoginGuard],
    data: { mobileMode: true, portalTheme: true },
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '' },
];
