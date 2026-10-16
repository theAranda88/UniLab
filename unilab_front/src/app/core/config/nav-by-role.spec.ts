import type { Route } from '@angular/router';
import { NAV_BY_ROLE, type ShellRole } from './nav-by-role';
import { routes } from '../../app.routes';

const PREFIJO: Record<ShellRole, string> = {
  Administrador: 'admin',
  Coordinador: 'coord',
  Profesor: 'prof',
};

function rutasDelShell(prefijo: string): string[] {
  const shell = routes.find((r: Route) => r.path === prefijo);
  return (shell?.children ?? []).map((r) => r.path ?? '');
}

describe('NAV_BY_ROLE', () => {
  for (const rol of Object.keys(NAV_BY_ROLE) as ShellRole[]) {
    it(`${rol}: cada ítem habilitado del menú tiene una ruta en el shell`, () => {
      const rutas = rutasDelShell(PREFIJO[rol]);
      const habilitados = NAV_BY_ROLE[rol].flatMap((s) => s.items).filter((i) => i.enabled);

      const sinRuta = habilitados.filter((i) => !rutas.includes(i.route)).map((i) => i.route);
      expect(sinRuta).toEqual([]);
    });
  }

  it('habilita los módulos de cursos, semilleros, reportes y configuración', () => {
    const habilitadas = (rol: ShellRole) =>
      NAV_BY_ROLE[rol]
        .flatMap((s) => s.items)
        .filter((i) => i.enabled)
        .map((i) => i.route);

    expect(habilitadas('Administrador')).toEqual(
      expect.arrayContaining(['cursos', 'semilleros', 'reportes', 'configuracion']),
    );
    expect(habilitadas('Coordinador')).toEqual(
      expect.arrayContaining(['semilleros', 'estadisticas']),
    );
    expect(habilitadas('Profesor')).toContain('semilleros');
  });
});
