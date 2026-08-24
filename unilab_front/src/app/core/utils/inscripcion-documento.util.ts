const STORAGE_KEY = 'unilab_inscripcion_documento';

export function guardarDocumentoInscripcion(documento: string): void {
  sessionStorage.setItem(STORAGE_KEY, documento.trim());
}

export function obtenerDocumentoInscripcion(): string | null {
  const value = sessionStorage.getItem(STORAGE_KEY);
  return value?.trim() ? value.trim() : null;
}
