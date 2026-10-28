import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SemillerosService } from './semilleros.service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/semilleros`;

describe('SemillerosService', () => {
  let service: SemillerosService;
  let http: HttpTestingController;
  let rol = 'Administrador';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => ({ id_usuario: 1, id_rol: rol }) },
        },
      ],
    });
    service = TestBed.inject(SemillerosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('usa la ruta del panel según el rol', () => {
    rol = 'Administrador';
    expect(service.getBasePath()).toBe('/admin/semilleros');
    rol = 'Coordinador';
    expect(service.getBasePath()).toBe('/coord/semilleros');
    rol = 'Profesor';
    expect(service.getBasePath()).toBe('/prof/semilleros');
  });

  it('el estudiante solicita ingreso sin enviar su id (el backend usa el del token)', () => {
    service.solicitarIngreso(4).subscribe();
    const req = http.expectOne(`${API}/4/miembros`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('resuelve una solicitud con el estado elegido', () => {
    service.resolverSolicitud(4, 30, 'aprobado').subscribe();
    const req = http.expectOne(`${API}/4/miembros/30`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado_solicitud: 'aprobado' });
    req.flush({});
  });

  it('autoriza la publicación de un miembro', () => {
    service.autorizarPublicacion(4, 30).subscribe();
    const req = http.expectOne(`${API}/4/miembros/30/autorizar-publicacion`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('asigna y retira profesores', () => {
    service.asignarProfesor(4, 9).subscribe();
    const asignar = http.expectOne(`${API}/4/profesores`);
    expect(asignar.request.body).toEqual({ id_profesor: 9 });
    asignar.flush({});

    service.quitarProfesor(4, 9).subscribe();
    expect(http.expectOne(`${API}/4/profesores/9`).request.method).toBe('DELETE');
  });

  it('sube y elimina la portada', () => {
    const file = new File(['x'], 'portada.webp', { type: 'image/webp' });
    service.subirPortada(2, file).subscribe();
    const subir = http.expectOne(`${API}/2/portada`);
    expect(subir.request.method).toBe('PUT');
    expect(subir.request.body instanceof FormData).toBe(true);
    subir.flush({ url_foto_portada: `${environment.apiUrl.replace(/\/api\/?$/, '')}/uploads/semilleros/2/p.webp` });

    service.eliminarPortada(2).subscribe();
    expect(http.expectOne(`${API}/2/portada`).request.method).toBe('DELETE');
  });

  it('lista, sube y elimina evidencias', () => {
    service.listarEvidencias(2).subscribe();
    http.expectOne(`${API}/2/evidencias`).flush([]);

    const file = new File(['x'], 'ev.webp', { type: 'image/webp' });
    service.subirEvidencias(2, [file]).subscribe();
    const subir = http.expectOne(`${API}/2/evidencias`);
    expect(subir.request.method).toBe('POST');
    subir.flush([{ id_evidencia: 1, id_semillero: 2, url: 'http://x', orden: 1 }]);

    service.eliminarEvidencia(2, 1).subscribe();
    expect(http.expectOne(`${API}/2/evidencias/1`).request.method).toBe('DELETE');
  });
});
