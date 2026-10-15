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
import { authGuard, roleGuard, primerLoginGuard, roleRedirectGuard, perfilPendienteGuard, completarPerfilGuard, guestGuard } from './core/auth/auth.guard';
import { CompletarPerfilComponent } from './features/auth/completar-perfil/completar-perfil.component';
import { UsuariosListComponent } from './features/usuarios/usuarios-list/usuarios-list.component';
import { UsuariosFormComponent } from './features/usuarios/usuarios-form/usuarios-form.component';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div class="error-container">
      <div class="error-card">
        <span class="error-icon"><i class="ti ti-lock" aria-hidden="true"></i></span>
        <h1>403 - Acceso Denegado</h1>
        <p>No tienes permiso para acceder a este recurso.</p>
        <button (click)="goBack()">Volver</button>
      </div>
    </div>
  `,
  styles: [
    `
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 24px 16px;
        background: #fffdf5;
      }
      .error-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        width: 100%;
        max-width: 440px;
        padding: 40px 32px 32px;
        border: 1px solid rgba(30, 30, 30, 0.1);
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
        text-align: center;
        overflow: hidden;
      }
      .error-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto;
        height: 4px;
        background: linear-gradient(90deg, #053686 0 70%, #e3c924 70% 100%);
      }
      .error-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        margin-bottom: 4px;
        border-radius: 12px;
        background: rgba(176, 42, 42, 0.08);
        color: #b02a2a;
        font-size: 26px;
      }
      h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.02em;
        color: #1e1e1e;
      }
      p {
        margin: 0 0 8px;
        font-size: 14px;
        line-height: 1.5;
        color: rgba(30, 30, 30, 0.72);
      }
      button {
        min-height: 40px;
        padding: 0 24px;
        border: 1px solid #053686;
        border-radius: 8px;
        background: #053686;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: background 180ms ease;
      }
      button:hover {
        background: #032a6a;
      }
      button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(5, 54, 134, 0.12);
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
  {
    path: 'asistencia',
    loadComponent: () =>
      import('./features/eventos/asistencia-panel/asistencia-panel.component').then(
        (m) => m.AsistenciaPanelComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
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
  },  {
    path: 'eventos/:id/jornadas/:idJornada',
    loadComponent: () =>
      import('./features/eventos/jornada-detalle/jornada-detalle.component').then(
        (m) => m.JornadaDetalleComponent,
      ),
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

const usuariosShellChildren: Routes = [
  { path: 'usuarios', component: UsuariosListComponent },
  { path: 'usuarios/crear', component: UsuariosFormComponent },
  { path: 'usuarios/:id/editar', component: UsuariosFormComponent },
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
        children: eventosPortalChildren,
      },
      {
        path: 'mis-proyectos',
        canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
        data: { roles: ['Estudiante'] },
        children: proyectosEstudianteChildren,
      },
    ],
  },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'recuperar-contrasena',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/recuperar-contrasena/recuperar-contrasena.component').then(
        (m) => m.RecuperarContrasenaComponent,
      ),
  },
  {
    path: 'cambiar-password',
    component: CambiarPasswordComponent,
    canActivate: [CambiarPasswordGuard],
  },
  {
    path: 'completar-perfil',
    component: CompletarPerfilComponent,
    canActivate: [authGuard, completarPerfilGuard],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleRedirectGuard],
    children: [],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
    data: { roles: ['Administrador'], shellRole: 'Administrador', shellPrefix: '/admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      ...usuariosShellChildren,
      ...escuelasShellChildren,
      ...eventosShellChildren,
    ],
  },
  {
    path: 'coord',
    component: AdminShellComponent,
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
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
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
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
    data: { mobileMode: true, portalTheme: true },
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
