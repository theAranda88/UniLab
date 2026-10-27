import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { PublicPortalService } from '../../home/public-portal.service';
import { navigateAfterLogin } from '../../../core/config/role-redirect';
import type { Escuela } from '../../../core/models/portal.model';
import {
  GITHUB_DOMINIO,
  LINKEDIN_DOMINIO,
  redesDesdeFormulario,
  urlRedValidator,
} from '../../../shared/validators/redes.validators';

@Component({
  selector: 'app-completar-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './completar-perfil.component.html',
  styleUrl: './completar-perfil.component.scss',
})
export class CompletarPerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private portal = inject(PublicPortalService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly escuelas = signal<Escuela[]>([]);

  readonly form = this.fb.nonNullable.group({
    documento_identidad: ['', Validators.required],
    telefono: ['', Validators.required],
    codigo_estudiantil: [''],
    id_escuela: [null as number | null],
    institucion: [''],
    ocupacion: [''],
    url_linkedin: ['', urlRedValidator(LINKEDIN_DOMINIO)],
    url_github: ['', urlRedValidator(GITHUB_DOMINIO)],
    url_portafolio: ['', urlRedValidator()],
  });

  readonly rol = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.rol.set(user.id_rol);

    if (user.id_rol === 'Estudiante') {
      this.form.get('codigo_estudiantil')?.setValidators([Validators.required]);
      this.form.get('id_escuela')?.setValidators([Validators.required]);
      this.portal.listarEscuelas().subscribe({
        next: (data) => this.escuelas.set(data),
      });
    } else if (user.id_rol === 'Externo') {
      this.form.get('institucion')?.setValidators([Validators.required]);
      this.form.get('ocupacion')?.setValidators([Validators.required]);
    }
  }

  /** true si el campo es inválido y ya fue tocado (o se intentó enviar). */
  hasError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  /** Clave i18n del error de una red de contacto, o null si es válida. */
  redError(name: 'url_linkedin' | 'url_github' | 'url_portafolio'): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !control.touched) return null;
    return control.hasError('dominio') ? `perfil.redes.errores.${name}` : 'perfil.redes.errores.url';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const rol = this.rol();

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .completarPerfil({
        documento_identidad: raw.documento_identidad,
        telefono: raw.telefono,
        ...redesDesdeFormulario(raw),
        ...(rol === 'Estudiante'
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
        next: () => {
          this.loading.set(false);
          const user = this.auth.getCurrentUser();
          if (!user) {
            this.router.navigate(['/']);
            return;
          }
          void navigateAfterLogin(this.router, user);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('auth.completarPerfil.error');
        },
      });
  }
}
