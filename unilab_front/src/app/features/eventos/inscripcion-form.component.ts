import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { Evento, CreateInscripcionDto } from '../../core/models/evento.model';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-inscripcion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './inscripcion-form.component.html',
  styleUrl: './inscripcion-form.component.scss',
})
export class InscripcionFormComponent {
  @Input() evento!: Evento;
  @Output() cerrar = new EventEmitter<void>();
  @Output() inscripcionExitosa = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  private authService = inject(AuthService);

  formulario!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);
  usuarioRol = signal<string | null>(null);

  constructor() {
    this.formulario = this.fb.group({
      tipo_asistente: ['', Validators.required],
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      documento_identidad: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      institucion: [''],
      genero: ['', Validators.required],
    });

    this.authService.user$.subscribe((user) => {
      if (user) {
        this.usuarioRol.set(user.id_rol);
        this.formulario.patchValue({
          tipo_asistente: this.mapearRolATipoAsistente(user.id_rol),
          email: user.email,
        });
      }
    });
  }

  mapearRolATipoAsistente(rol: string): string {
    const mapa: { [key: string]: string } = {
      Profesor: 'profesor',
      Estudiante: 'estudiante',
      Externo: 'externo',
    };
    return mapa[rol] || 'externo';
  }

  submit() {
    if (this.formulario.invalid) {
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const inscripcionData: CreateInscripcionDto = this.formulario.value;
    this.eventoService.inscribirse(this.evento.id_evento, inscripcionData).subscribe({
      next: () => {
        this.inscripcionExitosa.emit();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error.set(err.error?.message || 'Error al registrar la inscripción');
        this.enviando.set(false);
      },
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
