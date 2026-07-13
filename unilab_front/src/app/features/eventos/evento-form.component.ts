import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from '../../core/models/evento.model';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './evento-form.component.html',
  styleUrl: './evento-form.component.scss',
})
export class EventoFormComponent {
  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  private router = inject(Router);

  formulario!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);

  constructor() {
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

  submit() {
    if (this.formulario.invalid) {
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const eventoData: CreateEventoDto = this.formulario.value;
    this.eventoService.crear(eventoData).subscribe({
      next: (evento: any) => {
        this.router.navigate(['/eventos', evento.id_evento]);
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error.set('Error al crear el evento');
        this.enviando.set(false);
      },
    });
  }

  volver() {
    this.router.navigate(['/eventos']);
  }
}
