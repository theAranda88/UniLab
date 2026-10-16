import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import {
  FloatingBubblesComponent,
  type Burbuja,
} from '../../../shared/ui/floating-bubbles/floating-bubbles.component';
import { estiloEscuela, type Curso, type Escuela, type ProyectoPublico } from '../../../core/models/portal.model';
import { ProyectoCardComponent } from '../proyecto-card/proyecto-card.component';
import { EventoCardComponent } from '../../../shared/ui/evento-card/evento-card.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import type { Evento } from '../../../core/models/evento.model';
import { momentoEvento, type MomentoEvento } from '../../../core/utils/date.util';
import { PortalSeccionService, type SeccionPortal } from '../portal-seccion.service';

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

/**
 * Círculos del hero (posición en % del hero, profundidad 0–1).
 * Se reparten por los bordes y detrás de las cifras para no tapar el título ni los botones.
 */
const BURBUJAS: Burbuja[] = [
  // Fondo: anillos grandes, tenues, casi inmóviles
  { size: 520, top: -42, left: 74, tipo: 'ring-light', float: 0, profundidad: 0.1 },
  { size: 380, top: 62, left: -14, tipo: 'ring-light', float: 2, profundidad: 0.15 },
  { size: 300, top: 70, left: 58, tipo: 'ring-accent', float: 1, profundidad: 0.2 },
  // Capa media: vidrio y anillos medianos
  { size: 160, top: 6, left: 52, tipo: 'glass', float: 3, profundidad: 0.5 },
  { size: 120, top: 74, left: 90, tipo: 'glass', float: 0, profundidad: 0.55 },
  { size: 70, top: 12, left: 4, tipo: 'ring-accent', float: 2, profundidad: 0.5 },
  { size: 44, top: 86, left: 40, tipo: 'ring-light', float: 1, profundidad: 0.45 },
  // Frente: puntos pequeños y nítidos
  { size: 16, top: 18, left: 46, tipo: 'dot-accent', float: 1, profundidad: 0.9 },
  { size: 10, top: 9, left: 30, tipo: 'dot-light', float: 3, profundidad: 0.85 },
  { size: 22, top: 88, left: 70, tipo: 'dot-accent', float: 0, profundidad: 1 },
  { size: 12, top: 50, left: 97, tipo: 'dot-light', float: 2, profundidad: 0.95 },
];

