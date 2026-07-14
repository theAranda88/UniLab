import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService, CambiarPasswordResponse } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss']
})
export class CambiarPasswordComponent implements OnInit, OnDestroy {
  cambiarPasswordForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showPasswordConfirm = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    // Si no está autenticado O no tiene primer_login=true, no puede estar aquí
    const user = this.authService.getCurrentUser();
    if (!user || !user.primer_login) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.cambiarPasswordForm = this.formBuilder.group({
      nueva_password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar_password: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator.bind(this) });
  }

  private passwordsMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('nueva_password')?.value;
    const confirm = group.get('confirmar_password')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (this.cambiarPasswordForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente.';
      return;
    }

    if (this.cambiarPasswordForm.errors?.['passwordsMismatch']) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { nueva_password } = this.cambiarPasswordForm.value;

    this.authService
      .cambiarPassword(nueva_password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CambiarPasswordResponse) => {
          this.loading = false;
          this.successMessage = 'Contraseña actualizada correctamente. Redirigiendo al dashboard...';
          
          // Actualizar primer_login en el servicio
          const user = this.authService.getCurrentUser();
          if (user) {
            this.authService.updateUser({ primer_login: false });
          }

          // Redirigir después de 1.5 segundos
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (err: any) => {
          this.loading = false;
          this.errorMessage = err.error?.error ?? err.error?.mensaje ?? 'Error al cambiar la contraseña.';
        }
      });
  }

  get nuevaPassword() {
    return this.cambiarPasswordForm.get('nueva_password');
  }

  get confirmarPassword() {
    return this.cambiarPasswordForm.get('confirmar_password');
  }

  get isPasswordMismatch(): boolean {
    return this.cambiarPasswordForm.errors?.['passwordsMismatch'] && 
           (this.confirmarPassword?.dirty || this.confirmarPassword?.touched) || false;
  }
}

