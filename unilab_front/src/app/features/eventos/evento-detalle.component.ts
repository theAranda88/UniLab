import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import QRCode from 'qrcode';
import { EventosService } from './eventos.service';
import { Evento, EventoJornada, Inscripcion, JornadaEvidencia } from '../../core/models/evento.model';
import { FormsModule } from '@angular/forms';
import { InscripcionFormComponent } from './inscripcion-form.component';
import { JornadaFormComponent } from './jornada-form.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb.component';
import { DialogService } from '../../shared/ui/dialog/dialog.service';
import { formatearFechaLocal, toDateInputValue } from '../../core/utils/date.util';
import { hasPortalTheme } from '../../core/utils/portal-theme.util';
import type { UiVariant } from '../../shared/ui/ui-variant';

@Component({
  selector: 'app-evento-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslatePipe,
    InscripcionFormComponent,
    JornadaFormComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './evento-detalle.component.html',
  styleUrl: './evento-detalle.component.scss',
  host: {
    '[class.portal-themed]': 'portalTheme()',
  },
})
export class EventoDetalleComponent implements OnInit {
  eventoService = inject(EventosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);

  readonly portalTheme = signal(false);
  readonly uiVariant = computed<UiVariant>(() => (this.portalTheme() ? 'portal' : 'default'));

  evento = signal<Evento | null>(null);
  jornadas = signal<EventoJornada[]>([]);
  inscripciones = signal<Inscripcion[]>([]);
  cargando = signal(true);
  cargandoInscripciones = signal(false);
  eliminando = signal(false);
  actualizandoPagoId = signal<number | null>(null);
  error = signal<string | null>(null);
  yaInscrito = signal(false);
  miInscripcion = signal<Inscripcion | null>(null);

