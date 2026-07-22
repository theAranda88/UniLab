import { Component, Input, Output, EventEmitter, inject, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { CreateJornadaDto } from '../../core/models/evento.model';
import { ModalShellComponent } from '../../shared/ui/modal/modal-shell.component';

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
  @Output() cerrar = new EventEmitter<void>();
  @Output() jornadaCreada = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  private translate = inject(TranslateService);

  formulario!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.formulario = this.fb.group({
      nombre_jornada: ['', [Validators.required, Validators.minLength(3)]],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
    });
  }

  ngOnChanges(): void {
    if (this.fechaMin) {
      this.formulario.patchValue({ fecha: this.fechaMin });
    }
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
