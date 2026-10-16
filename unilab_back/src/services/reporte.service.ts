import ExcelJS from 'exceljs';
import { reporteRepository, type DatosResumen } from '../models/reporte.repository';

export const ESTADOS_PROYECTO = ['borrador', 'en_revision', 'aprobado', 'rechazado', 'publicado'] as const;
export const ESTADOS_EVENTO = ['planeado', 'activo', 'finalizado'] as const;
export const ESTADOS_MEMBRESIA = ['pendiente', 'aprobado', 'rechazado'] as const;

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
  proyectos_por_estado: { estado: string; total: number }[];
  proyectos_por_escuela: { id_escuela: number; escuela: string; total: number; publicados: number }[];
  membresias_por_estado: { estado: string; total: number }[];
  eventos_por_estado: { estado: string; total: number }[];
}

/** Completa un conteo por estado con ceros, respetando el orden de `estados` y añadiendo extras al final. */
function porEstado(estados: readonly string[], filas: { estado: string; total: number }[]) {
  const mapa = new Map<string, number>();
  for (const f of filas) mapa.set(f.estado, (mapa.get(f.estado) ?? 0) + f.total);
  const extras = [...mapa.keys()].filter((e) => !estados.includes(e));
  return [...estados, ...extras].map((estado) => ({ estado, total: mapa.get(estado) ?? 0 }));
}

const sumar = (filas: { total: number }[]) => filas.reduce((acc, f) => acc + f.total, 0);

/** Transformación pura de los datos crudos al resumen (separada para poder probarla sin BD). */
export function construirResumen(datos: DatosResumen, ahora = new Date()): ResumenGlobal {
  const nombreRol = new Map(datos.roles.map((r) => [r.id_rol, r.nombre_rol]));
  const usuarios_por_rol = datos.usuariosPorRol
    .map((u) => ({ rol: nombreRol.get(u.id_rol) ?? `Rol ${u.id_rol}`, total: u.total }))
    .sort((a, b) => b.total - a.total);

  const proyectos_por_estado = porEstado(ESTADOS_PROYECTO, datos.proyectosPorCursoEstado);

  const escuelaDeCurso = new Map(datos.cursos.map((c) => [c.id_curso, c.id_escuela]));
  const acumulado = new Map<number, { total: number; publicados: number }>();
  for (const fila of datos.proyectosPorCursoEstado) {
    const id_escuela = escuelaDeCurso.get(fila.id_curso);
    if (id_escuela === undefined) continue; // curso eliminado
    const actual = acumulado.get(id_escuela) ?? { total: 0, publicados: 0 };
    actual.total += fila.total;
    if (fila.estado === 'publicado') actual.publicados += fila.total;
    acumulado.set(id_escuela, actual);
  }
  const proyectos_por_escuela = datos.escuelas.map((e) => ({
    id_escuela: e.id_escuela,
    escuela: e.nombre_escuela,
    ...(acumulado.get(e.id_escuela) ?? { total: 0, publicados: 0 }),
  }));

  const eventos_por_estado = porEstado(ESTADOS_EVENTO, datos.eventosPorEstado);

  return {
    generado_en: ahora.toISOString(),
    totales: {
      usuarios: sumar(usuarios_por_rol),
      usuarios_inactivos: datos.usuariosInactivos,
      escuelas: datos.escuelas.length,
      cursos: datos.cursos.length,
      proyectos: sumar(proyectos_por_estado),
      proyectos_publicados: proyectos_por_estado.find((p) => p.estado === 'publicado')?.total ?? 0,
      semilleros: datos.semilleros.length,
      semilleros_activos: datos.semilleros.filter((s) => s.activo).length,
      eventos: sumar(eventos_por_estado),
      inscripciones: datos.inscripciones,
      asistencias: datos.asistencias,
    },
    usuarios_por_rol,
    proyectos_por_estado,
    proyectos_por_escuela,
    membresias_por_estado: porEstado(ESTADOS_MEMBRESIA, datos.miembrosPorEstado),
    eventos_por_estado,
  };
}

function hoja(
  workbook: ExcelJS.Workbook,
  nombre: string,
  columnas: { header: string; key: string; width: number }[],
  filas: Record<string, unknown>[],
) {
  const ws = workbook.addWorksheet(nombre);
  ws.columns = columnas;
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF243B8E' } };
  ws.addRows(filas);
}

export const reporteService = {
  async resumen(): Promise<ResumenGlobal> {
    return construirResumen(await reporteRepository.datosResumen());
  },

  async exportarExcel() {
    const r = await reporteService.resumen();
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date(r.generado_en);

    const etiquetas: Record<keyof ResumenGlobal['totales'], string> = {
      usuarios: 'Usuarios',
      usuarios_inactivos: 'Usuarios suspendidos',
      escuelas: 'Escuelas',
      cursos: 'Cursos',
      proyectos: 'Proyectos',
      proyectos_publicados: 'Proyectos publicados',
      semilleros: 'Semilleros',
      semilleros_activos: 'Semilleros activos',
      eventos: 'Eventos',
      inscripciones: 'Inscripciones a eventos',
      asistencias: 'Asistencias registradas',
    };
    hoja(
      workbook,
      'Resumen',
      [
        { header: 'Indicador', key: 'indicador', width: 28 },
        { header: 'Valor', key: 'valor', width: 12 },
      ],
      (Object.keys(etiquetas) as (keyof typeof etiquetas)[]).map((k) => ({
        indicador: etiquetas[k],
        valor: r.totales[k],
      })),
    );
    hoja(
      workbook,
      'Usuarios por rol',
      [
        { header: 'Rol', key: 'rol', width: 20 },
        { header: 'Total', key: 'total', width: 10 },
      ],
      r.usuarios_por_rol,
    );
    hoja(
      workbook,
      'Proyectos por estado',
      [
        { header: 'Estado', key: 'estado', width: 20 },
        { header: 'Total', key: 'total', width: 10 },
      ],
      r.proyectos_por_estado,
    );
    hoja(
      workbook,
      'Proyectos por escuela',
      [
        { header: 'Escuela', key: 'escuela', width: 40 },
        { header: 'Total', key: 'total', width: 10 },
        { header: 'Publicados', key: 'publicados', width: 12 },
      ],
      r.proyectos_por_escuela,
    );
    hoja(
      workbook,
      'Semilleros',
      [
        { header: 'Estado solicitud', key: 'estado', width: 20 },
        { header: 'Total', key: 'total', width: 10 },
      ],
      r.membresias_por_estado,
    );
    hoja(
      workbook,
      'Eventos por estado',
      [
        { header: 'Estado', key: 'estado', width: 20 },
        { header: 'Total', key: 'total', width: 10 },
      ],
      r.eventos_por_estado,
    );

    return workbook.xlsx.writeBuffer();
  },
};
