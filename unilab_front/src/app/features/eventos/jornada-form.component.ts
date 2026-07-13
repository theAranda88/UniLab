import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { CreateJornadaDto } from '../../core/models/evento.model';

@Component({
  selector: 'app-jornada-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './jornada-form.component.html',
  styleUrl: './jornada-form.component.scss',
})
export class JornadaFormComponent {
  @Input() idEvento!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() jornadaCreada = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);

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

  submit() {
    if (this.formulario.invalid) {
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const jornadaData: CreateJornadaDto = this.formulario.value;
    this.eventoService.crearJornada(this.idEvento, jornadaData).subscribe({
      next: () => {
        this.jornadaCreada.emit();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error.set('Error al crear la jornada');
        this.enviando.set(false);
      },
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
