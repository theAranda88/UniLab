import { Component, OnDestroy, computed, inject, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../toast/toast.service';

export interface ImagenGuardada {
  id: number;
  url: string;
}

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Subida de imágenes con vista previa. Muestra las imágenes ya guardadas (quitar una emite
 * `eliminar` para que el padre confirme y llame a la API) y las nuevas elegidas, que quedan en
 * `pendientes` hasta que el padre las suba. Valida tipo (JPEG, PNG, WebP), peso (5 MB) y máximo.
 */
@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
})
export class ImageUploaderComponent implements OnDestroy {
  private toast = inject(ToastService);

  readonly guardadas = input<ImagenGuardada[]>([]);
  readonly max = input(5);
  readonly disabled = input(false);
  readonly alt = input('');
  /** Archivos elegidos que aún no se han subido. */
  readonly pendientes = model<File[]>([]);
  readonly eliminar = output<ImagenGuardada>();

  readonly restantes = computed(() =>
    Math.max(0, this.max() - this.guardadas().length - this.pendientes().length),
  );

  /** URL de vista previa por archivo; se libera cuando el archivo sale de `pendientes`. */
  private readonly urls = new Map<File, string>();
  readonly previews = computed(() => {
    const files = this.pendientes();
    for (const [file, url] of this.urls) {
      if (!files.includes(file)) {
        URL.revokeObjectURL(url);
        this.urls.delete(file);
      }
    }
    return files.map((file) => {
      let url = this.urls.get(file);
      if (!url) {
        url = URL.createObjectURL(file);
        this.urls.set(file, url);
      }
      return { file, url };
    });
  });

  onSeleccionar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    if (files.some((f) => !TIPOS_PERMITIDOS.has(f.type))) {
      this.toast.error('imagenUploader.errorTipo');
      return;
    }
    if (files.some((f) => f.size > MAX_BYTES)) {
      this.toast.error('imagenUploader.errorPeso');
      return;
    }
    if (files.length > this.restantes()) {
      this.toast.error('imagenUploader.errorMax');
      return;
    }
    this.pendientes.update((prev) => [...prev, ...files]);
  }

  quitarPendiente(file: File): void {
    this.pendientes.update((prev) => prev.filter((f) => f !== file));
  }

  ngOnDestroy(): void {
    for (const url of this.urls.values()) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }
}
