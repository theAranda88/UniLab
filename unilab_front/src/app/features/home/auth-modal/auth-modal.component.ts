import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { PublicPortalService } from '../public-portal.service';
import { LoginComponent } from '../../auth/login/login.component';
import type { Escuela } from '../../../core/models/portal.model';
import { navigateAfterLogin } from '../../../core/config/role-redirect';

type AuthTab = 'login' | 'register';
type RegisterRole = 'Estudiante' | 'Externo';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, LoginComponent],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private portal = inject(PublicPortalService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly tab = signal<AuthTab>('login');
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

  setTab(tab: AuthTab): void {
    this.tab.set(tab);
    this.errorMessage.set(null);
    this.tempPassword.set(null);
  }

  setRegisterRole(role: RegisterRole): void {
    this.registerRole.set(role);
    this.errorMessage.set(null);
  }

  onOverlayClick(): void {
    if (!this.loading()) {
      this.closed.emit();
    }
  }

  onClose(): void {
    if (!this.loading()) {
      this.closed.emit();
    }
  }

  onLoginSuccess(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.authenticated.emit();
      return;
    }

    void navigateAfterLogin(this.router, user, { fromPortal: true }).finally(() => {
      this.authenticated.emit();
    });
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
    this.registerForm.updateValueAndValidity();

    if (this.registerForm.invalid) {
      this.errorMessage.set(this.translate.instant('home.authModal.formInvalid'));
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
          this.errorMessage.set(err.details?.error ?? err.message ?? this.translate.instant('common.error'));
        },
      });
  }

  continueAfterRegister(): void {
    this.setTab('login');
  }
}
