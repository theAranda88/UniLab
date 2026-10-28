import { ICONOS_ESCUELA, estiloDeEscuela } from './portal-theme.util';

describe('estiloDeEscuela', () => {
  it('usa el color y el ícono guardados en la escuela', () => {
    expect(estiloDeEscuela({ nombre_escuela: 'Derecho', color: '#123456', icono: 'ph-atom' })).toEqual({
      color: '#123456',
      icono: 'ph-atom',
    });
  });

  it('sin color ni ícono guardados, los deduce del nombre', () => {
    expect(estiloDeEscuela({ nombre_escuela: 'Escuela de Derecho', color: null, icono: null })).toEqual({
      color: '#b91c1c',
      icono: 'ph-scales',
    });
  });

  it('completa solo el dato que falta', () => {
    expect(estiloDeEscuela({ nombre_escuela: 'Escuela de Derecho', color: '#123456', icono: null })).toEqual({
      color: '#123456',
      icono: 'ph-scales',
    });
  });

  it('sin escuela devuelve el estilo institucional', () => {
    expect(estiloDeEscuela(null)).toEqual({ color: '#053686', icono: 'ph-graduation-cap' });
  });

  it('los íconos ofrecidos son clases Phosphor que acepta el backend', () => {
    for (const icono of ICONOS_ESCUELA) {
      expect(icono).toMatch(/^ph-[a-z0-9-]+$/);
    }
  });
});
