export function getProyectosBasePath(rol: string | null | undefined): string {
  switch (rol) {
    case 'Administrador':
      return '/admin/proyectos';
    case 'Coordinador':
      return '/coord/proyectos';
    case 'Profesor':
      return '/prof/proyectos';
    default:
      return '/prof/proyectos';
  }
}
