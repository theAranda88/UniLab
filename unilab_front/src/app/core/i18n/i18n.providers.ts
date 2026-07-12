import { APP_INITIALIZER, Provider } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from './i18n.service';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';

/**
 * Factory para inicializar i18n al arrancar la app
 */
function initializeI18n(i18nService: I18nService, translate: TranslateService) {
  return () => {
    // Cargar traducciones estáticamente
    translate.setTranslation('es', es);
    translate.setTranslation('en', en);
    // Inicializar el idioma
    i18nService.initialize();
  };
}

/**
 * Proveedor de i18n para Angular
 */
export const i18nProviders: Provider[] = [
  I18nService,
  {
    provide: APP_INITIALIZER,
    useFactory: initializeI18n,
    deps: [I18nService, TranslateService],
    multi: true
  }
];

