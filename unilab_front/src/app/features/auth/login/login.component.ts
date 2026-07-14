import { Component, OnInit, OnDestroy, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { getDefaultRouteForRole } from '../../../core/config/role-redirect';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  host: {
    '[class.login--codex]': 'variant === "codex"',
    '[class.login--embedded]': 'embedded',
  },
})
export class LoginComponent implements OnInit, OnDestroy {
  /** `default` = página /login · `codex` = portal público (dorado + azul apagado) */
  @Input() variant: 'default' | 'codex' = 'default';
  /** true cuando se renderiza dentro del modal del portal */
  @Input() embedded = false;
  @Output() authenticated = new EventEmitter<void>();
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  loginForm!: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.embedded && this.authService.isAuthenticated()) {
      this.redirectAfterAuth();
    }
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set(this.translate.instant('auth.login.formInvalid'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (this.embedded) {
            this.authenticated.emit();
            return;
          }
          if (response.usuario.primer_login) {
            this.router.navigate(['/cambiar-password']);
          } else {
            this.redirectAfterAuth();
          }
        },
        error: (err: { error?: { error?: string } }) => {
          this.loading.set(false);
          this.errorMessage.set(
            err.error?.error ?? this.translate.instant('auth.login.invalidCredentials'),
          );
        },
      });
  }

  private redirectAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }
    const user = this.authService.getCurrentUser();
    if (user) {
      this.router.navigate([getDefaultRouteForRole(user.id_rol)]);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
