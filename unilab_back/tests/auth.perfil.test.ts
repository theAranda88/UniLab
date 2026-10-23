import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  usuarioRepository: {
    findByEmail: vi.fn(),
    findPerfilSesion: vi.fn(),
    findPasswordHash: vi.fn(),
    update: vi.fn(),
    updatePerfilCoordinador: vi.fn(),
  },
  verificarPassword: vi.fn(),
  hashearPassword: vi.fn(),
}));

vi.mock('../src/models/usuario.repository', () => ({ usuarioRepository: m.usuarioRepository }));
vi.mock('../src/models/escuela.repository', () => ({ escuelaRepository: {} }));
vi.mock('../src/services/configuracion.service', () => ({ configuracionService: { obtener: vi.fn() } }));
vi.mock('../src/utils/password', () => ({
  verificarPassword: m.verificarPassword,
  hashearPassword: m.hashearPassword,
  generarPasswordAleatoria: vi.fn(),
}));

import { authService, mapUsuarioSesion } from '../src/services/auth.service';

const IA = { id_semillero: 2, nombre_semillero: 'IA aplicada' };
const ROBOTICA = { id_semillero: 3, nombre_semillero: 'Robótica' };

function perfil(overrides: Record<string, unknown> = {}) {
  return {
    id_usuario: 7,
    nombres: 'Ana',
    apellidos: 'Gómez',
    email: 'ana@uniautonoma.edu.co',
    telefono: '3001234567',
    primer_login: false,
    perfil_pendiente: false,
    activo: true,
    url_linkedin: 'https://www.linkedin.com/in/ana',
    url_github: null,
    url_portafolio: null,
    rol: { nombre_rol: 'Estudiante' },
    perfil_coordinador: null,
    perfil_profesor: null,
    perfil_estudiante: { codigo_estudiantil: 'E-001', escuela: { id_escuela: 1, nombre_escuela: 'Ingeniería' } },
    perfil_externo: null,
    semilleros_como_lider: [],
    semilleros_como_profesor: [],
    membresias_semillero: [],
    ...overrides,
  } as Parameters<typeof mapUsuarioSesion>[0];
}

describe('mapUsuarioSesion', () => {
  it('incluye nombres, escuela, redes y datos del perfil', () => {
    const s = mapUsuarioSesion(perfil());
    expect(s).toMatchObject({
      nombres: 'Ana',
      apellidos: 'Gómez',
      id_rol: 'Estudiante',
      escuela: { id_escuela: 1, nombre_escuela: 'Ingeniería' },
      redes: { linkedin: 'https://www.linkedin.com/in/ana', github: null, portafolio: null },
      perfil: { codigo_estudiantil: 'E-001', codigo_docente: null },
    });
  });

  it('lista los semilleros del estudiante como miembro', () => {
    const s = mapUsuarioSesion(perfil({ membresias_semillero: [{ semillero: ROBOTICA }, { semillero: IA }] }));
    expect(s.semilleros).toEqual([
      { ...IA, rol_semillero: 'miembro' },
      { ...ROBOTICA, rol_semillero: 'miembro' },
    ]);
  });

  it('une semilleros del profesor sin duplicar y prioriza el rol de líder', () => {
    const s = mapUsuarioSesion(
      perfil({
        rol: { nombre_rol: 'Profesor' },
        perfil_estudiante: null,
        perfil_profesor: { codigo_docente: 'D-9', escuela: { id_escuela: 4, nombre_escuela: 'Artes' } },
        semilleros_como_profesor: [
          { es_lider: false, semillero: IA },
          { es_lider: false, semillero: ROBOTICA },
        ],
        semilleros_como_lider: [IA],
      }),
    );
    expect(s.escuela).toEqual({ id_escuela: 4, nombre_escuela: 'Artes' });
    expect(s.semilleros).toEqual([
      { ...IA, rol_semillero: 'lider' },
      { ...ROBOTICA, rol_semillero: 'profesor' },
    ]);
  });

  it('devuelve escuela null para roles sin perfil académico', () => {
    const s = mapUsuarioSesion(
      perfil({
        rol: { nombre_rol: 'Coordinador' },
        perfil_estudiante: null,
        perfil_coordinador: {
          cargo: 'Coordinador académico',
          dependencia: 'Vicerrectoría',
          profesion: 'Ingeniera de sistemas',
        },
      }),
    );
    expect(s.escuela).toBeNull();
    expect(s.perfil.cargo).toBe('Coordinador académico');
    expect(s.perfil.profesion).toBe('Ingeniera de sistemas');
  });
});

