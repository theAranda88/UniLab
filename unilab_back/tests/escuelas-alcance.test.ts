import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  usuarioRepository: { findEscuelasIds: vi.fn(), findById: vi.fn(), findByEmail: vi.fn() },
  escuelaRepository: { findById: vi.fn() },
  cursoRepository: { findById: vi.fn(), findMany: vi.fn(), buscarAutorizacionVigente: vi.fn() },
  semilleroRepository: { findById: vi.fn(), findMany: vi.fn() },
  prisma: { escuelas: { findFirst: vi.fn() } },
}));

vi.mock('../src/models/usuario.repository', () => ({ usuarioRepository: m.usuarioRepository }));
vi.mock('../src/models/escuela.repository', () => ({
  escuelaRepository: m.escuelaRepository,
  cursoRepository: m.cursoRepository,
}));
vi.mock('../src/models/semillero.repository', () => ({ semilleroRepository: m.semilleroRepository }));
vi.mock('../src/models/prisma.client', () => ({ prisma: m.prisma }));

import { usuarioService, escuelasDePerfil } from '../src/services/usuario.service';
import { cursoService } from '../src/services/escuela.service';
import { semilleroService } from '../src/services/semillero.service';
import { proyectoService } from '../src/services/proyecto.service';

const ING = { id_escuela: 1, nombre_escuela: 'Ingeniería' };
const NEG = { id_escuela: 2, nombre_escuela: 'Negocios' };

describe('escuelasDePerfil', () => {
  it('une la escuela principal y la secundaria del estudiante', () => {
    expect(escuelasDePerfil({ perfil_estudiante: { escuela: ING, escuela_secundaria: NEG } })).toEqual([ING, NEG]);
  });

  it('devuelve solo la principal si no hay secundaria', () => {
    expect(escuelasDePerfil({ perfil_estudiante: { escuela: ING, escuela_secundaria: null } })).toEqual([ING]);
  });

  it('devuelve la escuela del profesor y nada para roles sin perfil académico', () => {
    expect(escuelasDePerfil({ perfil_profesor: { escuela: NEG } })).toEqual([NEG]);
    expect(escuelasDePerfil({})).toEqual([]);
  });
});

describe('usuarioService.escuelasPermitidas', () => {
  beforeEach(() => vi.resetAllMocks());

  it('limita a estudiantes y profesores a sus escuelas', async () => {
    m.usuarioRepository.findEscuelasIds.mockResolvedValue([1, 2]);
    await expect(usuarioService.escuelasPermitidas(7, 'Estudiante')).resolves.toEqual([1, 2]);
    await expect(usuarioService.escuelasPermitidas(9, 'Profesor')).resolves.toEqual([1, 2]);
  });

  it('no restringe a administradores ni coordinadores', async () => {
    await expect(usuarioService.escuelasPermitidas(1, 'Administrador')).resolves.toBeNull();
    await expect(usuarioService.escuelasPermitidas(2, 'Coordinador')).resolves.toBeNull();
    expect(m.usuarioRepository.findEscuelasIds).not.toHaveBeenCalled();
  });
});

describe('usuarioService.crear — escuela secundaria', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.usuarioRepository.findByEmail.mockResolvedValue(null);
  });

  const base = {
    nombres: 'Ana',
    apellidos: 'Ruiz',
    email: 'ana@uniautonoma.edu.co',
    documento_identidad: '1',
    telefono: '3000000',
    rol: 'Estudiante',
    codigo_estudiantil: 'E1',
    id_escuela: 1,
    created_by: 1,
  };

  it('rechaza una secundaria igual a la principal', async () => {
    Object.assign(m.usuarioRepository, { findRolByNombre: vi.fn().mockResolvedValue({ id_rol: 4 }) });
    await expect(usuarioService.crear({ ...base, id_escuela_secundaria: 1 })).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('rechaza una secundaria inexistente', async () => {
    Object.assign(m.usuarioRepository, { findRolByNombre: vi.fn().mockResolvedValue({ id_rol: 4 }) });
    m.prisma.escuelas.findFirst.mockResolvedValue(null);
    await expect(usuarioService.crear({ ...base, id_escuela_secundaria: 9 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('catálogos filtrados por escuela', () => {
  beforeEach(() => vi.resetAllMocks());

  it('cursos: filtra por las escuelas permitidas', async () => {
    await cursoService.listar(undefined, [1, 2]);
    expect(m.cursoRepository.findMany).toHaveBeenCalledWith({ ids_escuela: [1, 2] });
  });

  it('cursos: prohíbe pedir una escuela ajena', async () => {
    expect(() => cursoService.listar(3, [1, 2])).toThrow(expect.objectContaining({ statusCode: 403 }));
  });

  it('cursos: sin alcance devuelve todo', async () => {
    await cursoService.listar();
    expect(m.cursoRepository.findMany).toHaveBeenCalledWith({});
  });

  it('semilleros: filtra por las escuelas permitidas', async () => {
    await semilleroService.listar([2]);
    expect(m.semilleroRepository.findMany).toHaveBeenCalledWith({ ids_escuela: [2] });
  });
});

describe('proyectoService.crear — escuelas del estudiante', () => {
  beforeEach(() => vi.resetAllMocks());

  const proyecto = {
    id_estudiante: 7,
    id_curso: 10,
    titulo: 'T',
    descripcion: 'D',
    tipo_proyecto: 'web',
    url_aplicativo: 'https://app.test',
  };

  it('rechaza un curso de otra escuela', async () => {
    m.usuarioRepository.findEscuelasIds.mockResolvedValue([1]);
    m.cursoRepository.findById.mockResolvedValue({ id_curso: 10, id_escuela: 2 });
    await expect(proyectoService.crear(proyecto)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('rechaza un semillero de otra escuela', async () => {
    m.usuarioRepository.findEscuelasIds.mockResolvedValue([1]);
    m.cursoRepository.findById.mockResolvedValue({ id_curso: 10, id_escuela: 1 });
    m.semilleroRepository.findById.mockResolvedValue({ id_semillero: 5, id_escuela: 2 });
    await expect(proyectoService.crear({ ...proyecto, id_semillero: 5 })).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('acepta un curso de la escuela secundaria', async () => {
    m.usuarioRepository.findEscuelasIds.mockResolvedValue([1, 2]);
    m.cursoRepository.findById.mockResolvedValue({ id_curso: 10, id_escuela: 2 });
    // Pasa la validación de escuela y falla después, al no haber profesor coordinador.
    await expect(proyectoService.crear(proyecto)).rejects.toMatchObject({
      statusCode: 422,
      message: 'Debe seleccionar un profesor coordinador',
    });
  });
});
