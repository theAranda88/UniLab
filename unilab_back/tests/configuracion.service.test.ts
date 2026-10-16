import { beforeEach, describe, expect, it, vi } from 'vitest';

const repo = vi.hoisted(() => ({
  findAll: vi.fn(),
  findByClave: vi.fn(),
  upsertMany: vi.fn(),
}));

vi.mock('../src/models/configuracion.repository', () => ({ configuracionRepository: repo }));

import { CONFIGURACION_POR_DEFECTO, configuracionService } from '../src/services/configuracion.service';

describe('configuracionService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('usa los valores por defecto cuando no hay nada guardado', async () => {
    repo.findAll.mockResolvedValue([]);

    expect(await configuracionService.obtenerTodo()).toEqual(CONFIGURACION_POR_DEFECTO);
  });

  it('deserializa booleanos e ignora claves que ya no existen en el catálogo', async () => {
    repo.findAll.mockResolvedValue([
      { clave: 'registro_abierto', valor: 'false' },
      { clave: 'mensaje_portal', valor: 'Mantenimiento el sábado' },
      { clave: 'clave_obsoleta', valor: 'x' },
    ]);

    const config = await configuracionService.obtenerTodo();

    expect(config.registro_abierto).toBe(false);
    expect(config.mensaje_portal).toBe('Mantenimiento el sábado');
    expect(config).not.toHaveProperty('clave_obsoleta');
  });

  it('obtener devuelve el valor guardado o el de por defecto', async () => {
    repo.findByClave.mockResolvedValueOnce({ clave: 'registro_abierto', valor: 'false' });
    expect(await configuracionService.obtener('registro_abierto')).toBe(false);

    repo.findByClave.mockResolvedValueOnce(null);
    expect(await configuracionService.obtener('registro_abierto')).toBe(true);
  });

  it('actualizar serializa los valores y registra quién los cambió', async () => {
    repo.findAll.mockResolvedValue([]);

    await configuracionService.actualizar({ registro_abierto: false, mensaje_portal: 'Hola' }, 7);

    expect(repo.upsertMany).toHaveBeenCalledWith(
      [
        { clave: 'registro_abierto', valor: 'false' },
        { clave: 'mensaje_portal', valor: 'Hola' },
      ],
      7,
    );
  });

  it('actualizar no escribe si no hay cambios válidos', async () => {
    repo.findAll.mockResolvedValue([]);

    await configuracionService.actualizar({ desconocida: true } as never, 7);

    expect(repo.upsertMany).not.toHaveBeenCalled();
  });
});
