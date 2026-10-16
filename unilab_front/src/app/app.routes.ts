import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CambiarPasswordGuard } from './core/auth/cambiar-password.guard';
import {
  authGuard,
  roleGuard,
  primerLoginGuard,
  roleRedirectGuard,
  perfilPendienteGuard,
  completarPerfilGuard,
  guestGuard,
} from './core/auth/auth.guard';

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
  {
    path: 'escuelas',
    loadComponent: () =>
      import('./features/escuelas/escuelas-list/escuelas-list.component').then(
        (m) => m.EscuelasListComponent,
      ),
  },
  {
    path: 'escuelas/crear',
    loadComponent: () =>
      import('./features/escuelas/escuelas-form/escuelas-form.component').then(
        (m) => m.EscuelasFormComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
  {
    path: 'escuelas/:id/editar',
    loadComponent: () =>
      import('./features/escuelas/escuelas-form/escuelas-form.component').then(
        (m) => m.EscuelasFormComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
];

const proyectosEstudianteChildren: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/proyectos-estudiante/mis-proyectos-list/mis-proyectos-list.component').then(
        (m) => m.MisProyectosListComponent,
      ),
    data: { portalTheme: true },
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./features/proyectos-estudiante/proyecto-estudiante-page/proyecto-estudiante-page.component').then(
        (m) => m.ProyectoEstudiantePageComponent,
      ),
    data: { portalTheme: true },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/proyectos-estudiante/proyecto-estudiante-page/proyecto-estudiante-page.component').then(
        (m) => m.ProyectoEstudiantePageComponent,
      ),
    data: { portalTheme: true },
  },
];

