export function getEscuelasBasePath(rol: string | null | undefined): string {
  switch (rol) {
    case 'Administrador':
      return '/admin/escuelas';
    case 'Coordinador':
      return '/coord/escuelas';
    default:
      return '/admin/escuelas';
  }
}
