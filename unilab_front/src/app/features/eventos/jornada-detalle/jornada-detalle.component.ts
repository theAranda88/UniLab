import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, of } from 'rxjs';
import { EventosService } from '../eventos.service';
import type {
  Evento,
  EventoJornada,
  JornadaEvidencia,
  ReporteEventoRow,
} from '../../../core/models/evento.model';
import { formatearFechaLocal } from '../../../core/utils/date.util';
import { enlaceAsistencia, generarQrAsistencia } from '../../../core/utils/qr.util';
import { BreadcrumbComponent, type BreadcrumbItem } from '../../../shared/ui/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

const MAX_EVIDENCIAS = 3;

/** Jornada — QR de asistencia, evidencias fotográficas y asistentes registrados (ADM, COO). */
@Component({
  selector: 'app-jornada-detalle',
  standalone: true,
  imports: [TranslatePipe, BreadcrumbComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './jornada-detalle.component.html',
  styleUrl: './jornada-detalle.component.scss',
})
export class JornadaDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly eventoService = inject(EventosService);
  private toast = inject(ToastService);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly evento = signal<Evento | null>(null);
  readonly jornada = signal<EventoJornada | null>(null);
  readonly qrUrl = signal<string | null>(null);
  readonly evidencias = signal<JornadaEvidencia[]>([]);
  readonly inscritos = signal<ReporteEventoRow[]>([]);
  readonly subiendo = signal(false);

  readonly puedeGestionarEvidencias = this.eventoService.puedeGestionarEvidencias();

  readonly asistentes = computed(() => {
    const id = this.jornada()?.id_jornada;
    return id ? this.inscritos().filter((i) => i.asistencias?.[id]) : [];
  });

  readonly evidenciasRestantes = computed(() => Math.max(0, MAX_EVIDENCIAS - this.evidencias().length));

  readonly enlace = computed(() => {
    const ev = this.evento();
    const jo = this.jornada();
    return ev && jo ? enlaceAsistencia(ev.id_evento, jo.codigo_qr) : '';
  });

  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const base = this.eventoService.getBasePath();
    const ev = this.evento();
    const items: BreadcrumbItem[] = [{ labelKey: 'eventos.title', route: base }];
    if (ev) items.push({ label: ev.nombre_evento, route: `${base}/${ev.id_evento}` });
    const jo = this.jornada();
    if (jo) items.push({ label: jo.nombre_jornada });
    return items;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const idEvento = Number(this.route.snapshot.paramMap.get('id'));
    const idJornada = Number(this.route.snapshot.paramMap.get('idJornada'));
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      evento: this.eventoService.obtener(idEvento),
      jornadas: this.eventoService.obtenerJornadas(idEvento),
      evidencias: this.eventoService.listarEvidenciasJornada(idJornada).pipe(catchError(() => of([]))),
      reporte: this.eventoService.obtenerReporte(idEvento).pipe(catchError(() => of(null))),
    }).subscribe({
      next: async ({ evento, jornadas, evidencias, reporte }) => {
        const jornada = jornadas.find((j) => j.id_jornada === idJornada) ?? null;
        if (!jornada) {
          this.error.set('jornadas.noEncontrada');
          this.cargando.set(false);
          return;
        }
        this.evento.set(evento);
        this.jornada.set(jornada);
        this.evidencias.set(evidencias);
        this.inscritos.set(reporte?.inscritos ?? []);
        this.cargando.set(false);
        try {
          this.qrUrl.set(await generarQrAsistencia(evento.id_evento, jornada.codigo_qr, 280));
        } catch {
          this.qrUrl.set(null);
        }
      },
      error: () => {
        this.error.set('jornadas.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  async copiarCodigo(): Promise<void> {
    const codigo = this.jornada()?.codigo_qr;
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      this.toast.success('jornadas.codigoCopiado');
    } catch {
      this.toast.error('jornadas.codigoNoCopiado');
    }
  }

  onEvidenciasSeleccionadas(event: Event): void {
    const jornada = this.jornada();
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!jornada || !files.length) return;

    if (files.length > this.evidenciasRestantes()) {
      this.toast.error('jornadas.evidenciasError');
      return;
    }

    this.subiendo.set(true);
    this.eventoService.subirEvidenciasJornada(jornada.id_jornada, files).subscribe({
      next: (evidencias) => {
        this.evidencias.set(evidencias);
        this.subiendo.set(false);
        this.toast.success('jornadas.evidenciasSubidas');
      },
      error: () => {
        this.subiendo.set(false);
        this.toast.error('jornadas.evidenciasError');
      },
    });
  }

  eliminarEvidencia(idEvidencia: number): void {
    const jornada = this.jornada();
    if (!jornada) return;
    this.eventoService.eliminarEvidenciaJornada(jornada.id_jornada, idEvidencia).subscribe({
      next: () => {
        this.evidencias.update((lista) => lista.filter((e) => e.id_evidencia !== idEvidencia));
        this.toast.success('jornadas.evidenciaEliminada');
      },
    });
  }

  formatearFecha(fecha: string): string {
    return formatearFechaLocal(fecha);
  }

  formatearHora(hora: string): string {
    if (!hora) return '—';
    const match = hora.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
    return hora.length >= 5 && hora.includes(':') ? hora.substring(0, 5) : hora;
  }

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  nombreArchivoQr(): string {
    const jo = this.jornada();
    return `qr-jornada-${jo?.id_jornada ?? ''}.png`;
  }
}
