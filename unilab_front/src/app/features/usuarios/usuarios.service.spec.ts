import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService (consultas de solo lectura)', () => {
  let service: UsuariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consultar envía solo los filtros indicados', () => {
    service.consultar({ rol: 'Profesor', id_escuela: 3 }).subscribe();
    const req = http.expectOne((r) => r.url === 'http://localhost:3000/api/usuarios/consulta');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('rol')).toBe('Profesor');
    expect(req.request.params.get('id_escuela')).toBe('3');
    expect(req.request.params.has('busqueda')).toBe(false);
    req.flush([]);
  });

});