/** Pantalla 21 · Portal — inicio (estático). */
@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    FloatingBubblesComponent,
    ProyectoCardComponent,
    EventoCardComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './home-dashboard.component.html',
  styleUrl: './home-dashboard.component.scss',
})
export class HomeDashboardComponent implements OnInit {
  private portal = inject(PublicPortalService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private seccionSvc = inject(PortalSeccionService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private scroller = inject(ViewportScroller);
  private injector = inject(Injector);

  readonly burbujas = BURBUJAS;

  readonly escuelas = signal<Escuela[]>([]);
  readonly cursosPorEscuela = signal<Record<number, Curso[]>>({});
  readonly eventos = signal<Evento[]>([]);
  readonly proyectos = signal<ProyectoPublico[]>([]);

  /** Los tres proyectos publicados más recientes de todas las escuelas. */
  readonly proyectosRecientes = computed(() =>
    [...this.proyectos()]
      .sort((a, b) =>
        (b.fecha_publicacion ?? '').localeCompare(a.fecha_publicacion ?? '') || b.id_proyecto - a.id_proyecto,
      )
      .slice(0, 3),
  );

  /** Valores que se muestran mientras las cifras «cuentan» hasta su valor real. */
  readonly valoresVisibles = signal<number[]>([]);

  readonly escuelaCards = computed<EscuelaCard[]>(() =>
    this.escuelas().map((escuela) => {
      const cursos = this.cursosPorEscuela()[escuela.id_escuela] ?? [];
      const estilo = estiloEscuela(escuela.nombre_escuela);
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

  readonly eventosCargados = signal(false);

  /**
   * Hasta tres eventos para el inicio: primero los vigentes (en curso y próximos, por fecha)
   * y, si faltan, los realizados más recientes. Cada tarjeta indica su momento.
   */
  readonly eventosDestacados = computed<Evento[]>(() => {
    const orden: Record<MomentoEvento, number> = { en_curso: 0, proximo: 1, pasado: 2 };
    return this.eventos()
      .map((evento) => ({ evento, momento: momentoEvento(evento.fecha_inicio, evento.fecha_fin) }))
      .sort((a, b) => {
        if (a.momento !== b.momento) return orden[a.momento] - orden[b.momento];
        const cmp = a.evento.fecha_inicio.localeCompare(b.evento.fecha_inicio);
        return a.momento === 'pasado' ? -cmp : cmp;
      })
      .slice(0, 3)
      .map((x) => x.evento);
  });

  /** Ancla de llegada (/#escuelas, /#eventos) pendiente de reajustar mientras cargan los datos. */
  private anclaPendiente: string | null = null;
  private spy?: IntersectionObserver;
  private readonly visibles = new Map<Element, boolean>();

  constructor() {
    // Las cifras suben de 0 a su valor real una vez cargadas (sin animación si se prefiere menos movimiento)
    let frame = 0;
    effect(() => {
      const destino = this.cifras().map((c) => c.valor);
      cancelAnimationFrame(frame);
      const reducir =
        typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducir || destino.every((v) => v === 0)) {
        this.valoresVisibles.set(destino);
        return;
      }
      const inicio = performance.now();
      const duracion = 900;
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duracion);
        const suavizado = 1 - Math.pow(1 - t, 3);
        this.valoresVisibles.set(destino.map((v) => Math.round(v * suavizado)));
        if (t < 1) frame = requestAnimationFrame(paso);
      };
      frame = requestAnimationFrame(paso);
    });
    this.destroyRef.onDestroy(() => cancelAnimationFrame(frame));

    this.anclaPendiente = this.route.snapshot.fragment;
    afterNextRender(() => {
      this.observarSecciones();
      // Si el usuario se desplaza por su cuenta, dejamos de recolocar el ancla
      const cancelar = () => (this.anclaPendiente = null);
      const opciones = { passive: true, once: true } as const;
      window.addEventListener('wheel', cancelar, opciones);
      window.addEventListener('touchmove', cancelar, opciones);
      window.addEventListener('keydown', cancelar, opciones);
      const limite = setTimeout(cancelar, 4000);
      this.destroyRef.onDestroy(() => {
        clearTimeout(limite);
        window.removeEventListener('wheel', cancelar);
        window.removeEventListener('touchmove', cancelar);
        window.removeEventListener('keydown', cancelar);
        this.spy?.disconnect();
        this.seccionSvc.seccion.set(null);
      });
    });
  }

  ngOnInit(): void {
    this.portal.listarEscuelas().subscribe({
      next: (escuelas) => {
        this.escuelas.set(escuelas);
        this.cargarCursos(escuelas);
        this.reanclar();
      },
    });
    this.portal.listarEventosActivos().subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.eventosCargados.set(true);
        this.reanclar();
      },
      error: () => this.eventosCargados.set(true),
    });
    this.portal.listarProyectos().subscribe({
      next: (proyectos) => {
        this.proyectos.set(proyectos);
        this.reanclar();
      },
    });
  }

  /**
   * Al llegar con «/#escuelas» o «/#eventos» desde otra página, el router intenta ir al ancla
   * antes de que se pinten los datos (la página aún es corta o cambia de alto). Se recoloca tras
   * cada carga mientras el usuario no se haya desplazado por su cuenta.
   */
  private reanclar(): void {
    afterNextRender(
      () => {
        this.observarSecciones();
        if (this.anclaPendiente) this.scroller.scrollToAnchor(this.anclaPendiente);
      },
      { injector: this.injector },
    );
  }

  /**
   * Publica qué sección se está viendo (Inicio / Proyectos / Eventos) para el navbar.
   * Activa = la última sección, en orden del documento, que cruza una franja a ~1/3 de la altura.
   * Se vuelve a llamar tras cada carga porque algunas secciones aparecen con los datos.
   */
  private observarSecciones(): void {
    this.spy ??= new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) this.visibles.set(e.target, e.isIntersecting);
        const secciones = [...this.host.nativeElement.querySelectorAll<HTMLElement>('[data-seccion]')];
        const activa = secciones.filter((el) => this.visibles.get(el)).at(-1);
        if (activa) this.seccionSvc.seccion.set(activa.dataset['seccion'] as SeccionPortal);
      },
      { rootMargin: '-30% 0px -65% 0px' },
    );
    this.host.nativeElement.querySelectorAll('[data-seccion]').forEach((el) => this.spy!.observe(el));
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
