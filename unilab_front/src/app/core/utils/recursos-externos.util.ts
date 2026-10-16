/** Servicio externo reconocido a partir del dominio real de la URL. */
export type ServicioExterno = 'youtube' | 'spotify' | 'github' | 'google-drive' | 'web';

/** Para qué sirve el enlace dentro del proyecto (según el campo del que proviene). */
export type RolRecurso = 'aplicativo' | 'apk' | 'youtube' | 'spotify';

export interface RecursoExterno {
  url: string;
  servicio: ServicioExterno;
  rol: RolRecurso;
  /** Dominio sin «www.», para mostrar en lugar de la URL completa. */
  dominio: string;
}

const DOMINIOS: { servicio: Exclude<ServicioExterno, 'web'>; dominios: string[] }[] = [
  { servicio: 'youtube', dominios: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
  { servicio: 'spotify', dominios: ['spotify.com', 'spotify.link'] },
  { servicio: 'github', dominios: ['github.com'] },
  { servicio: 'google-drive', dominios: ['drive.google.com', 'docs.google.com'] },
];

/** URL válida http(s); cualquier otra cosa se descarta en lugar de mostrarse como enlace. */
export function urlValida(valor: string | null | undefined): URL | null {
  if (!valor) return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** Identifica el servicio por el dominio (incluye subdominios: podcasters.spotify.com → spotify). */
export function detectarServicio(url: URL): ServicioExterno {
  const host = url.hostname.toLowerCase();
  const coincide = (d: string) => host === d || host.endsWith(`.${d}`);
  return DOMINIOS.find((s) => s.dominios.some(coincide))?.servicio ?? 'web';
}

/**
 * Recursos externos de un proyecto, en orden y sin repetir la misma URL.
 * Si la URL del aplicativo coincide con la de YouTube/Spotify (típico de los podcasts),
 * se muestra una sola vez con el rol más específico.
 */
export function recursosDeProyecto(p: {
  url_aplicativo?: string | null;
  url_apk?: string | null;
  url_youtube?: string | null;
  url_spotify?: string | null;
}): RecursoExterno[] {
  const candidatos: [RolRecurso, string | null | undefined][] = [
    ['youtube', p.url_youtube],
    ['spotify', p.url_spotify],
    ['aplicativo', p.url_aplicativo],
    ['apk', p.url_apk],
  ];
  const vistos = new Set<string>();
  const recursos: RecursoExterno[] = [];
  for (const [rol, valor] of candidatos) {
    const url = urlValida(valor);
    if (!url) continue;
    const clave = url.href.replace(/\/$/, '');
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    recursos.push({ url: url.href, servicio: detectarServicio(url), rol, dominio: url.hostname.replace(/^www\./, '') });
  }
  // Orden de lectura: el aplicativo primero, luego descargas y medios
  const orden: Record<RolRecurso, number> = { aplicativo: 0, apk: 1, youtube: 2, spotify: 3 };
  return recursos.sort((a, b) => orden[a.rol] - orden[b.rol]);
}
