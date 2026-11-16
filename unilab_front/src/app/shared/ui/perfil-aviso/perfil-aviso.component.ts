import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { getShellPrefix } from '../../../core/config/role-redirect';

/**
 * Aviso del primer ingreso: invita a completar el perfil tipo CvLAC (titular, especialidades,
 * enlaces académicos, formación). «Ahora no» lo descarta para siempre; guardar el perfil también.
 * No aparece mientras el usuario debe cambiar la contraseña o completar datos obligatorios.
 */
@Component({
  selector: 'app-perfil-aviso',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './perfil-aviso.component.html',
  styleUrl: './perfil-aviso.component.scss',
})
export class PerfilAvisoComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly enviando = signal(false);
  /** Se cierra en esta sesión aunque la petición de «Ahora no» falle. */
  private readonly cerradoLocal = signal(false);

  readonly visible = computed(() => {
    const u = this.auth.user();
    if (!u || this.cerradoLocal()) return false;
    if (u.primer_login || u.perfil_pendiente || u.perfil_cv_revisado !== false) return false;
    const url = this.url();
    // No interrumpe en el propio perfil ni en los flujos de acceso
    return !/\/(perfil|login|registro|cambiar-password|completar-perfil)(\/|$|\?)/.test(url);
  });

  readonly nombre = computed(() => this.auth.user()?.nombres ?? '');

  completarAhora(): void {
    const prefijo = getShellPrefix(this.auth.user()?.id_rol ?? '');
    this.cerradoLocal.set(true);
    void this.router.navigate([prefijo ? `${prefijo}/perfil` : '/perfil'], { fragment: 'perfil-profesional' });
  }

  ahoraNo(): void {
    this.enviando.set(true);
    this.auth.omitirPerfilCv().subscribe({
      next: () => this.enviando.set(false),
      error: () => {
        this.enviando.set(false);
        this.cerradoLocal.set(true);
      },
    });
  }
}