describe('authService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('login devuelve el token y la sesión completa', async () => {
    m.usuarioRepository.findByEmail.mockResolvedValue({
      id_usuario: 7,
      email: 'ana@uniautonoma.edu.co',
      password_hash: 'hash',
      rol: { nombre_rol: 'Estudiante' },
    });
    m.verificarPassword.mockResolvedValue(true);
    m.usuarioRepository.findPerfilSesion.mockResolvedValue(perfil());

    const r = await authService.login('ana@uniautonoma.edu.co', 'secreta');

    expect(r.token).toEqual(expect.any(String));
    expect(r.usuario.nombres).toBe('Ana');
    expect(r.usuario.escuela?.nombre_escuela).toBe('Ingeniería');
    expect(r.usuario).not.toHaveProperty('password_hash');
  });

  it('login rechaza credenciales inválidas sin consultar el perfil', async () => {
    m.usuarioRepository.findByEmail.mockResolvedValue({ password_hash: 'hash' });
    m.verificarPassword.mockResolvedValue(false);

    await expect(authService.login('x@y.co', 'mala')).rejects.toMatchObject({ statusCode: 401 });
    expect(m.usuarioRepository.findPerfilSesion).not.toHaveBeenCalled();
  });

  it('obtenerSesion responde 404 si el usuario ya no existe', async () => {
    m.usuarioRepository.findPerfilSesion.mockResolvedValue(null);
    await expect(authService.obtenerSesion(99)).rejects.toMatchObject({ statusCode: 404 });
  });

  const ESTUDIANTE = { id_usuario: 7, id_rol: 'Estudiante' };
  const COORDINADOR = { id_usuario: 2, id_rol: 'Coordinador' };

  it('actualizarMiPerfil guarda teléfono y redes y devuelve la sesión', async () => {
    m.usuarioRepository.findPerfilSesion.mockResolvedValue(perfil({ url_github: 'https://github.com/ana' }));

    const r = await authService.actualizarMiPerfil(ESTUDIANTE, {
      telefono: '3109876543',
      url_github: 'https://github.com/ana',
    });

    expect(m.usuarioRepository.update).toHaveBeenCalledWith(7, {
      telefono: '3109876543',
      url_github: 'https://github.com/ana',
    });
    expect(m.usuarioRepository.updatePerfilCoordinador).not.toHaveBeenCalled();
    expect(r.redes.github).toBe('https://github.com/ana');
  });

  it('el coordinador puede registrar su profesión', async () => {
    m.usuarioRepository.findPerfilSesion.mockResolvedValue(perfil());
    await authService.actualizarMiPerfil(COORDINADOR, { profesion: 'Psicóloga' });
    expect(m.usuarioRepository.updatePerfilCoordinador).toHaveBeenCalledWith(2, { profesion: 'Psicóloga' });
    expect(m.usuarioRepository.update).not.toHaveBeenCalled();
  });

  it('otros roles no pueden registrar profesión', async () => {
    await expect(authService.actualizarMiPerfil(ESTUDIANTE, { profesion: 'X' })).rejects.toMatchObject({
      statusCode: 422,
    });
    expect(m.usuarioRepository.update).not.toHaveBeenCalled();
  });

  it('cambiarMiPassword rechaza una contraseña actual incorrecta', async () => {
    m.usuarioRepository.findPasswordHash.mockResolvedValue({ password_hash: 'hash' });
    m.verificarPassword.mockResolvedValue(false);
    await expect(authService.cambiarMiPassword(7, 'mala', 'NuevaClave2026')).rejects.toMatchObject({
      statusCode: 422,
    });
    expect(m.usuarioRepository.update).not.toHaveBeenCalled();
  });

  it('cambiarMiPassword guarda el nuevo hash', async () => {
    m.usuarioRepository.findPasswordHash.mockResolvedValue({ password_hash: 'hash' });
    m.verificarPassword.mockResolvedValue(true);
    m.hashearPassword.mockResolvedValue('nuevo-hash');

    await authService.cambiarMiPassword(7, 'Password123!', 'NuevaClave2026');

    expect(m.hashearPassword).toHaveBeenCalledWith('NuevaClave2026');
    expect(m.usuarioRepository.update).toHaveBeenCalledWith(7, { password_hash: 'nuevo-hash', primer_login: false });
  });
});
