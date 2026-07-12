import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { i18nProviders } from './core/i18n/i18n.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, httpErrorInterceptor])
    ),
    provideTranslateService(),
    ...i18nProviders
  ]
};
