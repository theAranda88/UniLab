import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  usuarioRepository: {
    findById: vi.fn(),
    findConsulta: vi.fn(),
  },
}));

vi.mock('../src/models/usuario.repository', () => ({ usuarioRepository: m.usuarioRepository }));
vi.mock('../src/models/prisma.client', () => ({ prisma: {} }));

import { usuarioService } from '../src/services/usuario.service';

const ADMIN = { id_usuario: 1, id_rol: 'Administrador' };
const COORD = { id_usuario: 2, id_rol: 'Coordinador' };
const PROF = { id_usuario: 10, id_rol: 'Profesor' };

function fila(id: number, rol: string, apellidos = `Apellido${id}`) {
  return {
    id_usuario: id,
    nombres: `Nombre${id}`,
    apellidos,
    email: `u${id}@uniautonoma.edu.co`,
    telefono: '300',
    activo: true,
    url_linkedin: null,
    url_github: null,
    url_portafolio: null,
    rol: { nombre_rol: rol },
    perfil_profesor: rol === 'Profesor' ? { codigo_docente: `D${id}`, escuela: { id_escuela: 1, nombre_escuela: 'Ing' } } : null,
    perfil_estudiante:
      rol === 'Estudiante' ? { codigo_estudiantil: `E${id}`, escuela: { id_escuela: 1, nombre_escuela: 'Ing' } } : null,
  };
}

describe('usuarioService.listarConsulta', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.usuarioRepository.findConsulta.mockResolvedValue([]);
  });

  it('el coordinador ve profesores y estudiantes de todas las escuelas', async () => {
    await usuarioService.listarConsulta(COORD, {});
    expect(m.usuarioRepository.findConsulta).toHaveBeenCalledWith({
      roles: ['Profesor', 'Estudiante'],
      id_escuela: undefined,
      busqueda: undefined,
    });
  });

  it('el coordinador puede filtrar por rol, escuela y búsqueda', async () => {
    await usuarioService.listarConsulta(COORD, { rol: 'Profesor', id_escuela: 3, busqueda: 'ana' });
    expect(m.usuarioRepository.findConsulta).toHaveBeenCalledWith({
      roles: ['Profesor'],
      id_escuela: 3,
      busqueda: 'ana',
    });
  });

  it('el administrador tiene el mismo alcance que el coordinador', async () => {
    await usuarioService.listarConsulta(ADMIN, { rol: 'Estudiante' });
    expect(m.usuarioRepository.findConsulta).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['Estudiante'] }),
    );
  });

  it('el profesor solo ve estudiantes de su escuela', async () => {
    m.usuarioRepository.findById.mockResolvedValue({ perfil_profesor: { id_escuela: 5 } });
    await usuarioService.listarConsulta(PROF, {});
    expect(m.usuarioRepository.findConsulta).toHaveBeenCalledWith({
      roles: ['Estudiante'],
      id_escuela: 5,
      busqueda: undefined,
    });
  });

  it('el profesor no puede listar profesores', async () => {
    await expect(usuarioService.listarConsulta(PROF, { rol: 'Profesor' })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(m.usuarioRepository.findConsulta).not.toHaveBeenCalled();
  });

  it('el profesor no puede consultar otra escuela', async () => {
    m.usuarioRepository.findById.mockResolvedValue({ perfil_profesor: { id_escuela: 5 } });
    await expect(usuarioService.listarConsulta(PROF, { id_escuela: 6 })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('responde 422 si el profesor no tiene escuela asignada', async () => {
    m.usuarioRepository.findById.mockResolvedValue({ perfil_profesor: null });
    await expect(usuarioService.listarConsulta(PROF, {})).rejects.toMatchObject({ statusCode: 422 });
  });

  it('expone código, escuela y redes sin datos sensibles', async () => {
    m.usuarioRepository.findConsulta.mockResolvedValue([fila(7, 'Estudiante')]);
    const [u] = await usuarioService.listarConsulta(COORD, {});
    expect(u).toEqual({
      id_usuario: 7,
      nombres: 'Nombre7',
      apellidos: 'Apellido7',
      email: 'u7@uniautonoma.edu.co',
      telefono: '300',
      activo: true,
      rol: 'Estudiante',
      codigo: 'E7',
      escuela: { id_escuela: 1, nombre_escuela: 'Ing' },
      redes: { linkedin: null, github: null, portafolio: null },
    });
  });
});
