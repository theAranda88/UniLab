import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService, type User } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { RedesContactoComponent } from '../../../shared/ui/redes-contacto/redes-contacto.component';
import {
  GITHUB_DOMINIO,
  LINKEDIN_DOMINIO,
  redesDesdeFormulario,
  urlRedValidator,
} from '../../../shared/validators/redes.validators';

/** Mismo formato que valida el backend: opcional «+», 7 a 20 dígitos, espacios o guiones. */
const TELEFONO_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;

type CampoContacto = 'telefono' | 'profesion' | 'url_linkedin' | 'url_github' | 'url_portafolio';

function passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('nueva_password')?.value;
  const confirmar = group.get('confirmar_password')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
}

/**
 * Mi perfil: rol, escuela y semilleros (solo lectura); teléfono, profesión (Coordinador)
 * y redes de contacto editables; cambio de contraseña.
 */
@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RedesContactoComponent],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.scss',
})
export class MiPerfilComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly usuario = this.auth.user;
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly cambiandoPassword = signal(false);
  readonly errorPassword = signal<string | null>(null);
  readonly mostrarPasswords = signal(false);

  readonly esCoordinador = computed(() => this.usuario()?.id_rol === 'Coordinador');

  readonly form = this.fb.nonNullable.group({
    telefono: ['', [Validators.required, Validators.pattern(TELEFONO_PATTERN)]],
    profesion: ['', Validators.maxLength(255)],
    url_linkedin: ['', urlRedValidator(LINKEDIN_DOMINIO)],
    url_github: ['', urlRedValidator(GITHUB_DOMINIO)],
    url_portafolio: ['', urlRedValidator()],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      password_actual: ['', Validators.required],
      nueva_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmar_password: ['', Validators.required],
    },
    { validators: passwordsCoinciden },
  );

  readonly nombreCompleto = computed(() => {
    const u = this.usuario();
    return `${u?.nombres ?? ''} ${u?.apellidos ?? ''}`.trim() || u?.email || '';
  });

  readonly iniciales = computed(() => {
    const u = this.usuario();
    const letras = `${u?.nombres?.charAt(0) ?? ''}${u?.apellidos?.charAt(0) ?? ''}`.toUpperCase();
    return letras || u?.email?.charAt(0).toUpperCase() || '?';
  });

  /** Filas «etiqueta: valor» del perfil según el rol (solo las que tienen dato). */
  readonly datos = computed(() => {
    const u = this.usuario();
    if (!u) return [];
    const p = u.perfil;
    const filas: { etiqueta: string; valor: string | null | undefined }[] = [
      { etiqueta: 'perfil.escuela', valor: u.escuela?.nombre_escuela },
      { etiqueta: 'usuarios.codigoDocente', valor: p?.codigo_docente },
      { etiqueta: 'usuarios.codigoEstudiantil', valor: p?.codigo_estudiantil },
      { etiqueta: 'usuarios.cargo', valor: p?.cargo },
      { etiqueta: 'usuarios.dependencia', valor: p?.dependencia },
      { etiqueta: 'perfil.profesion', valor: p?.profesion },
      { etiqueta: 'usuarios.institucion', valor: p?.institucion },
      { etiqueta: 'usuarios.ocupacion', valor: p?.ocupacion },
    ];
    return filas.filter((f) => !!f.valor);
  });

  ngOnInit(): void {
    this.cargarFormulario(this.usuario());
    this.cargando.set(true);
    this.auth.me().subscribe({
      next: (u) => {
        this.cargarFormulario(u);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('perfil.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  /** Clave i18n del error de un campo de contacto, o null si es válido o no se ha tocado. */
  errorCampo(name: CampoContacto): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !control.touched) return null;
    if (name === 'telefono') {
      return control.hasError('required') ? 'auth.registro.errors.required' : 'perfil.errores.telefono';
    }
    if (name === 'profesion') return 'perfil.errores.profesion';
    return control.hasError('dominio') ? `perfil.redes.errores.${name}` : 'perfil.redes.errores.url';
  }

  errorPasswordCampo(name: 'password_actual' | 'nueva_password' | 'confirmar_password'): string | null {
    const control = this.passwordForm.controls[name];
    if (!control.touched) return null;
    if (control.hasError('required')) return 'auth.registro.errors.required';
    if (control.hasError('minlength')) return 'perfil.password.errores.minimo';
    if (name === 'confirmar_password' && this.passwordForm.hasError('noCoinciden')) {
      return 'perfil.password.errores.noCoinciden';
    }
    return null;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    this.auth
      .actualizarMiPerfil({
        telefono: raw.telefono.trim(),
        ...redesDesdeFormulario(raw),
        ...(this.esCoordinador() ? { profesion: raw.profesion.trim() || null } : {}),
      })
      .subscribe({
        next: (u) => {
          this.guardando.set(false);
          this.cargarFormulario(u);
          this.toast.success('perfil.exito');
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('perfil.errorGuardar');
        },
      });
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { password_actual, nueva_password } = this.passwordForm.getRawValue();
    if (password_actual === nueva_password) {
      this.errorPassword.set('perfil.password.errores.igual');
      return;
    }
    this.cambiandoPassword.set(true);
    this.errorPassword.set(null);
    this.auth.cambiarMiPassword({ password_actual, nueva_password }).subscribe({
      next: () => {
        this.cambiandoPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('perfil.password.exito');
      },
      error: (err: { status?: number }) => {
        this.cambiandoPassword.set(false);
        this.errorPassword.set(
          err?.status === 422 ? 'perfil.password.errores.actualIncorrecta' : 'perfil.password.errores.general',
        );
      },
    });
  }

  private cargarFormulario(u: User | null): void {
    this.form.reset({
      telefono: u?.telefono ?? '',
      profesion: u?.perfil?.profesion ?? '',
      url_linkedin: u?.redes?.linkedin ?? '',
      url_github: u?.redes?.github ?? '',
      url_portafolio: u?.redes?.portafolio ?? '',
    });
  }
}
