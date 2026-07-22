import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { CreateJornadaDto, EventoJornada } from '../../core/models/evento.model';
import { ModalShellComponent } from '../../shared/ui/modal/modal-shell.component';
import { toDateInputValue } from '../../core/utils/date.util';

@Component({
  selector: 'app-jornada-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ModalShellComponent],
  templateUrl: './jornada-form.component.html',
  styleUrl: './jornada-form.component.scss',
})
export class JornadaFormComponent implements OnChanges {
  @Input() idEvento!: number;
  @Input() fechaMin = '';
  @Input() fechaMax = '';
  @Input() jornadaEditar: EventoJornada | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() jornadaCreada = new EventEmitter<void>();
  @Output() jornadaActualizada = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  private translate = inject(TranslateService);

  formulario!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);
  modoEdicion = signal(false);

  constructor() {
    this.formulario = this.fb.group({
      nombre_jornada: ['', [Validators.required, Validators.minLength(3)]],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jornadaEditar'] || changes['fechaMin']) {
      this.aplicarModoFormulario();
    }
  }

  private aplicarModoFormulario(): void {
    const jornada = this.jornadaEditar;
    this.modoEdicion.set(!!jornada);
    if (jornada) {
      this.formulario.patchValue({
        nombre_jornada: jornada.nombre_jornada,
        fecha: toDateInputValue(jornada.fecha),
        hora_inicio: this.horaParaInput(jornada.hora_inicio),
        hora_fin: this.horaParaInput(jornada.hora_fin),
      });
    } else if (this.fechaMin) {
      this.formulario.reset({
        nombre_jornada: '',
        fecha: this.fechaMin,
        hora_inicio: '',
        hora_fin: '',
      });
    }
  }

  private horaParaInput(hora: string): string {
    if (!hora) return '';
    const match = hora.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
    if (hora.length >= 5 && hora.includes(':')) return hora.substring(0, 5);
    return hora;
  }

  submit() {
    if (this.formulario.invalid) {
      this.error.set(this.translate.instant('eventos.formInvalid'));
      return;
    }

    const fecha = this.formulario.value.fecha as string;
    if (this.fechaMin && fecha < this.fechaMin) {
      this.error.set(this.translate.instant('jornadas.fechaFueraRango'));
      return;
    }
    if (this.fechaMax && fecha > this.fechaMax) {
      this.error.set(this.translate.instant('jornadas.fechaFueraRango'));
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const jornadaData: CreateJornadaDto = this.formulario.value;
    const jornada = this.jornadaEditar;

    if (jornada) {
      this.eventoService.actualizarJornada(jornada.id_jornada, jornadaData).subscribe({
        next: () => {
          this.enviando.set(false);
          this.jornadaActualizada.emit();
        },
        error: (err: { message?: string }) => {
          this.error.set(err.message ?? this.translate.instant('jornadas.errorActualizar'));
          this.enviando.set(false);
        },
      });
      return;
    }

    this.eventoService.crearJornada(this.idEvento, jornadaData).subscribe({
      next: () => {
        this.enviando.set(false);
        this.jornadaCreada.emit();
      },
      error: (err: { message?: string }) => {
        this.error.set(err.message ?? this.translate.instant('jornadas.errorCrear'));
        this.enviando.set(false);
      },
    });
  }

  cerrarModal() {
    if (this.enviando()) return;
    this.cerrar.emit();
  }

  /** Cierra el selector nativo de hora (p. ej. AM/PM en Chrome) al completar el valor. */
  cerrarSelectorHora(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value || input.value.length < 5) return;
    setTimeout(() => input.blur(), 0);
  }
}
