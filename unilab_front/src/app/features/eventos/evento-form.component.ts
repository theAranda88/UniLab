import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import {
  AlcanceEvento,
  CreateEventoDto,
  SolicitudEventoDto,
  UpdateEventoDto,
} from '../../core/models/evento.model';
import type { EscuelaAdmin } from '../../core/models/escuela.model';
import type { Semillero } from '../../core/models/semillero.model';
import { EscuelasService } from '../escuelas/escuelas.service';
import { SemillerosService } from '../semilleros/semilleros.service';
import { DialogService } from '../../shared/ui/dialog/dialog.service';

import { ToastService } from '../../shared/ui/toast/toast.service';
@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './evento-form.component.html',
  styleUrl: './evento-form.component.scss',
})
export class EventoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private escuelasService = inject(EscuelasService);
  private semillerosService = inject(SemillerosService);

  formulario!: FormGroup;
  enviando = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);
  modoEdicion = signal(false);
  idEvento = signal<number | null>(null);
  nombreEvento = signal('');
  urlFlyerActual = signal<string | null>(null);
  flyerPendiente = signal<File | null>(null);
  flyerPreview = signal<string | null>(null);
  subiendoFlyer = signal(false);

  /** Un usuario Externo solicita un evento: sin estado, alcance ni flyer; queda pendiente de aprobación. */
  readonly modoSolicitud = signal(false);
  readonly alcances: AlcanceEvento[] = ['institucional', 'escuela', 'semillero', 'externo'];
  readonly escuelas = signal<EscuelaAdmin[]>([]);
  readonly semilleros = signal<Semillero[]>([]);
  /** El evento editado es una solicitud externa sin resolver: su estado no se toca desde aquí. */
  readonly esSolicitudPendiente = signal(false);

  get alcanceActual(): AlcanceEvento {
    return this.formulario.get('alcance')?.value as AlcanceEvento;
  }

  ngOnInit(): void {
    this.modoSolicitud.set(this.route.snapshot.data['solicitud'] === true);
    if (!this.modoSolicitud()) {
      this.escuelasService.listar().subscribe({ next: (data) => this.escuelas.set(data) });
      this.semillerosService.listar().subscribe({ next: (data) => this.semilleros.set(data) });
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idEvento.set(Number(idParam));
      this.cargarEvento(Number(idParam));
    }
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nombre_evento: ['', [Validators.required, Validators.minLength(3)]],
      tipo_evento: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      lugar: ['', Validators.required],
      estado: ['planeado', Validators.required],
      requiere_pago: [false],
      alcance: [this.modoSolicitud() ? 'externo' : 'institucional'],
      id_escuela: [null as number | null],
      id_semillero: [null as number | null],
      organizacion_externa: ['', this.modoSolicitud() ? [Validators.required] : []],
    });
  }

  /** Solo se envía el dato que corresponde al alcance elegido. */
  private datosAlcance() {
    const v = this.formulario.value;
    const alcance = v.alcance as AlcanceEvento;
    return {
      alcance,
      id_escuela: alcance === 'escuela' ? v.id_escuela : null,
      id_semillero: alcance === 'semillero' ? v.id_semillero : null,
      organizacion_externa: alcance === 'externo' ? (v.organizacion_externa ?? '').trim() : null,
    };
  }

  /** Clave de error si el alcance elegido no tiene su dato obligatorio. */
  private errorAlcance(): string | null {
    const a = this.datosAlcance();
    if (a.alcance === 'escuela' && !a.id_escuela) return 'eventos.alcance.errorEscuela';
    if (a.alcance === 'semillero' && !a.id_semillero) return 'eventos.alcance.errorSemillero';
    if (a.alcance === 'externo' && !a.organizacion_externa) return 'eventos.alcance.errorExterno';
    return null;
  }

  private cargarEvento(id: number): void {
    this.cargando.set(true);
    this.eventoService.obtener(id).subscribe({
      next: (evento) => {
        this.nombreEvento.set(evento.nombre_evento);
        this.formulario.patchValue({
          nombre_evento: evento.nombre_evento,
          tipo_evento: evento.tipo_evento,
          descripcion: evento.descripcion,
          fecha_inicio: this.toDateInput(evento.fecha_inicio),
          fecha_fin: this.toDateInput(evento.fecha_fin),
          lugar: evento.lugar,
          estado: evento.estado,
          requiere_pago: evento.requiere_pago,
          alcance: evento.alcance ?? 'institucional',
          id_escuela: evento.id_escuela,
          id_semillero: evento.id_semillero,
          organizacion_externa: evento.organizacion_externa ?? '',
        });
        this.esSolicitudPendiente.set(['solicitado', 'rechazado'].includes(evento.estado));
        this.urlFlyerActual.set(evento.url_flyer ?? null);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('eventos.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  private toDateInput(fecha: string): string {
    return fecha.split('T')[0];
  }

  onFlyerSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.flyerPendiente.set(file);
    this.flyerPreview.set(URL.createObjectURL(file));
  }

  quitarFlyerPendiente(): void {
    this.flyerPendiente.set(null);
    this.flyerPreview.set(null);
  }

  eliminarFlyerActual(): void {
    const id = this.idEvento();
    if (!id) return;
    this.subiendoFlyer.set(true);
    this.eventoService.eliminarFlyer(id).subscribe({
      next: () => {
        this.urlFlyerActual.set(null);
        this.subiendoFlyer.set(false);
      },
      error: () => {
        this.error.set('eventos.flyerError');
        this.subiendoFlyer.set(false);
      },
    });
  }

  private subirFlyerSiHay(idEvento: number, alTerminar: () => void): void {
    const file = this.flyerPendiente();
    if (!file) {
      alTerminar();
      return;
    }
    this.subiendoFlyer.set(true);
    this.eventoService.subirFlyer(idEvento, file).subscribe({
      next: (res) => {
        this.urlFlyerActual.set(res.url_flyer);
        this.flyerPendiente.set(null);
        this.flyerPreview.set(null);
        this.subiendoFlyer.set(false);
        alTerminar();
      },
      error: () => {
        this.error.set('eventos.flyerError');
        this.subiendoFlyer.set(false);
        alTerminar();
      },
    });
  }

  submit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set(this.translate.instant('eventos.formInvalid'));
      return;
    }
    const errorAlcance = this.errorAlcance();
    if (errorAlcance) {
      this.error.set(errorAlcance);
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { alcance: _a, id_escuela: _e, id_semillero: _s, organizacion_externa: _o, ...datos } =
      this.formulario.value;

    if (this.modoSolicitud()) {
      const { estado: _estado, ...base } = datos;
      const solicitud: SolicitudEventoDto = {
        ...base,
        organizacion_externa: this.datosAlcance().organizacion_externa ?? '',
      };
      this.eventoService.solicitar(solicitud).subscribe({
        next: () => {
          this.enviando.set(false);
          this.toast.success('eventos.solicitud.exitoEnviar');
          this.router.navigate(['/mis-solicitudes']);
        },
        error: () => {
          this.error.set('eventos.solicitud.errorEnviar');
          this.enviando.set(false);
        },
      });
      return;
    }

    if (this.modoEdicion()) {
      const data: UpdateEventoDto = { ...datos, ...this.datosAlcance() };
      if (this.esSolicitudPendiente()) delete data.estado;
      this.eventoService.actualizar(this.idEvento()!, data).subscribe({
        next: async () => {
          this.subirFlyerSiHay(this.idEvento()!, async () => {
            this.enviando.set(false);
            this.toast.success('eventos.exitoActualizar');
            this.router.navigate([this.eventoService.getBasePath(), this.idEvento()]);
          });
        },
        error: async (err: { message?: string }) => {
          this.error.set(err.message ?? 'eventos.errorActualizar');
          this.enviando.set(false);
        },
      });
    } else {
      const eventoData: CreateEventoDto = { ...datos, ...this.datosAlcance() };
      this.eventoService.crear(eventoData).subscribe({
        next: async (evento) => {
          this.subirFlyerSiHay(evento.id_evento, async () => {
            this.enviando.set(false);
            this.toast.success('eventos.exitoCrear');
            this.router.navigate([this.eventoService.getBasePath(), evento.id_evento]);
          });
        },
        error: async (err: { message?: string }) => {
          this.error.set(err.message ?? 'eventos.errorCrear');
          this.enviando.set(false);
        },
      });
    }
  }

  volver() {
    if (this.modoSolicitud()) {
      this.router.navigate(['/mis-solicitudes']);
    } else if (this.modoEdicion() && this.idEvento()) {
      this.router.navigate([this.eventoService.getBasePath(), this.idEvento()]);
    } else {
      this.router.navigate([this.eventoService.getBasePath()]);
    }
  }
}
