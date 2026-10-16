import { configuracionRepository } from '../models/configuracion.repository';

/**
 * Catálogo de parámetros del sistema (RA-013). Cada clave declara su valor por defecto,
 * que aplica mientras el administrador no la haya guardado en `configuracion_sistema`.
 * Para añadir un parámetro: declararlo aquí y en configuracionUpdateSchema.
 */
export const CONFIGURACION_POR_DEFECTO = {
  /** Permite el auto-registro (formulario y Google) de estudiantes y externos. */
  registro_abierto: true,
  /** Permite que los estudiantes envíen solicitudes de ingreso a semilleros. */
  semilleros_solicitudes_abiertas: true,
  /** Aviso visible en el portal público; vacío = sin aviso. */
  mensaje_portal: '',
};

export type Configuracion = typeof CONFIGURACION_POR_DEFECTO;
export type ClaveConfiguracion = keyof Configuracion;

function esClave(clave: string): clave is ClaveConfiguracion {
  return Object.prototype.hasOwnProperty.call(CONFIGURACION_POR_DEFECTO, clave);
}

function deserializar<K extends ClaveConfiguracion>(clave: K, valor: string): Configuracion[K] {
  const defecto = CONFIGURACION_POR_DEFECTO[clave];
  if (typeof defecto === 'boolean') return (valor === 'true') as Configuracion[K];
  return valor as Configuracion[K];
}

export const configuracionService = {
  async obtenerTodo(): Promise<Configuracion> {
    const filas = await configuracionRepository.findAll();
    const resultado: Configuracion = { ...CONFIGURACION_POR_DEFECTO };
    for (const fila of filas) {
      // Claves retiradas del catálogo se ignoran en lugar de filtrarse al cliente.
      if (esClave(fila.clave)) {
        (resultado as Record<ClaveConfiguracion, unknown>)[fila.clave] = deserializar(fila.clave, fila.valor);
      }
    }
    return resultado;
  },

  async obtener<K extends ClaveConfiguracion>(clave: K): Promise<Configuracion[K]> {
    const fila = await configuracionRepository.findByClave(clave);
    return fila ? deserializar(clave, fila.valor) : CONFIGURACION_POR_DEFECTO[clave];
  },

  async actualizar(cambios: Partial<Configuracion>, updated_by: number): Promise<Configuracion> {
    const valores = Object.entries(cambios)
      .filter(([clave, valor]) => esClave(clave) && valor !== undefined)
      .map(([clave, valor]) => ({ clave, valor: String(valor) }));
    if (valores.length > 0) {
      await configuracionRepository.upsertMany(valores, updated_by);
    }
    return configuracionService.obtenerTodo();
  },
};
