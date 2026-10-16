/** Extrae YYYY-MM-DD de un ISO sin desfase por zona horaria. */
export function toDateInputValue(iso: string): string {
  return iso.split('T')[0];
}

/** Formatea fecha ISO a dd/mm/yyyy usando solo la parte de fecha. */
export function formatearFechaLocal(iso: string): string {
  const [y, m, d] = toDateInputValue(iso).split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}

/** Día, mes abreviado y año de una fecha ISO en el idioma indicado, sin desfase de zona horaria. */
export function partesFecha(iso: string, idioma = 'es'): { dia: number; mes: string; anio: number } {
  const [y, m, d] = toDateInputValue(iso).split('-').map(Number);
  const mes = new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString(idioma, { month: 'short', timeZone: 'UTC' })
    .replace('.', '');
  return { dia: d, mes, anio: y };
}

/** «6 oct 2026» (o «6 – 7 oct 2026» si es un rango) en el idioma indicado. */
export function formatearRangoFechas(inicio: string, fin: string, idioma = 'es'): string {
  const a = partesFecha(inicio, idioma);
  const b = partesFecha(fin, idioma);
  if (toDateInputValue(inicio) === toDateInputValue(fin)) return `${a.dia} ${a.mes} ${a.anio}`;
  if (a.anio === b.anio && a.mes === b.mes) return `${a.dia} – ${b.dia} ${b.mes} ${b.anio}`;
  if (a.anio === b.anio) return `${a.dia} ${a.mes} – ${b.dia} ${b.mes} ${b.anio}`;
  return `${a.dia} ${a.mes} ${a.anio} – ${b.dia} ${b.mes} ${b.anio}`;
}

export type MomentoEvento = 'proximo' | 'en_curso' | 'pasado';

/**
 * Ubica un evento respecto a hoy comparando solo fechas (las del backend son días completos).
 * `hoy` se recibe para poder probarlo; por defecto, la fecha local actual.
 */
export function momentoEvento(inicio: string, fin: string, hoy = new Date()): MomentoEvento {
  const pad = (n: number) => String(n).padStart(2, '0');
  const hoyIso = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
  if (toDateInputValue(fin) < hoyIso) return 'pasado';
  if (toDateInputValue(inicio) > hoyIso) return 'proximo';
  return 'en_curso';
}
