import { Component, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, type FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { PublicPortalService } from '../../home/public-portal.service';
import { AuthBrandComponent } from '../auth-brand/auth-brand.component';
import type { Escuela } from '../../../core/models/portal.model';

type RegisterRole = 'Estudiante' | 'Externo';

/** Clave i18n de la etiqueta de cada campo (para listar los que tienen error). */
const FIELD_LABELS: Record<string, string> = {
  nombres: 'auth.registro.firstName',
  apellidos: 'auth.registro.lastName',
  email: 'auth.registro.email',
  documento_identidad: 'auth.registro.document',
  telefono: 'auth.registro.phone',
  codigo_estudiantil: 'auth.registro.studentCode',
  id_escuela: 'auth.registro.school',
  institucion: 'auth.registro.institution',
  ocupacion: 'auth.registro.occupation',
};

/** Página /registro — crea una cuenta de Estudiante o Externo desde el portal público. */
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, AuthBrandComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private portal = inject(PublicPortalService);
  private translate = inject(TranslateService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly roles: RegisterRole[] = ['Estudiante', 'Externo'];
  readonly registerRole = signal<RegisterRole>('Estudiante');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly tempPassword = signal<string | null>(null);
  readonly escuelas = signal<Escuela[]>([]);

  registerForm: FormGroup = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    documento_identidad: ['', Validators.required],
    telefono: ['', Validators.required],
    codigo_estudiantil: [''],
    id_escuela: [null as number | null],
    institucion: [''],
    ocupacion: [''],
  });

  constructor() {
    this.portal.listarEscuelas().subscribe({
      next: (data) => this.escuelas.set(data),
    });
  }

  setRegisterRole(role: RegisterRole): void {
    this.registerRole.set(role);
    this.errorMessage.set(null);
  }

  /** true si el campo debe mostrar su error (inválido y ya tocado o enviado). */
  hasError(name: string): boolean {
    const control = this.registerForm.get(name);
    return !!control && control.invalid && control.touched;
  }

  /** Clave i18n del motivo del error del campo. */
  errorKey(name: string): string {
    const errors = this.registerForm.get(name)?.errors;
    return errors?.['email'] ? 'auth.registro.errors.email' : 'auth.registro.errors.required';
  }

  private focusFirstInvalid(): void {
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid')
        ?.focus(),
    );
  }

  submitRegister(): void {
    const role = this.registerRole();
    if (role === 'Estudiante') {
      this.registerForm.get('codigo_estudiantil')?.setValidators([Validators.required]);
      this.registerForm.get('id_escuela')?.setValidators([Validators.required]);
      this.registerForm.get('institucion')?.clearValidators();
      this.registerForm.get('ocupacion')?.clearValidators();
    } else {
      this.registerForm.get('institucion')?.setValidators([Validators.required]);
      this.registerForm.get('ocupacion')?.setValidators([Validators.required]);
      this.registerForm.get('codigo_estudiantil')?.clearValidators();
      this.registerForm.get('id_escuela')?.clearValidators();
    }
    Object.values(this.registerForm.controls).forEach((c) => c.updateValueAndValidity());

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      const campos = Object.keys(FIELD_LABELS)
        .filter((name) => this.registerForm.get(name)?.invalid)
        .map((name) => this.translate.instant(FIELD_LABELS[name]));
      this.errorMessage.set(
        this.translate.instant('auth.registro.formInvalidFields', { campos: campos.join(', ') }),
      );
      this.focusFirstInvalid();
      return;
    }

    const raw = this.registerForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth
      .register({
        nombres: raw.nombres,
        apellidos: raw.apellidos,
        email: raw.email,
        documento_identidad: raw.documento_identidad,
        telefono: raw.telefono,
        rol: role,
        ...(role === 'Estudiante'
          ? {
              codigo_estudiantil: raw.codigo_estudiantil,
              id_escuela: Number(raw.id_escuela),
            }
          : {
              institucion: raw.institucion,
              ocupacion: raw.ocupacion,
            }),
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.tempPassword.set(response.password_temporal);
        },
        error: (err: { message?: string; details?: { error?: string } }) => {
          this.loading.set(false);
          this.errorMessage.set(
            err.details?.error ?? err.message ?? this.translate.instant('common.error'),
          );
        },
      });
  }
}
