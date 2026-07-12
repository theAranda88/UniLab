import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private defaultLanguage = 'es';
  private supportedLanguages = ['es', 'en'];

  constructor(private translateService: TranslateService) {}

  /**
   * Inicializa el servicio de traducción
   * Define idioma por defecto y carga el archivo de idioma
   */
  initialize(): void {
    // Prioridad: localStorage > español (defecto)
    const savedLanguage = this.getSavedLanguage();
    const languageToUse = this.validateLanguage(savedLanguage || this.defaultLanguage);

    this.setLanguage(languageToUse);
  }

  /**
   * Establece el idioma actual
   */
  setLanguage(language: string): void {
    const validLanguage = this.validateLanguage(language);
    this.translateService.use(validLanguage);
    localStorage.setItem('unilab_language', validLanguage);
  }

  /**
   * Obtiene el idioma actual
   */
  getCurrentLanguage(): string {
    const currentLang = this.translateService.currentLang;
    return typeof currentLang === 'string' ? currentLang : this.defaultLanguage;
  }

  /**
   * Obtiene los idiomas soportados
   */
  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }

  /**
   * Obtiene el idioma guardado en localStorage
   */
  private getSavedLanguage(): string | null {
    return localStorage.getItem('unilab_language');
  }

  /**
   * Obtiene el idioma del navegador
   */
  private getBrowserLanguage(): string | undefined {
    const browserLang = navigator.language || navigator.languages?.[0];
    return browserLang?.split('-')[0];
  }

  /**
   * Valida que el idioma sea soportado
   */
  private validateLanguage(language: string): string {
    return this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
  }
}
