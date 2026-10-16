import { proximosEventos, saludoKey } from './dashboard.util';
import type { Evento } from '../../../core/models/evento.model';

const ev = (id: number, inicio: string, fin: string) =>
  ({ id_evento: id, nombre_evento: `E${id}`, fecha_inicio: `${inicio}T00:00:00.000Z`, fecha_fin: `${fin}T00:00:00.000Z` }) as Evento;

describe('dashboard.util', () => {
  it('saluda según la hora', () => {
    expect(saludoKey(new Date(2026, 9, 15, 8))).toBe('panel.saludo.manana');
    expect(saludoKey(new Date(2026, 9, 15, 15))).toBe('panel.saludo.tarde');
    expect(saludoKey(new Date(2026, 9, 15, 21))).toBe('panel.saludo.noche');
  });

  it('muestra solo eventos vigentes: en curso primero y luego por fecha', () => {
    const hoy = new Date(2026, 9, 15, 12);
    const lista = proximosEventos(
      [ev(1, '2026-10-01', '2026-10-02'), ev(2, '2026-11-20', '2026-11-21'), ev(3, '2026-10-14', '2026-10-16'), ev(4, '2026-10-30', '2026-10-30')],
      'es',
      4,
      hoy,
    );
    expect(lista.map((x) => x.evento.id_evento)).toEqual([3, 4, 2]);
    expect(lista[0].enCurso).toBe(true);
    expect(lista[1].dia).toBe(30);
  });
});
