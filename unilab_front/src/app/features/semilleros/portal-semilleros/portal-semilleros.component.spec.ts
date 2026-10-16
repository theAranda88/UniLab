import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { PortalSemillerosComponent } from './portal-semilleros.component';
import { SemillerosService } from '../semilleros.service';
import { ConfiguracionService } from '../../configuracion/configuracion.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Semillero, SemilleroMiembro } from '../../../core/models/semillero.model';

const YO = 7;

function semillero(
  id: number,
  miembros: Partial<SemilleroMiembro>[] = [],
  activo = true,
): Semillero {
  return {
    id_semillero: id,
    nombre_semillero: `Semillero ${id}`,
    descripcion: 'd',
    id_escuela: 1,
    id_profesor_lider: 2,
    activo,
    profesores: [],
    miembros: miembros.map((m, i) => ({
      id_membresia: id * 100 + i,
      id_semillero: id,
      id_estudiante: YO,
      estado_solicitud: 'pendiente',
      puede_publicar: false,
      ...m,
    })),
  };
}

async function crear(semilleros: Semillero[], solicitudesAbiertas = true) {
  const solicitarIngreso = vi.fn(() =>
    of({
      id_membresia: 1,
      id_semillero: 1,
      id_estudiante: YO,
      estado_solicitud: 'pendiente',
      puede_publicar: false,
    }),
  );
  await TestBed.configureTestingModule({
    imports: [PortalSemillerosComponent],
    providers: [
      provideTranslateService(),
      { provide: SemillerosService, useValue: { listar: () => of(semilleros), solicitarIngreso } },
      {
        provide: ConfiguracionService,
        useValue: {
          publica: () =>
            of({
              registro_abierto: true,
              semilleros_solicitudes_abiertas: solicitudesAbiertas,
              mensaje_portal: '',
            }),
        },
      },
      {
        provide: AuthService,
        useValue: { getCurrentUser: () => ({ id_usuario: YO, id_rol: 'Estudiante' }) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PortalSemillerosComponent);
  fixture.detectChanges();
  return { fixture, comp: fixture.componentInstance, solicitarIngreso };
}

describe('PortalSemillerosComponent', () => {
  it('oculta semilleros inactivos y muestra primero aquellos en los que participo', async () => {
    const { comp } = await crear([
      semillero(1),
      semillero(2, [{ estado_solicitud: 'aprobado' }]),
      semillero(3, [], false),
    ]);

    expect(comp.items().map((i) => i.semillero.id_semillero)).toEqual([2, 1]);
  });

  it('permite solicitar si no hay solicitud o si fue rechazada, pero no si está pendiente o aprobada', async () => {
    const { comp } = await crear([
      semillero(1),
      semillero(2, [{ estado_solicitud: 'rechazado' }]),
      semillero(3, [{ estado_solicitud: 'pendiente' }]),
      semillero(4, [{ estado_solicitud: 'aprobado' }]),
    ]);
    const puede = Object.fromEntries(
      comp.items().map((i) => [i.semillero.id_semillero, comp.puedeSolicitar(i)]),
    );

    expect(puede).toEqual({ 1: true, 2: true, 3: false, 4: false });
  });

  it('con las solicitudes cerradas no ofrece el botón y avisa', async () => {
    const { fixture, comp } = await crear([semillero(1)], false);

    expect(comp.puedeSolicitar(comp.items()[0])).toBe(false);
    expect(fixture.nativeElement.querySelector('.edu-alert--warning')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.portal-semillero__cta')).toBeNull();
  });

  it('al solicitar, refleja la solicitud pendiente sin recargar', async () => {
    const { comp, solicitarIngreso } = await crear([semillero(1)]);

    comp.solicitar(comp.items()[0]);

    expect(solicitarIngreso).toHaveBeenCalledWith(1);
    expect(comp.items()[0].membresia?.estado_solicitud).toBe('pendiente');
    expect(comp.puedeSolicitar(comp.items()[0])).toBe(false);
  });
});
