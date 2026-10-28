import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfiguracionService } from './configuracion.service';
import type { ConfiguracionSistema } from '../../core/models/configuracion.model';
import { environment } from '../../../environments/environment';

const PUBLICA = `${environment.apiUrl}/public/configuracion`;

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfiguracionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cachea la configuración pública: varias lecturas hacen una sola petición', () => {
    const recibidas: ConfiguracionSistema[] = [];
    service.publica().subscribe((c) => recibidas.push(c));
    service.publica().subscribe((c) => recibidas.push(c));

    http
      .expectOne(PUBLICA)
      .flush({
        registro_abierto: false,
        semilleros_solicitudes_abiertas: true,
        mensaje_portal: 'Hola',
      });

    expect(recibidas).toHaveLength(2);
    expect(recibidas[1].registro_abierto).toBe(false);
  });

  it('si la API falla, el portal sigue funcionando con valores abiertos por defecto', () => {
    let config: ConfiguracionSistema | undefined;
    service.publica().subscribe((c) => (config = c));

    http.expectOne(PUBLICA).flush('caído', { status: 500, statusText: 'Server Error' });

    expect(config).toEqual({
      registro_abierto: true,
      semilleros_solicitudes_abiertas: true,
      mensaje_portal: '',
    });
  });

  it('al guardar invalida la caché pública', () => {
    service.publica().subscribe();
    http
      .expectOne(PUBLICA)
      .flush({ registro_abierto: true, semilleros_solicitudes_abiertas: true, mensaje_portal: '' });

    service.actualizar({ registro_abierto: false }).subscribe();
    const patch = http.expectOne(`${environment.apiUrl}/configuracion`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ registro_abierto: false });
    patch.flush({});

    service.publica().subscribe();
    http
      .expectOne(PUBLICA)
      .flush({
        registro_abierto: false,
        semilleros_solicitudes_abiertas: true,
        mensaje_portal: '',
      });
  });
});
