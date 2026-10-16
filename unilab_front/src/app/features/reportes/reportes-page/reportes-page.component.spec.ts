import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ReportesPageComponent } from './reportes-page.component';
import { ReportesService } from '../reportes.service';
import type { ResumenGlobal } from '../../../core/models/reporte.model';

const RESUMEN: ResumenGlobal = {
  generado_en: '2026-10-15T12:00:00.000Z',
  totales: {
    usuarios: 50,
    usuarios_inactivos: 2,
    escuelas: 2,
    cursos: 5,
    proyectos: 12,
    proyectos_publicados: 4,
    semilleros: 3,
    semilleros_activos: 2,
    eventos: 4,
    inscripciones: 90,
    asistencias: 70,
  },
  usuarios_por_rol: [
    { rol: 'Estudiante', total: 40 },
    { rol: 'Profesor', total: 10 },
  ],
  proyectos_por_estado: [
    { estado: 'borrador', total: 6 },
    { estado: 'publicado', total: 4 },
    { estado: 'en_revision', total: 2 },
  ],
  proyectos_por_escuela: [
    { id_escuela: 1, escuela: 'Diseño', total: 2, publicados: 0 },
    { id_escuela: 2, escuela: 'Software', total: 10, publicados: 4 },
  ],
  membresias_por_estado: [{ estado: 'pendiente', total: 3 }],
  eventos_por_estado: [{ estado: 'activo', total: 4 }],
};

async function crear(resumen$ = of(RESUMEN)) {
  await TestBed.configureTestingModule({
    imports: [ReportesPageComponent],
    providers: [
      provideTranslateService(),
      {
        provide: ReportesService,
        useValue: { resumen: () => resumen$, exportarExcel: () => of(new Blob()) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReportesPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('ReportesPageComponent', () => {
  it('muestra los indicadores principales', async () => {
    const fixture = await crear();
    const valores = [...fixture.nativeElement.querySelectorAll('.reportes-tile__value')].map(
      (e: Element) => e.textContent?.trim(),
    );
    expect(valores).toEqual(['50', '12', '3', '4', '2']);
  });

  it('escala cada barra respecto al máximo de su desglose', async () => {
    const fixture = await crear();
    const usuarios = fixture.componentInstance.desgloses().find((d) => d.id === 'usuarios')!;
    expect(usuarios.filas.map((f) => f.ancho)).toEqual([100, 25]);
    expect(usuarios.filas.map((f) => f.porcentaje)).toEqual([80, 20]);
  });

  it('ordena las escuelas por total y separa publicados del resto', async () => {
    const fixture = await crear();
    const [primera, segunda] = fixture.componentInstance.escuelas();
    expect(primera.escuela).toBe('Software');
    expect(primera.anchoPublicados).toBe(40);
    expect(primera.anchoResto).toBe(60);
    expect(segunda.anchoPublicados + segunda.anchoResto).toBe(20);
  });

  it('muestra el estado de error con opción de reintentar', async () => {
    const fixture = await crear(throwError(() => new Error('x')));
    expect(fixture.componentInstance.error()).toBe('reportes.errorCargar');
    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
  });
});
