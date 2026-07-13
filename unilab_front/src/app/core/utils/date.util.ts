/** Extrae YYYY-MM-DD de un ISO sin desfase por zona horaria. */
export function toDateInputValue(iso: string): string {
  return iso.split('T')[0];
}

/** Formatea fecha ISO a dd/mm/yyyy usando solo la parte de fecha. */
export function formatearFechaLocal(iso: string): string {
  const [y, m, d] = toDateInputValue(iso).split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}
