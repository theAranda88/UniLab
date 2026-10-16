import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EventosService } from '../../eventos/eventos.service';
import { ReportesService } from '../../reportes/reportes.service';
import { ProyectosService } from '../../proyectos-estudiante/proyectos.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Evento } from '../../../core/models/evento.model';
import type { Proyecto } from '../../../core/models/proyecto.model';
import type { ResumenGlobal } from '../../../core/models/reporte.model';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { fechaLarga, proximosEventos, saludoKey } from '../../../shared/layout/dashboard/dashboard.util';

/** Inicio del panel del Coordinador: seguimiento de proyectos, semilleros y eventos con datos reales. */
@Component({
  selector: 'app-coord-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, SkeletonComponent],
  templateUrl: './coord-dashboard.component.html',
  styleUrl: './coord-dashboard.component.scss',
})
export class CoordDashboardComponent implements OnInit {
  private eventosService = inject(EventosService);
  private reportes = inject(ReportesService);
  private proyectosService = inject(ProyectosService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  readonly resumen = signal<ResumenGlobal | null>(null);
  readonly eventos = signal<Evento[]>([]);
  readonly proyectos = signal<Proyecto[]>([]);
  readonly cargando = signal(true);

  private readonly idioma = this.translate.getCurrentLang() ?? 'es';
  readonly saludo = saludoKey();
  readonly fecha = fechaLarga(this.idioma);
  readonly nombre = this.auth.getCurrentUser()?.nombres?.split(' ')[0] ?? '';

  readonly proximos = computed(() => proximosEventos(this.eventos(), this.idioma));

  /** Proyectos esperando revisión del profesor (los más antiguos primero, máx. 5). */
  readonly enRevision = computed(() =>
    this.proyectos()
      .filter((p) => p.estado_proyecto === 'en_revision')
      .sort((a, b) => a.id_proyecto - b.id_proyecto),
  );
  readonly solicitudesPendientes = computed(
    () => this.resumen()?.membresias_por_estado.find((m) => m.estado === 'pendiente')?.total ?? 0,
  );

  ngOnInit(): void {
    forkJoin({
      resumen: this.reportes.resumen().pipe(catchError(() => of(null))),
      eventos: this.eventosService.listar().pipe(catchError(() => of([] as Evento[]))),
      proyectos: this.proyectosService.listar().pipe(catchError(() => of([] as Proyecto[]))),
    }).subscribe(({ resumen, eventos, proyectos }) => {
      this.resumen.set(resumen);
      this.eventos.set(eventos);
      this.proyectos.set(proyectos);
      this.cargando.set(false);
    });
  }

  nombreEstudiante(p: Proyecto): string {
    const e = p.estudiante_creador;
    return e ? `${e.nombres} ${e.apellidos}` : '';
  }
}
