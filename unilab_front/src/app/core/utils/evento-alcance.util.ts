import type { Evento } from '../models/evento.model';

/** Ícono y texto del alcance de un evento: `texto` es un nombre propio; si no hay, se traduce `clave`. */
export interface AlcanceEventoVista {
  icono: string;
  clave: string;
  texto: string | null;
}

export function alcanceEvento(
  ev: Pick<Evento, 'alcance' | 'escuela' | 'semillero' | 'organizacion_externa'>,
): AlcanceEventoVista {
  switch (ev.alcance) {
    case 'escuela':
      return { icono: 'ti-school', clave: 'eventos.alcance.escuela', texto: ev.escuela?.nombre_escuela ?? null };
    case 'semillero':
      return { icono: 'ti-flask', clave: 'eventos.alcance.semillero', texto: ev.semillero?.nombre_semillero ?? null };
    case 'externo':
      return { icono: 'ti-world', clave: 'eventos.alcance.externo', texto: ev.organizacion_externa };
    default:
      return { icono: 'ti-building-bank', clave: 'eventos.alcance.institucional', texto: null };
  }
}
