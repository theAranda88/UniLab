export interface DashboardStat {
  labelKey: string;
  num: string;
  subKey: string;
  accent?: boolean;
}

export interface DashboardListItem {
  icon: string;
  iconVariant: 'accent' | 'warning' | 'success' | 'danger';
  titleKey: string;
  subKey: string;
  pillKey: string;
  pillVariant: 'pub' | 'rev' | 'pen' | 'ok';
}

export interface DashboardCardData {
  titleKey: string;
  linkKey: string;
  items: DashboardListItem[];
}

export interface RoleDashboardMock {
  stats: DashboardStat[];
  left: DashboardCardData;
}

export const DASHBOARD_MOCK: Record<'Administrador' | 'Coordinador' | 'Profesor', RoleDashboardMock> = {
  Administrador: {
    stats: [
      { labelKey: 'dashboard.admin.stats.usuarios', num: '284', subKey: 'dashboard.admin.stats.usuariosSub', accent: true },
      { labelKey: 'dashboard.admin.stats.proyectos', num: '147', subKey: 'dashboard.admin.stats.proyectosSub' },
      { labelKey: 'dashboard.admin.stats.semilleros', num: '9', subKey: 'dashboard.admin.stats.semillerosSub' },
      { labelKey: 'dashboard.admin.stats.eventos', num: '4', subKey: 'dashboard.admin.stats.eventosSub' },
    ],
    left: {
      titleKey: 'dashboard.admin.left.title',
      linkKey: 'dashboard.admin.left.link',
      items: [
        {
          icon: 'ti-world',
          iconVariant: 'accent',
          titleKey: 'dashboard.admin.left.item1.title',
          subKey: 'dashboard.admin.left.item1.sub',
          pillKey: 'dashboard.admin.pills.publicado',
          pillVariant: 'pub',
        },
        {
          icon: 'ti-microphone',
          iconVariant: 'warning',
          titleKey: 'dashboard.admin.left.item2.title',
          subKey: 'dashboard.admin.left.item2.sub',
          pillKey: 'dashboard.admin.pills.revision',
          pillVariant: 'rev',
        },
        {
          icon: 'ti-device-mobile',
          iconVariant: 'success',
          titleKey: 'dashboard.admin.left.item3.title',
          subKey: 'dashboard.admin.left.item3.sub',
          pillKey: 'dashboard.admin.pills.publicado',
          pillVariant: 'pub',
        },
      ],
    },
  },
  Coordinador: {
    stats: [
      { labelKey: 'dashboard.coord.stats.proyectos', num: '147', subKey: 'dashboard.coord.stats.proyectosSub', accent: true },
      { labelKey: 'dashboard.coord.stats.calificacion', num: '4.2', subKey: 'dashboard.coord.stats.calificacionSub' },
      { labelKey: 'dashboard.coord.stats.vistas', num: '12.4k', subKey: 'dashboard.coord.stats.vistasSub' },
      { labelKey: 'dashboard.coord.stats.eventos', num: '11', subKey: 'dashboard.coord.stats.eventosSub' },
    ],
    left: {
      titleKey: 'dashboard.coord.left.title',
      linkKey: 'dashboard.coord.left.link',
      items: [
        {
          icon: 'ti-code',
          iconVariant: 'accent',
          titleKey: 'dashboard.coord.left.item1.title',
          subKey: 'dashboard.coord.left.item1.sub',
          pillKey: 'dashboard.coord.pills.up23',
          pillVariant: 'ok',
        },
        {
          icon: 'ti-building',
          iconVariant: 'warning',
          titleKey: 'dashboard.coord.left.item2.title',
          subKey: 'dashboard.coord.left.item2.sub',
          pillKey: 'dashboard.coord.pills.up11',
          pillVariant: 'rev',
        },
        {
          icon: 'ti-cash',
          iconVariant: 'success',
          titleKey: 'dashboard.coord.left.item3.title',
          subKey: 'dashboard.coord.left.item3.sub',
          pillKey: 'dashboard.coord.pills.up9',
          pillVariant: 'ok',
        },
      ],
    },
  },
  Profesor: {
    stats: [
      { labelKey: 'dashboard.prof.stats.estudiantes', num: '28', subKey: 'dashboard.prof.stats.estudiantesSub', accent: true },
      { labelKey: 'dashboard.prof.stats.proyectos', num: '14', subKey: 'dashboard.prof.stats.proyectosSub' },
      { labelKey: 'dashboard.prof.stats.autorizaciones', num: '11', subKey: 'dashboard.prof.stats.autorizacionesSub' },
      { labelKey: 'dashboard.prof.stats.comentarios', num: '47', subKey: 'dashboard.prof.stats.comentariosSub' },
    ],
    left: {
      titleKey: 'dashboard.prof.left.title',
      linkKey: 'dashboard.prof.left.link',
      items: [
        {
          icon: 'ti-user',
          iconVariant: 'warning',
          titleKey: 'dashboard.prof.left.item1.title',
          subKey: 'dashboard.prof.left.item1.sub',
          pillKey: 'dashboard.prof.pills.pendiente',
          pillVariant: 'rev',
        },
        {
          icon: 'ti-user',
          iconVariant: 'warning',
          titleKey: 'dashboard.prof.left.item2.title',
          subKey: 'dashboard.prof.left.item2.sub',
          pillKey: 'dashboard.prof.pills.pendiente',
          pillVariant: 'rev',
        },
        {
          icon: 'ti-user',
          iconVariant: 'success',
          titleKey: 'dashboard.prof.left.item3.title',
          subKey: 'dashboard.prof.left.item3.sub',
          pillKey: 'dashboard.prof.pills.listo',
          pillVariant: 'ok',
        },
      ],
    },
  },
};

