import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/** El PDF del certificado solo admite PNG y JPEG. */
const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg'];
const MAX_BYTES = 2 * 1024 * 1024;

/** Firma que se imprime en los certificados de los eventos que organiza el usuario. */
@Component({
  selector: 'app-firma-usuario',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './firma-usuario.component.html',
  styleUrl: './firma-usuario.component.scss',
})
export class FirmaUsuarioComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly url = computed(() => this.auth.user()?.url_firma ?? null);
  readonly subiendo = signal(false);
  readonly error = signal<string | null>(null);

  elegir(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.error.set('certificados.firma.errorTipo');
      return;
    }
    if (archivo.size > MAX_BYTES) {
      this.error.set('certificados.firma.errorTamano');
      return;
    }

    this.error.set(null);
    this.subiendo.set(true);
    this.auth.subirFirma(archivo).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.toast.success('certificados.firma.guardada');
      },
      error: () => {
        this.subiendo.set(false);
        this.error.set('certificados.firma.errorSubir');
      },
    });
  }

  quitar(): void {
    this.subiendo.set(true);
    this.auth.eliminarFirma().subscribe({
      next: () => this.subiendo.set(false),
      error: () => {
        this.subiendo.set(false);
        this.toast.error('certificados.firma.errorQuitar');
      },
    });
  }
}
