import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida una URL http(s) opcional y, si se indica, que pertenezca a un dominio
 * (p. ej. linkedin.com o github.com). Replica la regla del backend.
 */
export function urlRedValidator(dominio?: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return null;
    let url: URL;
    try {
      url = new URL(valor);
    } catch {
      return { url: true };
    }
    if (!/^https?:$/.test(url.protocol)) return { url: true };
    if (dominio && !dominio.test(url.hostname)) return { dominio: true };
    return null;
  };
}

export const LINKEDIN_DOMINIO = /(^|\.)linkedin\.com$/i;
export const GITHUB_DOMINIO = /(^|\.)github\.com$/i;

/** Convierte los campos del formulario en el cuerpo que espera el backend ('' → null). */
export function redesDesdeFormulario(raw: { url_linkedin: string; url_github: string; url_portafolio: string }) {
  return {
    url_linkedin: raw.url_linkedin.trim() || null,
    url_github: raw.url_github.trim() || null,
    url_portafolio: raw.url_portafolio.trim() || null,
  };
}
