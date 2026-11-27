import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EscuelasService } from './escuelas.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/escuelas`;

describe('EscuelasService (información e imágenes)', () => {
  let service: EscuelasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EscuelasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear envía descripción, color, ícono y encargado', () => {
    const dto = { nombre_escuela: 'Software', descripcion: 'Desc', color: '#2563eb', icono: 'ph-code', id_encargado: 10 };
    service.crear(dto).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });

  it('subirImagenes envía los archivos en el campo multipart «imagenes»', () => {
    const files = [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.webp', { type: 'image/webp' })];
    service.subirImagenes(4, files).subscribe();
    const req = http.expectOne(`${BASE}/4/imagenes`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.getAll('imagenes').length).toBe(2);
    req.flush([]);
  });

  it('eliminarImagen borra la imagen de la escuela indicada', () => {
    service.eliminarImagen(4, 9).subscribe();
    const req = http.expectOne(`${BASE}/4/imagenes/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
