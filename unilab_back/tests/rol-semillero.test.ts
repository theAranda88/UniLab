import { describe, expect, it } from 'vitest';
import { rolVisibleEstudiante, rolVisibleProfesor, unirSemillerosConRol } from '../src/utils/rolSemillero';

const IA = { id_semillero: 1, nombre_semillero: 'IA' };
const ROBOTICA = { id_semillero: 2, nombre_semillero: 'Robótica' };

describe('rolSemillero', () => {
  it('traduce el rol del profesor (es_lider manda)', () => {
    expect(rolVisibleProfesor({ es_lider: true, rol: 'acompanante' })).toBe('lider');
    expect(rolVisibleProfesor({ es_lider: false, rol: 'coordinador' })).toBe('coordinador');
    expect(rolVisibleProfesor({ es_lider: false })).toBe('acompanante');
  });

  it('distingue los roles estudiantiles', () => {
    expect(rolVisibleEstudiante('integrante')).toBe('estudiante');
    expect(rolVisibleEstudiante('lider')).toBe('lider_estudiantil');
    expect(rolVisibleEstudiante('coordinador')).toBe('coordinador_estudiantil');
  });

  it('une sin duplicar, se queda con el rol más alto y ordena por nombre', () => {
    const r = unirSemillerosConRol([
      { semillero: ROBOTICA, rol: 'estudiante' },
      { semillero: IA, rol: 'acompanante' },
      { semillero: IA, rol: 'lider' },
      { semillero: ROBOTICA, rol: 'coordinador_estudiantil' },
    ]);
    expect(r).toEqual([
      { semillero: IA, rol: 'lider' },
      { semillero: ROBOTICA, rol: 'coordinador_estudiantil' },
    ]);
  });
});
