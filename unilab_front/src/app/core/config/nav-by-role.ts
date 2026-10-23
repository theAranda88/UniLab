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
  /** Ícono del grupo plegable en la barra lateral. */
  icon: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<ShellRole, NavSection[]> = {
  Administrador: [
    {
      sectionKey: 'shell.nav.sections.general',
      icon: 'ti-layout-grid',
      items: [
        { labelKey: 'shell.nav.dashboard', icon: 'ti-layout-dashboard', route: 'dashboard', enabled: true },
        { labelKey: 'shell.nav.usuarios', icon: 'ti-users', route: 'usuarios', enabled: true },
        { labelKey: 'shell.nav.escuelas', icon: 'ti-school', route: 'escuelas', enabled: true },
        { labelKey: 'shell.nav.cursos', icon: 'ti-book', route: 'cursos', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.academico',
      icon: 'ti-school',
      items: [
        { labelKey: 'shell.nav.proyectos', icon: 'ti-folders', route: 'proyectos', enabled: true },
        { labelKey: 'shell.nav.semilleros', icon: 'ti-flask', route: 'semilleros', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.eventos',
      icon: 'ti-calendar-event',
      items: [
        { labelKey: 'shell.nav.eventos', icon: 'ti-calendar-event', route: 'eventos', enabled: true },
        { labelKey: 'shell.nav.asistencia', icon: 'ti-qrcode', route: 'asistencia', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.sistema',
      icon: 'ti-settings',
      items: [
        { labelKey: 'shell.nav.reportes', icon: 'ti-chart-bar', route: 'reportes', enabled: true },
        { labelKey: 'shell.nav.configuracion', icon: 'ti-settings', route: 'configuracion', enabled: true },
      ],
    },
  ],
  Coordinador: [
    {
      sectionKey: 'shell.nav.sections.analisis',
      icon: 'ti-chart-dots',
      items: [
        { labelKey: 'shell.nav.dashboard', icon: 'ti-layout-dashboard', route: 'dashboard', enabled: true },
        { labelKey: 'shell.nav.escuelas', icon: 'ti-school', route: 'escuelas', enabled: true },
        { labelKey: 'shell.nav.estadisticas', icon: 'ti-chart-pie', route: 'estadisticas', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.seguimiento',
      icon: 'ti-folders',
      items: [
        { labelKey: 'shell.nav.proyectos', icon: 'ti-folders', route: 'proyectos', enabled: true },
        { labelKey: 'shell.nav.semilleros', icon: 'ti-flask', route: 'semilleros', enabled: true },
        { labelKey: 'shell.nav.profesores', icon: 'ti-users', route: 'profesores', enabled: true },
        { labelKey: 'shell.nav.estudiantes', icon: 'ti-school', route: 'estudiantes', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.eventos',
      icon: 'ti-calendar-event',
      items: [
        { labelKey: 'shell.nav.eventos', icon: 'ti-calendar-event', route: 'eventos', enabled: true },
        { labelKey: 'shell.nav.asistencia', icon: 'ti-chart-bar', route: 'asistencia', enabled: true },
      ],
    },
  ],
  Profesor: [
    {
      sectionKey: 'shell.nav.sections.miGestion',
      icon: 'ti-user-circle',
      items: [
        { labelKey: 'shell.nav.miPanel', icon: 'ti-layout-dashboard', route: 'dashboard', enabled: true },
        { labelKey: 'shell.nav.misSemilleros', icon: 'ti-flask', route: 'semilleros', enabled: true },
        { labelKey: 'shell.nav.misEstudiantes', icon: 'ti-users-group', route: 'estudiantes', enabled: false },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.proyectos',
      icon: 'ti-folders',
      items: [
        { labelKey: 'shell.nav.proyectosAsignados', icon: 'ti-folders', route: 'proyectos', enabled: true },
        { labelKey: 'shell.nav.pendientesAprobar', icon: 'ti-clock-check', route: 'pendientes', enabled: true },
      ],
    },
    {
      sectionKey: 'shell.nav.sections.recursos',
      icon: 'ti-books',
      items: [
        { labelKey: 'shell.nav.cursosCarreras', icon: 'ti-school', route: 'cursos', enabled: true },
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
