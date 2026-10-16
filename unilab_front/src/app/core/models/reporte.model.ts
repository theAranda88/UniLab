export interface ConteoPorEstado {
  estado: string;
  total: number;
}

export interface ResumenGlobal {
  generado_en: string;
  totales: {
    usuarios: number;
    usuarios_inactivos: number;
    escuelas: number;
    cursos: number;
    proyectos: number;
    proyectos_publicados: number;
    semilleros: number;
    semilleros_activos: number;
    eventos: number;
    inscripciones: number;
    asistencias: number;
  };
  usuarios_por_rol: { rol: string; total: number }[];
  proyectos_por_estado: ConteoPorEstado[];
  proyectos_por_escuela: {
    id_escuela: number;
    escuela: string;
    total: number;
    publicados: number;
  }[];
  membresias_por_estado: ConteoPorEstado[];
  eventos_por_estado: ConteoPorEstado[];
}