  puedeCrear = computed(() => this.eventoService.puedeCrear());
  puedeEditar = computed(() => this.eventoService.puedeEditar());
  puedeEliminar = computed(() => this.eventoService.puedeEliminar());
  puedeInscribirse = computed(
    () => this.eventoService.puedeInscribirse() && !this.yaInscrito(),
  );
  puedeAsistenciaManual = computed(() => this.eventoService.puedeAsistenciaManual());
  pagoConfirmado = computed(() => {
    const ev = this.evento();
    if (!ev?.requiere_pago) return true;
    return this.miInscripcion()?.estado_pago === 'confirmado';
  });
  motivoAsistenciaDeshabilitada = computed<string | null>(() => {
    if (!this.eventoService.esAsistenciaSoloQr()) return null;
    if (!this.yaInscrito()) return 'asistencia.requiereInscripcion';
    if (this.jornadas().length === 0) return 'asistencia.sinJornadas';
    if (!this.pagoConfirmado()) return 'asistencia.pagoPendiente';
    return null;
  });
  puedeVerReportes = computed(() => this.eventoService.puedeVerReportes());
  puedeListarInscripciones = computed(() => this.eventoService.puedeListarInscripciones());
  puedeGestionarEvidencias = computed(() => this.eventoService.puedeGestionarEvidencias());
  puedeActualizarPago = computed(() => this.eventoService.puedeActualizarPago());
  puedeVerJornadas = computed(
    () =>
      this.eventoService.puedeListarInscripciones() ||
      (this.yaInscrito() && this.pagoConfirmado()),
  );
  mensajeJornadasOcultas = computed<string | null>(() => {
    if (this.eventoService.puedeListarInscripciones()) return null;
    if (!this.yaInscrito()) return 'jornadas.requiereInscripcion';
    if (!this.pagoConfirmado()) return 'jornadas.pagoPendiente';
    return null;
  });

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const ev = this.evento();
    if (!ev) return [{ labelKey: 'eventos.title', route: this.eventoService.getBasePath() }];
    return [
      { labelKey: 'eventos.title', route: this.eventoService.getBasePath() },
      { label: ev.nombre_evento },
    ];
  });

  mostrarFormularioInscripcion = signal(false);
  mostrarFormularioJornada = signal(false);
  jornadaEnEdicion = signal<EventoJornada | null>(null);
  eliminandoJornadaId = signal<number | null>(null);
  qrUrls = signal<Record<number, string>>({});
  evidenciasPorJornada = signal<Record<number, JornadaEvidencia[]>>({});
  subiendoEvidenciasJornada = signal<number | null>(null);

  ngOnInit() {
    this.portalTheme.set(hasPortalTheme(this.route));
    this.cargarEvento();
  }

  async generarQRsParaJornadas(jornadas: EventoJornada[]): Promise<void> {
    const urls: Record<number, string> = {};
    const idEvento = this.evento()?.id_evento;

    for (const jornada of jornadas) {
      try {
        const deeplink = `${window.location.origin}/eventos/${idEvento}/asistencia?qr=${encodeURIComponent(jornada.codigo_qr)}`;
        const qrDataUrl = await QRCode.toDataURL(deeplink, {
          errorCorrectionLevel: 'H',
          type: 'image/png' as 'image/png',
          width: 200,
          margin: 1,
          color: { dark: '#243b8e', light: '#FFFFFF' },
        });
        urls[jornada.id_jornada] = qrDataUrl;
      } catch {
        // QR generation failed for this jornada
      }
    }

    this.qrUrls.set(urls);
  }

  cargarEvento() {
    this.cargando.set(true);
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.eventoService.obtener(id).subscribe({
      next: (data: Evento) => {
        this.evento.set(data);
        if (this.eventoService.puedeListarInscripciones()) {
          this.cargarInscripciones(id);
          this.cargarJornadas(id);
        } else {
          this.verificarMiInscripcion(id);
        }
      },
      error: () => {
        this.error.set('eventos.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  verificarMiInscripcion(id: number) {
    this.eventoService.obtenerMiInscripcion(id).subscribe({
      next: (res) => {
        this.yaInscrito.set(res.inscrito);
        this.miInscripcion.set(res.inscripcion);
        if (res.inscrito && this.pagoConfirmado()) {
          this.cargarJornadas(id);
        } else {
          this.cargando.set(false);
        }
      },
      error: () => {
        this.yaInscrito.set(false);
        this.miInscripcion.set(null);
        this.cargando.set(false);
      },
    });
  }

  cargarJornadas(id: number) {
    this.eventoService.obtenerJornadas(id).subscribe({
      next: (data: EventoJornada[]) => {
        this.jornadas.set(data);
        this.cargando.set(false);
        if (this.eventoService.puedeListarInscripciones()) {
          this.generarQRsParaJornadas(data);
        }
        if (this.puedeGestionarEvidencias()) {
          this.cargarEvidenciasJornadas(data);
        }
      },
      error: (err: { status?: number }) => {
        this.jornadas.set([]);
        this.cargando.set(false);
        if (err.status !== 403) {
          this.error.set('eventos.errorCargar');
        }
      },
    });
  }

  cargarInscripciones(id: number) {
    this.cargandoInscripciones.set(true);
    this.eventoService.listarInscripciones(id).subscribe({
      next: (data) => {
        this.inscripciones.set(data);
        this.cargandoInscripciones.set(false);
      },
      error: () => this.cargandoInscripciones.set(false),
    });
  }

  abrirFormularioInscripcion() {
    if (this.yaInscrito()) return;
    this.mostrarFormularioInscripcion.set(true);
  }

  cerrarFormularioInscripcion() {
    this.mostrarFormularioInscripcion.set(false);
  }

  async onInscripcionExitosa() {
    this.cerrarFormularioInscripcion();
    const id = this.evento()?.id_evento;
    if (!id) return;

    this.eventoService.obtenerMiInscripcion(id).subscribe({
      next: (res) => {
        this.yaInscrito.set(res.inscrito);
        this.miInscripcion.set(res.inscripcion);
        if (res.inscrito && this.pagoConfirmado()) {
          this.cargarJornadas(id);
        }
      },
    });

    await this.dialog.success({
      titleKey: 'dialog.success.title',
      messageKey: 'inscripcion.exito',
    });
  }

  abrirFormularioJornada() {
    this.jornadaEnEdicion.set(null);
    this.mostrarFormularioJornada.set(true);
  }

  editarJornada(jornada: EventoJornada) {
    this.jornadaEnEdicion.set(jornada);
    this.mostrarFormularioJornada.set(true);
  }

  cerrarFormularioJornada() {
    this.mostrarFormularioJornada.set(false);
    this.jornadaEnEdicion.set(null);
  }

  evidenciasDeJornada(idJornada: number): JornadaEvidencia[] {
    return this.evidenciasPorJornada()[idJornada] ?? [];
  }

  maxEvidenciasRestantes(idJornada: number): number {
    return Math.max(0, 3 - this.evidenciasDeJornada(idJornada).length);
  }

  private cargarEvidenciasJornadas(jornadas: EventoJornada[]): void {
    for (const jornada of jornadas) {
      this.eventoService.listarEvidenciasJornada(jornada.id_jornada).subscribe({
        next: (evidencias) => {
          this.evidenciasPorJornada.update((prev) => ({
            ...prev,
            [jornada.id_jornada]: evidencias,
          }));
        },
      });
    }
  }

  onEvidenciasSeleccionadas(idJornada: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) return;

    const max = this.maxEvidenciasRestantes(idJornada);
    if (files.length > max) {
      void this.dialog.error({
        titleKey: 'dialog.error.title',
        messageKey: 'jornadas.evidenciasError',
      });
      return;
    }

    this.subiendoEvidenciasJornada.set(idJornada);
    this.eventoService.subirEvidenciasJornada(idJornada, files).subscribe({
      next: (evidencias) => {
        this.evidenciasPorJornada.update((prev) => ({
          ...prev,
          [idJornada]: evidencias,
        }));
        this.subiendoEvidenciasJornada.set(null);
      },
      error: () => {
        this.subiendoEvidenciasJornada.set(null);
        void this.dialog.error({
          titleKey: 'dialog.error.title',
          messageKey: 'jornadas.evidenciasError',
        });
      },
    });
  }

  eliminarEvidencia(idJornada: number, idEvidencia: number): void {
    this.eventoService.eliminarEvidenciaJornada(idJornada, idEvidencia).subscribe({
      next: () => {
        this.evidenciasPorJornada.update((prev) => ({
          ...prev,
          [idJornada]: (prev[idJornada] ?? []).filter((e) => e.id_evidencia !== idEvidencia),
        }));
      },
    });
  }

  async onJornadaCreada() {
    const id = this.evento()?.id_evento;
    if (id) this.cargarJornadas(id);
    this.cerrarFormularioJornada();
    await this.dialog.success({
      titleKey: 'dialog.success.title',
      messageKey: 'jornadas.exitoCrear',
    });
  }

  async onJornadaActualizada() {
    const id = this.evento()?.id_evento;
    if (id) this.cargarJornadas(id);
    this.cerrarFormularioJornada();
    await this.dialog.success({
      titleKey: 'dialog.success.title',
      messageKey: 'jornadas.exitoActualizar',
    });
  }

  async eliminarJornada(jornada: EventoJornada) {
    const confirmar = await this.dialog.confirm({
      titleKey: 'dialog.confirm.deleteTitle',
      messageKey: 'jornadas.confirmarEliminar',
      confirmKey: 'common.delete',
      cancelKey: 'common.cancelar',
    });
    if (!confirmar) return;

    this.eliminandoJornadaId.set(jornada.id_jornada);
    this.eventoService.eliminarJornada(jornada.id_jornada).subscribe({
      next: async () => {
        this.eliminandoJornadaId.set(null);
        const id = this.evento()?.id_evento;
        if (id) this.cargarJornadas(id);
        this.qrUrls.update((prev) => {
          const next = { ...prev };
          delete next[jornada.id_jornada];
          return next;
        });
        this.evidenciasPorJornada.update((prev) => {
          const next = { ...prev };
          delete next[jornada.id_jornada];
          return next;
        });
        await this.dialog.success({
          titleKey: 'dialog.success.title',
          messageKey: 'jornadas.exitoEliminar',
        });
      },
      error: async (err: { message?: string }) => {
        this.eliminandoJornadaId.set(null);
        await this.dialog.error({
          titleKey: 'dialog.error.title',
          message: err.message ?? this.translate.instant('jornadas.errorEliminar'),
        });
      },
    });
  }

  irAEditar() {
    const id = this.evento()?.id_evento;
    if (id) {
      this.router.navigate([this.eventoService.getBasePath(), id, 'editar']);
    }
  }

  async eliminarEvento() {
    const id = this.evento()?.id_evento;
    if (!id) return;

    const confirmar = await this.dialog.confirm({
      titleKey: 'dialog.confirm.deleteTitle',
      messageKey: 'eventos.confirmarEliminar',
      confirmKey: 'common.delete',
      cancelKey: 'common.cancelar',
    });
    if (!confirmar) return;

    this.eliminando.set(true);
    this.eventoService.eliminar(id).subscribe({
      next: async () => {
        await this.dialog.success({
          titleKey: 'dialog.success.title',
          messageKey: 'eventos.exitoEliminar',
        });
        this.router.navigate([this.eventoService.getBasePath()]);
      },
      error: async (err: { message?: string }) => {
        this.eliminando.set(false);
        await this.dialog.error({
          titleKey: 'dialog.error.title',
          message: err.message ?? this.translate.instant('eventos.errorEliminar'),
        });
      },
    });
  }

  async confirmarPago(inscripcion: Inscripcion) {
    const ok = await this.dialog.confirm({
      titleKey: 'dialog.confirm.updateTitle',
      messageKey: 'eventos.confirmarPago',
      confirmKey: 'dashboard.admin.right.confirmar',
      cancelKey: 'common.cancelar',
      destructive: false,
    });
    if (!ok) return;

    this.actualizandoPagoId.set(inscripcion.id_inscripcion);
    this.eventoService.actualizarPago(inscripcion.id_inscripcion, 'confirmado').subscribe({
      next: async () => {
        this.actualizandoPagoId.set(null);
        this.cargarInscripciones(this.evento()!.id_evento);
        await this.dialog.success({
          titleKey: 'dialog.success.title',
          messageKey: 'eventos.exitoPago',
        });
      },
      error: async (err: { message?: string }) => {
        this.actualizandoPagoId.set(null);
        await this.dialog.error({
          titleKey: 'dialog.error.title',
          message: err.message ?? this.translate.instant('eventos.errorPago'),
        });
      },
    });
  }

  irAAsistencia() {
    const id = this.evento()?.id_evento;
    if (!id) return;

    if (this.jornadas().length === 0) {
      void this.dialog.warning({
        titleKey: 'dialog.warning.title',
        messageKey: 'asistencia.sinJornadas',
      });
      return;
    }

    this.router.navigate([this.eventoService.getBasePath(), id, 'asistencia']);
  }

  async onAsistenciaQrClick() {
    const motivo = this.motivoAsistenciaDeshabilitada();
    if (motivo) {
      await this.dialog.warning({
        titleKey: 'dialog.warning.title',
        messageKey: motivo,
      });
      return;
    }

    await this.dialog.info({
      titleKey: 'asistencia.titulo',
      messageKey: 'asistencia.instruccionesQr',
    });
  }

  irAReporte() {
    const id = this.evento()?.id_evento;
    if (id) {
      this.router.navigate([this.eventoService.getBasePath(), id, 'reporte']);
    }
  }

  formatearFecha(fecha: string): string {
    return formatearFechaLocal(fecha);
  }

  toDateInput(fecha: string): string {
    return toDateInputValue(fecha);
  }

  formatearHora(hora: string): string {
    if (!hora) return '—';
    const match = hora.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
    if (hora.length >= 5 && hora.includes(':')) return hora.substring(0, 5);
    return hora;
  }

  obtenerQRParaJornada(idJornada: number): string {
    return this.qrUrls()[idJornada] || '';
  }
}
