import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/models/prisma.client', () => ({ prisma: {} }));

import { construirResumen } from '../src/services/reporte.service';
import type { DatosResumen } from '../src/models/reporte.repository';

function datos(parcial: Partial<DatosResumen> = {}): DatosResumen {
  return {
    roles: [
      { id_rol: 1, nombre_rol: 'Administrador' },
      { id_rol: 4, nombre_rol: 'Estudiante' },
    ],
    usuariosPorRol: [],
    usuariosInactivos: 0,
    escuelas: [],
    cursos: [],
    proyectosPorCursoEstado: [],
    semilleros: [],
    miembrosPorEstado: [],
    eventosPorEstado: [],
    inscripciones: 0,
    asistencias: 0,
    ...parcial,
  };
}

describe('construirResumen', () => {
  it('devuelve ceros y todos los estados conocidos cuando no hay datos', () => {
    const r = construirResumen(datos(), new Date('2026-10-15T00:00:00Z'));

    expect(r.generado_en).toBe('2026-10-15T00:00:00.000Z');
    expect(r.totales.proyectos).toBe(0);
    expect(r.proyectos_por_estado.map((p) => p.estado)).toEqual([
      'borrador',
      'en_revision',
      'aprobado',
      'rechazado',
      'publicado',
    ]);
    expect(r.eventos_por_estado.every((e) => e.total === 0)).toBe(true);
    expect(r.membresias_por_estado.map((m) => m.estado)).toEqual(['pendiente', 'aprobado', 'rechazado']);
  });

  it('nombra los roles y ordena usuarios por cantidad descendente', () => {
    const r = construirResumen(
      datos({
        usuariosPorRol: [
          { id_rol: 1, total: 2 },
          { id_rol: 4, total: 40 },
          { id_rol: 99, total: 1 },
        ],
      }),
    );

    expect(r.usuarios_por_rol).toEqual([
      { rol: 'Estudiante', total: 40 },
      { rol: 'Administrador', total: 2 },
      { rol: 'Rol 99', total: 1 },
    ]);
    expect(r.totales.usuarios).toBe(43);
  });

  it('agrega proyectos por escuela a través de sus cursos e ignora cursos eliminados', () => {
    const r = construirResumen(
      datos({
        escuelas: [
          { id_escuela: 1, nombre_escuela: 'Software' },
          { id_escuela: 2, nombre_escuela: 'Diseño' },
        ],
        cursos: [
          { id_curso: 10, id_escuela: 1 },
          { id_curso: 11, id_escuela: 1 },
        ],
        proyectosPorCursoEstado: [
          { id_curso: 10, estado: 'publicado', total: 3 },
          { id_curso: 11, estado: 'borrador', total: 2 },
          { id_curso: 11, estado: 'publicado', total: 1 },
          { id_curso: 999, estado: 'publicado', total: 7 }, // curso eliminado
        ],
      }),
    );

    expect(r.proyectos_por_escuela).toEqual([
      { id_escuela: 1, escuela: 'Software', total: 6, publicados: 4 },
      { id_escuela: 2, escuela: 'Diseño', total: 0, publicados: 0 },
    ]);
    // Los totales globales sí cuentan todos los proyectos activos.
    expect(r.totales.proyectos).toBe(13);
    expect(r.totales.proyectos_publicados).toBe(11);
  });

  it('conserva estados no previstos al final del desglose', () => {
    const r = construirResumen(datos({ eventosPorEstado: [{ estado: 'cancelado', total: 2 }] }));

    expect(r.eventos_por_estado.at(-1)).toEqual({ estado: 'cancelado', total: 2 });
    expect(r.totales.eventos).toBe(2);
  });

  it('distingue semilleros activos del total', () => {
    const r = construirResumen(datos({ semilleros: [{ activo: true }, { activo: false }, { activo: true }] }));

    expect(r.totales.semilleros).toBe(3);
    expect(r.totales.semilleros_activos).toBe(2);
  });
});
