import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { i18nProviders } from './core/i18n/i18n.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    // anchorScrolling: el enlace «Proyectos» del portal lleva a /#escuelas.
    // scrollPositionRestoration: cada navegación nueva empieza arriba (o en el ancla);
    // «atrás/adelante» del navegador recupera la posición que tenía esa página.
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, httpErrorInterceptor])
    ),
    provideTranslateService(),
    ...i18nProviders
  ]
};
