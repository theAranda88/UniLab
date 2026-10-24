import { describe, expect, it } from 'vitest';
import {
  actualizarMiPerfilSchema,
  configuracionUpdateSchema,
  cambiarMiPasswordSchema,
  consultaUsuariosSchema,
  cursoUpdateSchema,
  escuelaSchema,
  escuelaUpdateSchema,
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

describe('actualizarMiPerfilSchema', () => {
  it('acepta enlaces válidos de cada red', () => {
    const r = actualizarMiPerfilSchema.safeParse({
      url_linkedin: 'https://www.linkedin.com/in/ana',
      url_github: 'https://github.com/ana',
      url_portafolio: 'https://ana.dev',
    });
    expect(r.success).toBe(true);
  });

  it('convierte cadena vacía en null para borrar el valor', () => {
    expect(actualizarMiPerfilSchema.parse({ url_linkedin: '' })).toEqual({ url_linkedin: null });
  });

  it('rechaza dominios equivocados, protocolos no http y cuerpo vacío', () => {
    expect(actualizarMiPerfilSchema.safeParse({ url_linkedin: 'https://evil.com/linkedin.com' }).success).toBe(false);
    expect(actualizarMiPerfilSchema.safeParse({ url_linkedin: 'https://notlinkedin.com/in/a' }).success).toBe(false);
    expect(actualizarMiPerfilSchema.safeParse({ url_github: 'https://gitlab.com/ana' }).success).toBe(false);
    expect(actualizarMiPerfilSchema.safeParse({ url_portafolio: 'javascript:alert(1)' }).success).toBe(false);
    expect(actualizarMiPerfilSchema.safeParse({}).success).toBe(false);
  });

  it('rechaza campos desconocidos', () => {
    expect(actualizarMiPerfilSchema.safeParse({ email: 'x@y.co' }).success).toBe(false);
  });
});

describe('consultaUsuariosSchema', () => {
  it('convierte id_escuela de query string a número', () => {
    expect(consultaUsuariosSchema.parse({ id_escuela: '3' })).toEqual({ id_escuela: 3 });
  });

  it('solo permite filtrar por Profesor o Estudiante', () => {
    expect(consultaUsuariosSchema.safeParse({ rol: 'Administrador' }).success).toBe(false);
    expect(consultaUsuariosSchema.safeParse({ rol: 'Estudiante' }).success).toBe(true);
  });
});

describe('actualizarMiPerfilSchema: teléfono y profesión', () => {
  it('acepta teléfonos con prefijo, espacios o guiones', () => {
    expect(actualizarMiPerfilSchema.safeParse({ telefono: '+57 300 123-4567' }).success).toBe(true);
    expect(actualizarMiPerfilSchema.safeParse({ telefono: '3001234567' }).success).toBe(true);
  });

  it('rechaza teléfonos cortos o con letras', () => {
    expect(actualizarMiPerfilSchema.safeParse({ telefono: '123' }).success).toBe(false);
    expect(actualizarMiPerfilSchema.safeParse({ telefono: '300abc4567' }).success).toBe(false);
  });

  it('profesión vacía se guarda como null', () => {
    expect(actualizarMiPerfilSchema.parse({ profesion: '  ' })).toEqual({ profesion: null });
  });

  it('no permite cambiar rol ni email desde el perfil', () => {
    expect(actualizarMiPerfilSchema.safeParse({ rol: 'Administrador' }).success).toBe(false);
    expect(actualizarMiPerfilSchema.safeParse({ email: 'otro@x.co' }).success).toBe(false);
  });
});

describe('cambiarMiPasswordSchema', () => {
  it('exige mínimo 8 caracteres y que sea distinta de la actual', () => {
    expect(cambiarMiPasswordSchema.safeParse({ password_actual: 'a', nueva_password: 'corta' }).success).toBe(false);
    expect(
      cambiarMiPasswordSchema.safeParse({ password_actual: 'Password123!', nueva_password: 'Password123!' }).success,
    ).toBe(false);
    expect(
      cambiarMiPasswordSchema.safeParse({ password_actual: 'Password123!', nueva_password: 'NuevaClave2026' }).success,
    ).toBe(true);
  });
});

describe('escuelaSchema', () => {
  it('acepta la información completa de la escuela', () => {
    const r = escuelaSchema.parse({
      nombre_escuela: '  Software  ',
      descripcion: 'Desarrollo de software',
      color: '#2563EB',
      icono: 'ph-code',
      id_encargado: 10,
    });
    expect(r.nombre_escuela).toBe('Software');
  });

  it('rechaza color e ícono con formato inválido', () => {
    expect(escuelaSchema.safeParse({ nombre_escuela: 'A', color: 'azul' }).success).toBe(false);
    expect(escuelaSchema.safeParse({ nombre_escuela: 'A', color: '#12345' }).success).toBe(false);
    expect(escuelaSchema.safeParse({ nombre_escuela: 'A', icono: 'ti-code' }).success).toBe(false);
  });

  it('la descripción vacía se guarda como null', () => {
    expect(escuelaSchema.parse({ nombre_escuela: 'A', descripcion: '   ' }).descripcion).toBeNull();
  });

  it('en la actualización exige al menos un campo y permite quitar el encargado', () => {
    expect(escuelaUpdateSchema.safeParse({}).success).toBe(false);
    expect(escuelaUpdateSchema.parse({ id_encargado: null }).id_encargado).toBeNull();
  });
});
