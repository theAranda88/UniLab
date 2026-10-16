import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EventosService } from '../../eventos/eventos.service';
import { ProyectosService } from '../../proyectos-estudiante/proyectos.service';
import { SemillerosService } from '../../semilleros/semilleros.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Evento } from '../../../core/models/evento.model';
import type { Proyecto } from '../../../core/models/proyecto.model';
import type { Semillero } from '../../../core/models/semillero.model';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { fechaLarga, proximosEventos, saludoKey } from '../../../shared/layout/dashboard/dashboard.util';

/** Inicio del panel del Profesor: lo que tiene pendiente de revisar y resolver, con datos reales. */
@Component({
  selector: 'app-prof-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, SkeletonComponent],
  templateUrl: './prof-dashboard.component.html',
  styleUrl: './prof-dashboard.component.scss',
})
export class ProfDashboardComponent implements OnInit {
  private eventosService = inject(EventosService);
  private proyectosService = inject(ProyectosService);
  private semillerosService = inject(SemillerosService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  readonly proyectos = signal<Proyecto[]>([]);
  readonly semilleros = signal<Semillero[]>([]);
  readonly eventos = signal<Evento[]>([]);
  readonly cargando = signal(true);

  private readonly idioma = this.translate.getCurrentLang() ?? 'es';
  private readonly idUsuario = this.auth.getCurrentUser()?.id_usuario;
  readonly saludo = saludoKey();
  readonly fecha = fechaLarga(this.idioma);
  readonly nombre = this.auth.getCurrentUser()?.nombres?.split(' ')[0] ?? '';

  readonly asignados = computed(() => this.proyectos().filter((p) => this.proyectosService.esAsignadoAMi(p)));
  readonly porRevisar = computed(() => this.asignados().filter((p) => p.estado_proyecto === 'en_revision'));
  readonly publicados = computed(() => this.asignados().filter((p) => p.estado_proyecto === 'publicado').length);

  readonly misSemilleros = computed(() =>
    this.semilleros().filter(
      (s) => s.id_profesor_lider === this.idUsuario || s.profesores.some((p) => p.id_profesor === this.idUsuario),
    ),
  );
  /** Semilleros que lidera con solicitudes de ingreso por resolver. */
  readonly solicitudes = computed(() =>
    this.semilleros()
      .filter((s) => s.id_profesor_lider === this.idUsuario)
      .map((s) => ({ semillero: s, pendientes: s.miembros.filter((m) => m.estado_solicitud === 'pendiente').length }))
      .filter((x) => x.pendientes > 0),
  );
  readonly totalSolicitudes = computed(() => this.solicitudes().reduce((n, x) => n + x.pendientes, 0));

  readonly proximos = computed(() => proximosEventos(this.eventos(), this.idioma));

  ngOnInit(): void {
    forkJoin({
      proyectos: this.proyectosService.listar().pipe(catchError(() => of([] as Proyecto[]))),
      semilleros: this.semillerosService.listar().pipe(catchError(() => of([] as Semillero[]))),
      eventos: this.eventosService.listar().pipe(catchError(() => of([] as Evento[]))),
    }).subscribe(({ proyectos, semilleros, eventos }) => {
      this.proyectos.set(proyectos);
      this.semilleros.set(semilleros);
      this.eventos.set(eventos);
      this.cargando.set(false);
    });
  }

  nombreEstudiante(p: Proyecto): string {
    const e = p.estudiante_creador;
    return e ? `${e.nombres} ${e.apellidos}` : '';
  }
}
