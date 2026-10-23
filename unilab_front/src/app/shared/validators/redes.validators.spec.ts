import { FormControl } from '@angular/forms';
import { GITHUB_DOMINIO, LINKEDIN_DOMINIO, redesDesdeFormulario, urlRedValidator } from './redes.validators';

describe('urlRedValidator', () => {
  const linkedin = urlRedValidator(LINKEDIN_DOMINIO);
  const github = urlRedValidator(GITHUB_DOMINIO);
  const cualquiera = urlRedValidator();
  const validar = (v: ReturnType<typeof urlRedValidator>, valor: string) => v(new FormControl(valor));

  it('permite el campo vacío (las redes son opcionales)', () => {
    expect(validar(linkedin, '')).toBeNull();
    expect(validar(linkedin, '   ')).toBeNull();
  });

  it('acepta enlaces del dominio correcto, incluidos subdominios', () => {
    expect(validar(linkedin, 'https://www.linkedin.com/in/ana')).toBeNull();
    expect(validar(linkedin, 'https://co.linkedin.com/in/ana')).toBeNull();
    expect(validar(github, 'https://github.com/ana')).toBeNull();
    expect(validar(cualquiera, 'http://ana.dev')).toBeNull();
  });

  it('rechaza dominios que solo se parecen', () => {
    expect(validar(linkedin, 'https://notlinkedin.com/in/ana')).toEqual({ dominio: true });
    expect(validar(linkedin, 'https://evil.com/linkedin.com')).toEqual({ dominio: true });
    expect(validar(github, 'https://gitlab.com/ana')).toEqual({ dominio: true });
  });

  it('rechaza texto que no es URL y protocolos distintos de http(s)', () => {
    expect(validar(cualquiera, 'mi portafolio')).toEqual({ url: true });
    expect(validar(cualquiera, 'javascript:alert(1)')).toEqual({ url: true });
    expect(validar(cualquiera, 'ftp://ana.dev')).toEqual({ url: true });
  });
});

describe('redesDesdeFormulario', () => {
  it('recorta espacios y convierte vacíos en null', () => {
    expect(
      redesDesdeFormulario({ url_linkedin: ' https://linkedin.com/in/a ', url_github: '', url_portafolio: '  ' }),
    ).toEqual({ url_linkedin: 'https://linkedin.com/in/a', url_github: null, url_portafolio: null });
  });
});
