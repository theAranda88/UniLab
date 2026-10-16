import type { Evento } from '../../../core/models/evento.model';
import { momentoEvento, partesFecha } from '../../../core/utils/date.util';

/** Clave i18n del saludo según la hora local. */
export function saludoKey(ahora = new Date()): string {
  const h = ahora.getHours();
  return h < 12 ? 'panel.saludo.manana' : h < 19 ? 'panel.saludo.tarde' : 'panel.saludo.noche';
}

export interface EventoProximo {
  evento: Evento;
  dia: number;
  mes: string;
  enCurso: boolean;
}

/** Eventos vigentes (en curso primero, luego por fecha de inicio), como mucho `max`. */
export function proximosEventos(eventos: Evento[], idioma: string, max = 4, hoy = new Date()): EventoProximo[] {
  return eventos
    .map((evento) => ({ evento, momento: momentoEvento(evento.fecha_inicio, evento.fecha_fin, hoy) }))
    .filter((x) => x.momento !== 'pasado')
    .sort((a, b) =>
      a.momento !== b.momento
        ? a.momento === 'en_curso'
          ? -1
          : 1
        : a.evento.fecha_inicio.localeCompare(b.evento.fecha_inicio),
    )
    .slice(0, max)
    .map(({ evento, momento }) => {
      const { dia, mes } = partesFecha(evento.fecha_inicio, idioma);
      return { evento, dia, mes, enCurso: momento === 'en_curso' };
    });
}

/** «miércoles, 15 de octubre» en el idioma activo. */
export function fechaLarga(idioma: string, hoy = new Date()): string {
  return hoy.toLocaleDateString(idioma, { weekday: 'long', day: 'numeric', month: 'long' });
}