export const DASHBOARD_PROF_RIGHT: DashboardCardData = {
  titleKey: 'dashboard.prof.right.title',
  linkKey: 'dashboard.prof.right.link',
  items: [
    {
      icon: 'ti-world',
      iconVariant: 'accent',
      titleKey: 'dashboard.prof.right.item1.title',
      subKey: 'dashboard.prof.right.item1.sub',
      pillKey: 'dashboard.prof.pills.revision',
      pillVariant: 'rev',
    },
    {
      icon: 'ti-device-mobile',
      iconVariant: 'warning',
      titleKey: 'dashboard.prof.right.item2.title',
      subKey: 'dashboard.prof.right.item2.sub',
      pillKey: 'dashboard.prof.pills.revision',
      pillVariant: 'rev',
    },
    {
      icon: 'ti-chart-bar',
      iconVariant: 'success',
      titleKey: 'dashboard.prof.right.item3.title',
      subKey: 'dashboard.prof.right.item3.sub',
      pillKey: 'dashboard.prof.pills.aprobado',
      pillVariant: 'pub',
    },
  ],
};

export const DASHBOARD_COORD_RIGHT: DashboardCardData = {
  titleKey: 'dashboard.coord.right.title',
  linkKey: 'dashboard.coord.right.link',
  items: [
    {
      icon: 'ti-flask',
      iconVariant: 'accent',
      titleKey: 'dashboard.coord.right.item1.title',
      subKey: 'dashboard.coord.right.item1.sub',
      pillKey: 'dashboard.coord.pills.activo',
      pillVariant: 'ok',
    },
    {
      icon: 'ti-leaf',
      iconVariant: 'success',
      titleKey: 'dashboard.coord.right.item2.title',
      subKey: 'dashboard.coord.right.item2.sub',
      pillKey: 'dashboard.coord.pills.activo',
      pillVariant: 'ok',
    },
    {
      icon: 'ti-scale',
      iconVariant: 'warning',
      titleKey: 'dashboard.coord.right.item3.title',
      subKey: 'dashboard.coord.right.item3.sub',
      pillKey: 'dashboard.coord.pills.activo',
      pillVariant: 'ok',
    },
  ],
};
