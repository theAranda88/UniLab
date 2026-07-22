import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { CreateEventoDto, UpdateEventoDto } from '../../core/models/evento.model';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb.component';
import { DialogService } from '../../shared/ui/dialog/dialog.service';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, BreadcrumbComponent],
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

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const base = this.eventoService.getBasePath();
    if (this.modoEdicion()) {
      const id = this.idEvento();
      const items: BreadcrumbItem[] = [
        { labelKey: 'eventos.title', route: base },
      ];
      if (this.nombreEvento()) {
        items.push({ label: this.nombreEvento(), route: id ? [base, String(id)] : undefined });
      }
      items.push({ labelKey: 'eventos.editar' });
      return items;
    }
    return [
      { labelKey: 'eventos.title', route: base },
      { labelKey: 'eventos.crear' },
    ];
  });

  ngOnInit(): void {
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
    });
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
        });
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
      this.error.set(this.translate.instant('eventos.formInvalid'));
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    if (this.modoEdicion()) {
      const data: UpdateEventoDto = this.formulario.value;
      this.eventoService.actualizar(this.idEvento()!, data).subscribe({
        next: async () => {
          this.subirFlyerSiHay(this.idEvento()!, async () => {
            this.enviando.set(false);
            await this.dialog.success({
              titleKey: 'dialog.success.title',
              messageKey: 'eventos.exitoActualizar',
            });
            this.router.navigate([this.eventoService.getBasePath(), this.idEvento()]);
          });
        },
        error: async (err: { message?: string }) => {
          this.error.set(err.message ?? 'eventos.errorActualizar');
          this.enviando.set(false);
        },
      });
    } else {
      const eventoData: CreateEventoDto = this.formulario.value;
      this.eventoService.crear(eventoData).subscribe({
        next: async (evento) => {
          this.subirFlyerSiHay(evento.id_evento, async () => {
            this.enviando.set(false);
            await this.dialog.success({
              titleKey: 'dialog.success.title',
              messageKey: 'eventos.exitoCrear',
            });
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
    if (this.modoEdicion() && this.idEvento()) {
      this.router.navigate([this.eventoService.getBasePath(), this.idEvento()]);
    } else {
      this.router.navigate([this.eventoService.getBasePath()]);
    }
  }
}
