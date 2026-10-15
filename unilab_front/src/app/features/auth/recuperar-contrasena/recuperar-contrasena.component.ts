import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Página /recuperar-contrasena.
 * El backend genera una contraseña temporal para el correo; al ingresar con ella
 * el flujo de primer login obliga a definir una nueva (/cambiar-password).
 */
@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.scss',
})
export class RecuperarContrasenaComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly tempPassword = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(this.translate.instant('auth.recuperar.formInvalid'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.recuperarPassword(this.form.getRawValue().email).subscribe({
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
