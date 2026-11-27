import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../toast/toast.service';
import { AvatarComponent } from '../avatar/avatar.component';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
/** Tope del archivo original; lo que se sube es la versión reducida (suele quedar en 50-150 KB). */
const MAX_BYTES_ORIGINAL = 15 * 1024 * 1024;
/** Lado mayor de la foto subida: basta para el avatar más grande del sitio. */
const LADO_MAXIMO = 512;
const CALIDAD_JPEG = 0.82;

/** Reduce la imagen a LADO_MAXIMO px y la convierte a JPEG para que pese poco. */
async function optimizarFoto(archivo: File): Promise<File> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  // Fondo blanco: los PNG con transparencia no quedan negros al pasar a JPEG
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG));
  if (!blob) throw new Error('toBlob');
  return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
}

/**
 * Foto de perfil del usuario en sesión: la muestra y permite subirla, cambiarla o quitarla.
 * Se guarda al elegir el archivo (no depende del botón «Guardar» del formulario que la rodea) y
 * antes se reduce en el navegador para que pese poco.
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

  async elegir(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const original = input.files?.[0];
    input.value = '';
    if (!original) return;

    if (!TIPOS_PERMITIDOS.includes(original.type)) {
      this.error.set('fotoPerfil.errores.tipo');
      return;
    }
    if (original.size > MAX_BYTES_ORIGINAL) {
      this.error.set('fotoPerfil.errores.tamano');
      return;
    }

    this.error.set(null);
    this.subiendo.set(true);
    let archivo: File;
    try {
      archivo = await optimizarFoto(original);
    } catch {
      this.subiendo.set(false);
      this.error.set('fotoPerfil.errores.procesar');
      return;
    }

    const previa = URL.createObjectURL(archivo);
    this.vistaPrevia.set(previa);
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
