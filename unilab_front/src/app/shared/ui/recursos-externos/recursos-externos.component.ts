import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { recursosDeProyecto, type RecursoExterno } from '../../../core/utils/recursos-externos.util';

/** Ícono (Tabler) y color de marca por servicio externo. */
const SERVICIOS: Record<RecursoExterno['servicio'], { icono: string; color: string }> = {
  youtube: { icono: 'ti-brand-youtube-filled', color: '#ff0000' },
  spotify: { icono: 'ti-brand-spotify-filled', color: '#1db954' },
  github: { icono: 'ti-brand-github-filled', color: '#181717' },
  'google-drive': { icono: 'ti-brand-google-drive', color: '#1a73e8' },
  web: { icono: 'ti-world', color: '#053686' },
};

/**
 * Enlaces externos de un proyecto (portal público y panel). El servicio se detecta por el
 * dominio real de cada URL; las URLs inválidas no se muestran y las repetidas aparecen una vez.
 * Son públicos: se abren en una pestaña nueva sin exigir sesión.
 */
@Component({
  selector: 'app-recursos-externos',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './recursos-externos.component.html',
  styleUrl: './recursos-externos.component.scss',
})
export class RecursosExternosComponent {
  readonly proyecto = input.required<{
    url_aplicativo?: string | null;
    url_apk?: string | null;
    url_youtube?: string | null;
    url_spotify?: string | null;
  }>();

  readonly recursos = computed(() =>
    recursosDeProyecto(this.proyecto()).map((r) => {
      const marca = SERVICIOS[r.servicio];
      // Un APK alojado en una web genérica se identifica con el ícono de Android
      return { ...r, ...marca, icono: r.rol === 'apk' && r.servicio === 'web' ? 'ti-brand-android' : marca.icono };
    }),
  );
}
