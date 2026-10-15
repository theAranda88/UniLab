import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import {
  FloatingBubblesComponent,
  type Burbuja,
} from '../../../shared/ui/floating-bubbles/floating-bubbles.component';
import {
  resolveEscuelaCardConfig,
  type Curso,
  type Escuela,
  type EscuelaThemeKey,
} from '../../../core/models/portal.model';
import type { Evento } from '../../../core/models/evento.model';
import { formatearFechaLocal } from '../../../core/utils/date.util';

/** Ícono Phosphor (duotone) y color de identidad por escuela. */
const ESCUELA_ESTILOS: Record<EscuelaThemeKey | 'generic', { icono: string; color: string }> = {
  software: { icono: 'ph-code', color: '#2563eb' },
  ingenieria: { icono: 'ph-gear-six', color: '#ea580c' },
  negocios: { icono: 'ph-chart-line-up', color: '#059669' },
  educacion: { icono: 'ph-chalkboard-teacher', color: '#7c3aed' },
  derecho: { icono: 'ph-scales', color: '#b91c1c' },
  generic: { icono: 'ph-graduation-cap', color: '#053686' },
};

interface EscuelaCard {
  escuela: Escuela;
  icono: string;
  color: string;
  programas: string;
  proyectos: number;
}

interface Cifra {
  valor: number;
  labelKey: string;
  notaKey: string;
}

/** Círculos del hero (posición en %). */
const BURBUJAS: Burbuja[] = [
  { size: 340, top: -18, left: 82, tipo: 'ring-accent', float: 0 },
  { size: 260, top: 78, left: 70, tipo: 'ring-light', float: 1 },
  { size: 140, top: 12, left: 58, tipo: 'glass', float: 2 },
  { size: 90, top: 70, left: 46, tipo: 'ring-accent', float: 3 },
  { size: 26, top: 22, left: 48, tipo: 'dot-accent', float: 1 },
  { size: 14, top: 60, left: 92, tipo: 'dot-light', float: 2 },
  { size: 200, top: -30, left: 28, tipo: 'ring-light', float: 3 },
  { size: 60, top: 82, left: 12, tipo: 'glass', float: 0 },
  { size: 18, top: 40, left: 6, tipo: 'dot-accent', float: 3 },
  { size: 110, top: 45, left: 88, tipo: 'glass', float: 1 },
  { size: 10, top: 8, left: 72, tipo: 'dot-light', float: 0 },
  { size: 44, top: 30, left: 96, tipo: 'ring-accent', float: 2 },
  { size: 22, top: 88, left: 36, tipo: 'dot-light', float: 1 },
  { size: 170, top: 55, left: -6, tipo: 'ring-light', float: 2 },
  { size: 12, top: 18, left: 20, tipo: 'dot-light', float: 3 },
  { size: 34, top: 64, left: 62, tipo: 'dot-accent', float: 0 },
];

/** Pantalla 21 · Portal — inicio (estático). */
@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, FloatingBubblesComponent],
  templateUrl: './home-dashboard.component.html',
  styleUrl: './home-dashboard.component.scss',
})
export class HomeDashboardComponent implements OnInit {
  private portal = inject(PublicPortalService);

  readonly burbujas = BURBUJAS;

  readonly escuelas = signal<Escuela[]>([]);
  readonly cursosPorEscuela = signal<Record<number, Curso[]>>({});
  readonly eventos = signal<Evento[]>([]);

  readonly escuelaCards = computed<EscuelaCard[]>(() =>
    this.escuelas().map((escuela) => {
      const config = resolveEscuelaCardConfig(escuela.nombre_escuela);
      const cursos = this.cursosPorEscuela()[escuela.id_escuela] ?? [];
      const estilo = ESCUELA_ESTILOS[config?.themeKey ?? 'generic'];
      return {
        escuela,
        icono: estilo.icono,
        color: estilo.color,
        programas: cursos.map((c) => c.nombre_curso).join(', '),
        proyectos: escuela.total_proyectos_publicados ?? 0,
      };
    }),
  );

  /** «El portal en números»: solo cifras que devuelve la API pública. */
  readonly cifras = computed<Cifra[]>(() => {
    const escuelas = this.escuelas();
    const cursos = Object.values(this.cursosPorEscuela()).reduce((n, lista) => n + lista.length, 0);
    return [
      {
        valor: escuelas.reduce((n, e) => n + (e.total_proyectos_publicados ?? 0), 0),
        labelKey: 'home.stats.projects',
        notaKey: 'home.stats.projectsNote',
      },
      { valor: escuelas.length, labelKey: 'home.stats.schools', notaKey: 'home.stats.schoolsNote' },
      { valor: cursos, labelKey: 'home.stats.courses', notaKey: 'home.stats.coursesNote' },
      { valor: this.eventos().length, labelKey: 'home.stats.events', notaKey: 'home.stats.eventsNote' },
    ];
  });

  /** Barra amarilla de cada cifra, proporcional a la mayor. */
  readonly cifraMax = computed(() => Math.max(1, ...this.cifras().map((c) => c.valor)));

  /** Próximo evento: el de fecha de inicio más cercana entre los abiertos. */
  readonly proximoEvento = computed<Evento | null>(() => {
    const lista = [...this.eventos()].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
    return lista[0] ?? null;
  });

  ngOnInit(): void {
    this.portal.listarEscuelas().subscribe({
      next: (escuelas) => {
        this.escuelas.set(escuelas);
        this.cargarCursos(escuelas);
      },
    });
    this.portal.listarEventosActivos().subscribe({
      next: (eventos) => this.eventos.set(eventos),
    });
  }

  formatearFecha(fecha: string): string {
    return formatearFechaLocal(fecha);
  }

  private cargarCursos(escuelas: Escuela[]): void {
    if (escuelas.length === 0) return;
    forkJoin(
      escuelas.map((e) =>
        this.portal.listarCursos(e.id_escuela).pipe(
          map((cursos) => [e.id_escuela, cursos] as const),
          catchError(() => of([e.id_escuela, [] as Curso[]] as const)),
        ),
      ),
    ).subscribe((pares) => this.cursosPorEscuela.set(Object.fromEntries(pares)));
  }
}
