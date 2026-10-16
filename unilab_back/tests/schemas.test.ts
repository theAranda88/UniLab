import { describe, expect, it } from 'vitest';
import {
  configuracionUpdateSchema,
  cursoUpdateSchema,
  proyectoSchema,
  semilleroUpdateSchema,
} from '../src/middlewares/validation/schemas';

describe('configuracionUpdateSchema', () => {
  it('acepta parámetros conocidos', () => {
    expect(configuracionUpdateSchema.safeParse({ registro_abierto: false }).success).toBe(true);
  });

  it('rechaza claves desconocidas, cuerpo vacío y tipos incorrectos', () => {
    expect(configuracionUpdateSchema.safeParse({ hackeo: true }).success).toBe(false);
    expect(configuracionUpdateSchema.safeParse({}).success).toBe(false);
    expect(configuracionUpdateSchema.safeParse({ registro_abierto: 'no' }).success).toBe(false);
  });

  it('limita el mensaje del portal a 280 caracteres y recorta espacios', () => {
    expect(configuracionUpdateSchema.safeParse({ mensaje_portal: 'x'.repeat(281) }).success).toBe(false);
    const r = configuracionUpdateSchema.parse({ mensaje_portal: '  Hola  ' });
    expect(r.mensaje_portal).toBe('Hola');
  });
});

describe('semilleroUpdateSchema', () => {
  it('acepta actualizaciones parciales, incluido activar/desactivar', () => {
    expect(semilleroUpdateSchema.safeParse({ activo: false }).success).toBe(true);
    expect(semilleroUpdateSchema.safeParse({ nombre_semillero: 'IA aplicada' }).success).toBe(true);
  });

  it('descarta campos no permitidos (p. ej. deleted_at)', () => {
    const r = semilleroUpdateSchema.parse({ nombre_semillero: 'IA', deleted_at: null });
    expect(r).toEqual({ nombre_semillero: 'IA' });
  });

  it('rechaza un cuerpo vacío', () => {
    expect(semilleroUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe('cursoUpdateSchema', () => {
  it('acepta un cambio parcial y rechaza el cuerpo vacío', () => {
    expect(cursoUpdateSchema.safeParse({ periodo_academico: '2026-2' }).success).toBe(true);
    expect(cursoUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe('proyectoSchema', () => {
  const base = { id_curso: 1, titulo: 'App', descripcion: 'd', url_youtube: 'https://youtu.be/x' };

  it('exige URL del aplicativo para proyectos web', () => {
    expect(proyectoSchema.safeParse({ ...base, tipo_proyecto: 'web' }).success).toBe(false);
    expect(
      proyectoSchema.safeParse({ ...base, tipo_proyecto: 'web', url_aplicativo: 'https://app.test' }).success,
    ).toBe(true);
  });

  it('exige APK para proyectos móviles', () => {
    const movil = { ...base, tipo_proyecto: 'movil', url_aplicativo: 'https://app.test' };
    expect(proyectoSchema.safeParse(movil).success).toBe(false);
    expect(proyectoSchema.safeParse({ ...movil, url_apk: 'https://app.test/a.apk' }).success).toBe(true);
  });

  it('un podcast solo requiere YouTube', () => {
    expect(proyectoSchema.safeParse({ ...base, tipo_proyecto: 'podcast' }).success).toBe(true);
  });
});
