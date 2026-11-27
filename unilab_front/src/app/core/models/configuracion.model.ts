/** Parámetros del sistema (RA-013). Espejo de CONFIGURACION_POR_DEFECTO en el backend. */
export interface ConfiguracionSistema {
  registro_abierto: boolean;
  semilleros_solicitudes_abiertas: boolean;
  mensaje_portal: string;
  /** Porcentaje mínimo de jornadas asistidas para recibir el certificado de un evento. */
  certificado_porcentaje_minimo: number;
}
