export type ShellRole = 'Administrador' | 'Coordinador' | 'Profesor';

export interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
  enabled: boolean;
  badge?: number;
}

export interface NavSection {
  sectionKey: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<ShellRole, NavSection[]> = {
  Administrador: [
    {
      sectionKey: 'shell.nav.sections.general',
      items: [
        { labelKey: 'shell.nav.dashboard', icon: 'ti-layout-dashboard', route: 'dashboard', enabled: true },
        { labelKey: 'shell.nav.usuarios', icon: 'ti-users', route: 'usuarios', enabled: false, badge: 3 },
        { labelKey: 'shell.nav.escuelas', icon: 'ti-school', route: 'escuelas', enabled: true },
        { labelKey: 'shell.nav.cursos', icon: 'ti-book', route: 'cursos', enabled: false },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.academico',
      items: [
        { labelKey: 'shell.nav.proyectos', icon: 'ti-folders', route: 'proyectos', enabled: false },
        { labelKey: 'shell.nav.semilleros', icon: 'ti-flask', route: 'semilleros', enabled: false },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.eventos',
      items: [
        { labelKey: 'shell.nav.eventos', icon: 'ti-calendar-event', route: 'eventos', enabled: true },
        { labelKey: 'shell.nav.asistencia', icon: 'ti-qrcode', route: 'eventos', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.sistema',
      items: [
        { labelKey: 'shell.nav.reportes', icon: 'ti-chart-bar', route: 'reportes', enabled: false },
        { labelKey: 'shell.nav.configuracion', icon: 'ti-settings', route: 'configuracion', enabled: false },
      ],
    },
  ],
  Coordinador: [
    {
      sectionKey: 'shell.nav.sections.analisis',
      items: [
        { labelKey: 'shell.nav.dashboard', icon: 'ti-layout-dashboard', route: 'dashboard', enabled: true },
        { labelKey: 'shell.nav.escuelas', icon: 'ti-school', route: 'escuelas', enabled: true },
        { labelKey: 'shell.nav.estadisticas', icon: 'ti-chart-pie', route: 'estadisticas', enabled: false },
        { labelKey: 'shell.nav.exportar', icon: 'ti-file-export', route: 'exportar', enabled: false },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.seguimiento',
      items: [
        { labelKey: 'shell.nav.proyectos', icon: 'ti-folders', route: 'proyectos', enabled: false },
        { labelKey: 'shell.nav.semilleros', icon: 'ti-flask', route: 'semilleros', enabled: false },
        { labelKey: 'shell.nav.profesores', icon: 'ti-users', route: 'profesores', enabled: false },
        { labelKey: 'shell.nav.estudiantes', icon: 'ti-school', route: 'estudiantes', enabled: false },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.eventos',
      items: [
        { labelKey: 'shell.nav.eventos', icon: 'ti-calendar-event', route: 'eventos', enabled: true },
        { labelKey: 'shell.nav.asistencia', icon: 'ti-chart-bar', route: 'eventos', enabled: true },
      ],
    },
  ],
  Profesor: [
    {
      sectionKey: 'shell.nav.sections.miGestion',
      items: [
        { labelKey: 'shell.nav.miPanel', icon: 'ti-layout-dashboard', route: 'dashboard', enabled: true },
        { labelKey: 'shell.nav.misSemilleros', icon: 'ti-flask', route: 'semilleros', enabled: false },
        { labelKey: 'shell.nav.misEstudiantes', icon: 'ti-users-group', route: 'estudiantes', enabled: false, badge: 2 },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.proyectos',
      items: [
        { labelKey: 'shell.nav.proyectosAsignados', icon: 'ti-folders', route: 'proyectos', enabled: true },
        { labelKey: 'shell.nav.pendientesAprobar', icon: 'ti-clock-check', route: 'pendientes', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.recursos',
      items: [
        { labelKey: 'shell.nav.cursosCarreras', icon: 'ti-school', route: 'cursos', enabled: false },
        { labelKey: 'shell.nav.eventos', icon: 'ti-calendar-event', route: 'eventos', enabled: true },
      ],
    },
  ],
};

export const SHELL_CTA_BY_ROLE: Record<ShellRole, string> = {
  Administrador: 'shell.cta.crearUsuario',
  Coordinador: 'shell.cta.exportarReporte',
  Profesor: 'shell.cta.autorizarEstudiante',
};

export const SHELL_SUBTITLE_BY_ROLE: Record<ShellRole, string> = {
  Administrador: 'shell.roles.admin.sub',
  Coordinador: 'shell.roles.coord.sub',
  Profesor: 'shell.roles.prof.sub',
};
