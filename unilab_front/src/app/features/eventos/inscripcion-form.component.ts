import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { PublicPortalService } from '../home/public-portal.service';
import { Evento, CreateInscripcionDto } from '../../core/models/evento.model';
import { AuthService } from '../../core/auth/auth.service';
import { guardarDocumentoInscripcion } from '../../core/utils/inscripcion-documento.util';
import { ModalShellComponent } from '../../shared/ui/modal/modal-shell.component';
import type { UiVariant } from '../../shared/ui/ui-variant';

@Component({
  selector: 'app-inscripcion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ModalShellComponent],
  templateUrl: './inscripcion-form.component.html',
  styleUrl: './inscripcion-form.component.scss',
  host: {
    '[class.inscripcion-form--portal]': 'variant === "portal"',
  },
})
export class InscripcionFormComponent {
  @Input() evento!: Evento;
  @Input() variant: UiVariant = 'default';
  @Input() modoPublico = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() inscripcionExitosa = new EventEmitter<string | void>();

  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  private portal = inject(PublicPortalService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  formulario!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);
  usuarioRol = signal<string | null>(null);

  constructor() {
    this.formulario = this.fb.group({
      tipo_asistente: ['externo', Validators.required],
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      documento_identidad: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      institucion: [''],
      genero: ['', Validators.required],
    });

    this.authService.user$.subscribe((user) => {
      if (user && !this.modoPublico) {
        this.usuarioRol.set(user.id_rol);
        this.formulario.patchValue({
          tipo_asistente: this.mapearRolATipoAsistente(user.id_rol),
          email: user.email,
        });
      }
    });
  }

  mapearRolATipoAsistente(rol: string): string {
    const mapa: Record<string, string> = {
      Profesor: 'profesor',
      Estudiante: 'estudiante',
      Externo: 'externo',
    };
    return mapa[rol] || 'externo';
  }

  submit() {
    if (this.formulario.invalid) {
      this.error.set(this.translate.instant('eventos.formInvalid'));
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const inscripcionData: CreateInscripcionDto = this.formulario.value;
    const documento = inscripcionData.documento_identidad;

    const request = this.modoPublico
      ? this.portal.inscribirEvento(this.evento.id_evento, {
          nombre_completo: inscripcionData.nombre_completo,
          documento_identidad: documento,
          email: inscripcionData.email,
          telefono: inscripcionData.telefono,
          institucion: inscripcionData.institucion,
          genero: inscripcionData.genero,
        })
      : this.eventoService.inscribirse(this.evento.id_evento, inscripcionData);

    request.subscribe({
      next: () => {
        this.enviando.set(false);
        if (this.modoPublico) {
          guardarDocumentoInscripcion(documento);
        }
        this.inscripcionExitosa.emit(this.modoPublico ? documento : undefined);
      },
      error: (err: { message?: string }) => {
        this.error.set(err.message ?? this.translate.instant('inscripcion.errorRegistrar'));
        this.enviando.set(false);
      },
    });
  }

  cerrarModal() {
    if (this.enviando()) return;
    this.cerrar.emit();
  }
}
