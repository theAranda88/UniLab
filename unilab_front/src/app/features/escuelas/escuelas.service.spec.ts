import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EscuelasService } from './escuelas.service';

describe('EscuelasService (información de la escuela)', () => {
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
    const req = http.expectOne('http://localhost:3000/api/escuelas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });

});
