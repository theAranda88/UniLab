import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../toast/toast.service';
import { AvatarComponent } from '../avatar/avatar.component';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Foto de perfil del usuario en sesión: la muestra y permite subirla, cambiarla o quitarla.
 * Se guarda al elegir el archivo (no depende del botón «Guardar» del formulario que la rodea).
 */
@Component({
  selector: 'app-foto-perfil',
  standalone: true,
  imports: [TranslatePipe, AvatarComponent],
  templateUrl: './foto-perfil.component.html',
  styleUrl: './foto-perfil.component.scss',
})
export class FotoPerfilComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  /** `lg` para el asistente de perfil; `md` en «Mi perfil». */
  readonly tamano = input<'md' | 'lg'>('md');

  readonly subiendo = signal(false);
  /** Vista previa local mientras se sube. */
  readonly vistaPrevia = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly url = computed(() => this.vistaPrevia() ?? this.auth.user()?.url_foto ?? null);
  readonly tieneFoto = computed(() => !!this.auth.user()?.url_foto);
  readonly iniciales = computed(() => {
    const u = this.auth.user();
    return `${u?.nombres?.charAt(0) ?? ''}${u?.apellidos?.charAt(0) ?? ''}`.toUpperCase() || '?';
  });

  elegir(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.error.set('fotoPerfil.errores.tipo');
      return;
    }
    if (archivo.size > MAX_BYTES) {
      this.error.set('fotoPerfil.errores.tamano');
      return;
    }

    this.error.set(null);
    const previa = URL.createObjectURL(archivo);
    this.vistaPrevia.set(previa);
    this.subiendo.set(true);
    this.auth.subirFoto(archivo).subscribe({
      next: () => this.terminar(previa),
      error: () => {
        this.terminar(previa);
        this.error.set('fotoPerfil.errores.subir');
      },
    });
  }

  quitar(): void {
    this.subiendo.set(true);
    this.auth.eliminarFoto().subscribe({
      next: () => this.subiendo.set(false),
      error: () => {
        this.subiendo.set(false);
        this.toast.error('fotoPerfil.errores.quitar');
      },
    });
  }

  private terminar(previa: string): void {
    this.subiendo.set(false);
    this.vistaPrevia.set(null);
    URL.revokeObjectURL(previa);
  }
}
