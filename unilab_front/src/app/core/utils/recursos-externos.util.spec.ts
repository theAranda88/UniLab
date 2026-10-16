import { detectarServicio, recursosDeProyecto, urlValida } from './recursos-externos.util';

describe('recursos externos', () => {
  it('reconoce el servicio por el dominio real, incluidos subdominios', () => {
    expect(detectarServicio(new URL('https://www.youtube.com/@canal'))).toBe('youtube');
    expect(detectarServicio(new URL('https://youtu.be/abc'))).toBe('youtube');
    expect(detectarServicio(new URL('https://podcasters.spotify.com/pod/show/x'))).toBe('spotify');
    expect(detectarServicio(new URL('https://github.com/org/repo'))).toBe('github');
    expect(detectarServicio(new URL('https://finanzas.uniautonoma.edu.co'))).toBe('web');
  });

  it('no se deja engañar por dominios que solo contienen el nombre', () => {
    expect(detectarServicio(new URL('https://youtube.com.ejemplo.net/x'))).toBe('web');
    expect(detectarServicio(new URL('https://misspotify.com/x'))).toBe('web');
  });

  it('descarta URLs inválidas o con protocolos no web', () => {
    expect(urlValida('no es una url')).toBeNull();
    expect(urlValida('javascript:alert(1)')).toBeNull();
    expect(urlValida('')).toBeNull();
    expect(urlValida('https://ok.test')?.hostname).toBe('ok.test');
  });

  it('no repite la misma URL y conserva el rol más específico (podcast)', () => {
    const recursos = recursosDeProyecto({
      url_aplicativo: 'https://open.spotify.com/show/x',
      url_spotify: 'https://open.spotify.com/show/x',
      url_youtube: 'https://www.youtube.com/playlist?list=x',
    });
    expect(recursos.map((r) => [r.rol, r.servicio])).toEqual([
      ['youtube', 'youtube'],
      ['spotify', 'spotify'],
    ]);
  });

  it('ordena aplicativo, APK y luego medios, y muestra el dominio sin www', () => {
    const recursos = recursosDeProyecto({
      url_apk: 'https://github.com/org/app/releases/latest',
      url_aplicativo: 'https://www.app.test',
      url_youtube: null,
    });
    expect(recursos.map((r) => r.rol)).toEqual(['aplicativo', 'apk']);
    expect(recursos[0].dominio).toBe('app.test');
    expect(recursos[1].servicio).toBe('github');
  });
});
