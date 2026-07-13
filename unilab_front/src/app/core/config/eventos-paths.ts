export function getEventosBasePath(rol: string | null | undefined): string {
  switch (rol) {
    case 'Administrador':
      return '/admin/eventos';
    case 'Coordinador':
      return '/coord/eventos';
    case 'Profesor':
      return '/prof/eventos';
    default:
      return '/eventos';
  }
}