const eventosPortalChildren: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/eventos/eventos-list.component').then((m) => m.EventosListComponent),
    data: { portalTheme: true },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/eventos/evento-detalle.component').then((m) => m.EventoDetalleComponent),
    data: { portalTheme: true },
  },
  {
    path: ':id/asistencia',
    loadComponent: () =>
      import('./features/eventos/asistencia-qr.component').then((m) => m.AsistenciaQrComponent),
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
  {
    path: 'eventos',
    loadComponent: () =>
      import('./features/eventos/eventos-list.component').then((m) => m.EventosListComponent),
  },
  {
    path: 'eventos/crear',
    loadComponent: () =>
      import('./features/eventos/evento-form.component').then((m) => m.EventoFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
  },
  {
    path: 'eventos/:id/editar',
    loadComponent: () =>
      import('./features/eventos/evento-form.component').then((m) => m.EventoFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
  },
  {
    path: 'eventos/:id',
    loadComponent: () =>
      import('./features/eventos/evento-detalle.component').then((m) => m.EventoDetalleComponent),
  },
  {
    path: 'eventos/:id/jornadas/crear',
    loadComponent: () =>
      import('./features/eventos/jornada-form.component').then((m) => m.JornadaFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
  },
  {
    path: 'eventos/:id/asistencia',
    loadComponent: () =>
      import('./features/eventos/asistencia-qr.component').then((m) => m.AsistenciaQrComponent),
    data: { shellMode: true },
  },
  {
    path: 'eventos/:id/reporte',
    loadComponent: () =>
      import('./features/eventos/reporte-evento.component').then((m) => m.ReporteEventoComponent),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Coordinador'] },
  },
  {
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
  {
    path: 'proyectos',
    loadComponent: () =>
      import('./features/proyectos-profesor/proyectos-prof-list/proyectos-prof-list.component').then(
        (m) => m.ProyectosProfListComponent,
      ),
  },
  {
    path: 'proyectos/:id',
    loadComponent: () =>
      import('./features/proyectos-profesor/proyectos-prof-detalle/proyectos-prof-detalle.component').then(
        (m) => m.ProyectosProfDetalleComponent,
      ),
  },
  {
    path: 'pendientes',
    loadComponent: () =>
      import('./features/proyectos-profesor/proyectos-prof-list/proyectos-prof-list.component').then(
        (m) => m.ProyectosProfListComponent,
      ),
    data: { filtroInicial: 'en_revision' },
  },
];

const eventosProfChildren: Routes = [
  {
    path: 'eventos',
    loadComponent: () =>
      import('./features/eventos/eventos-list.component').then((m) => m.EventosListComponent),
  },
  {
    path: 'eventos/:id',
    loadComponent: () =>
      import('./features/eventos/evento-detalle.component').then((m) => m.EventoDetalleComponent),
  },
  {
    path: 'eventos/:id/asistencia',
    loadComponent: () =>
      import('./features/eventos/asistencia-qr.component').then((m) => m.AsistenciaQrComponent),
    data: { shellMode: true },
  },
];

const cursosAdminChildren: Routes = [
  {
    path: 'cursos',
    loadComponent: () =>
      import('./features/cursos/cursos-list/cursos-list.component').then(
        (m) => m.CursosListComponent,
      ),
  },
  {
    path: 'cursos/crear',
    loadComponent: () =>
      import('./features/cursos/cursos-form/cursos-form.component').then(
        (m) => m.CursosFormComponent,
      ),
  },
  {
    path: 'cursos/:id/editar',
    loadComponent: () =>
      import('./features/cursos/cursos-form/cursos-form.component').then(
        (m) => m.CursosFormComponent,
      ),
  },
];

/** Listado y detalle: Admin, Coordinador y Profesor. Crear/editar: solo Admin (rutas en el shell /admin). */
const semillerosShellChildren: Routes = [
  {
    path: 'semilleros',
    loadComponent: () =>
      import('./features/semilleros/semilleros-list/semilleros-list.component').then(
        (m) => m.SemillerosListComponent,
      ),
  },
  {
    path: 'semilleros/:id',
    loadComponent: () =>
      import('./features/semilleros/semillero-detalle/semillero-detalle.component').then(
        (m) => m.SemilleroDetalleComponent,
      ),
  },
];

const semillerosAdminChildren: Routes = [
  {
    path: 'semilleros/crear',
    loadComponent: () =>
      import('./features/semilleros/semillero-form/semillero-form.component').then(
        (m) => m.SemilleroFormComponent,
      ),
  },
  {
    path: 'semilleros/:id/editar',
    loadComponent: () =>
      import('./features/semilleros/semillero-form/semillero-form.component').then(
        (m) => m.SemilleroFormComponent,
      ),
  },
  ...semillerosShellChildren,
];

/** Admin y Coordinador: consulta de todos los proyectos (mismas pantallas del profesor, sin acciones de revisión). */
const proyectosConsultaChildren: Routes = [
  {
    path: 'proyectos',
    loadComponent: () =>
      import('./features/proyectos-profesor/proyectos-prof-list/proyectos-prof-list.component').then(
        (m) => m.ProyectosProfListComponent,
      ),
  },
  {
    path: 'proyectos/:id',
    loadComponent: () =>
      import('./features/proyectos-profesor/proyectos-prof-detalle/proyectos-prof-detalle.component').then(
        (m) => m.ProyectosProfDetalleComponent,
      ),
  },
];

/** Profesor: cursos en solo lectura (crear/editar/eliminar sigue siendo del administrador). */
const cursosProfChildren: Routes = [
  {
    path: 'cursos',
    loadComponent: () =>
      import('./features/cursos/cursos-list/cursos-list.component').then((m) => m.CursosListComponent),
  },
];

const loadReportes = () =>
  import('./features/reportes/reportes-page/reportes-page.component').then(
    (m) => m.ReportesPageComponent,
  );

const usuariosShellChildren: Routes = [
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/usuarios-list/usuarios-list.component').then(
        (m) => m.UsuariosListComponent,
      ),
  },
  {
    path: 'usuarios/crear',
    loadComponent: () =>
      import('./features/usuarios/usuarios-form/usuarios-form.component').then(
        (m) => m.UsuariosFormComponent,
      ),
  },
  {
    path: 'usuarios/:id/editar',
    loadComponent: () =>
      import('./features/usuarios/usuarios-form/usuarios-form.component').then(
        (m) => m.UsuariosFormComponent,
      ),
  },
];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/portal-shell/portal-shell.component').then(
        (m) => m.PortalShellComponent,
      ),
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
      {
        path: 'semilleros',
        canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
        data: { roles: ['Estudiante'], portalTheme: true },
        loadComponent: () =>
          import('./features/semilleros/portal-semilleros/portal-semilleros.component').then(
            (m) => m.PortalSemillerosComponent,
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
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
    loadComponent: () =>
      import('./features/auth/cambiar-password/cambiar-password.component').then(
        (m) => m.CambiarPasswordComponent,
      ),
    canActivate: [CambiarPasswordGuard],
  },
  {
    path: 'completar-perfil',
    loadComponent: () =>
      import('./features/auth/completar-perfil/completar-perfil.component').then(
        (m) => m.CompletarPerfilComponent,
      ),
    canActivate: [authGuard, completarPerfilGuard],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleRedirectGuard],
    children: [],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./shared/layout/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
    data: { roles: ['Administrador'], shellRole: 'Administrador', shellPrefix: '/admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      ...usuariosShellChildren,
      ...escuelasShellChildren,
      ...cursosAdminChildren,
      ...proyectosConsultaChildren,
      ...semillerosAdminChildren,
      ...eventosShellChildren,
      { path: 'reportes', loadComponent: loadReportes },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion-page/configuracion-page.component').then(
            (m) => m.ConfiguracionPageComponent,
          ),
      },
    ],
  },
  {
    path: 'coord',
    loadComponent: () =>
      import('./shared/layout/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
    data: { roles: ['Coordinador'], shellRole: 'Coordinador', shellPrefix: '/coord' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/coordinador/dashboard/coord-dashboard.component').then(
            (m) => m.CoordDashboardComponent,
          ),
      },
      ...escuelasShellChildren,
      ...proyectosConsultaChildren,
      ...semillerosShellChildren,
      ...eventosShellChildren,
      { path: 'estadisticas', loadComponent: loadReportes },
    ],
  },
  {
    path: 'prof',
    loadComponent: () =>
      import('./shared/layout/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    canActivate: [authGuard, primerLoginGuard, perfilPendienteGuard, roleGuard],
    data: { roles: ['Profesor'], shellRole: 'Profesor', shellPrefix: '/prof' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/profesor/dashboard/prof-dashboard.component').then(
            (m) => m.ProfDashboardComponent,
          ),
      },
      ...proyectosProfChildren,
      ...semillerosShellChildren,
      ...cursosProfChildren,
      ...eventosProfChildren,
    ],
  },
  {
    path: 'eventos/:id/asistencia',
    loadComponent: () =>
      import('./features/eventos/asistencia-qr.component').then((m) => m.AsistenciaQrComponent),
    data: { mobileMode: true, portalTheme: true },
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
