export function getDefaultRouteForRole(rol: string): string {
  switch (rol) {
    case 'Administrador':
      return '/admin/dashboard';
    case 'Coordinador':
      return '/coord/dashboard';
    case 'Profesor':
      return '/prof/dashboard';
    case 'Estudiante':
    case 'Externo':
      return '/eventos';
    default:
      return '/login';
  }
}

export function getShellPrefix(rol: string): string | null {
  switch (rol) {
    case 'Administrador':
      return '/admin';
    case 'Coordinador':
      return '/coord';
    case 'Profesor':
      return '/prof';
    default:
      return null;
  }
}
