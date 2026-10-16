import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportesService } from '../reportes.service';
import type { ResumenGlobal } from '../../../core/models/reporte.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

/** Fila de un desglose de barras: etiqueta ya traducible + valor + ancho relativo al máximo. */
interface BarraFila {
  etiqueta: string;
  traducir: boolean;
  total: number;
  ancho: number;
  porcentaje: number;
}

interface Desglose {
  id: string;
  tituloKey: string;
  unidadKey: string;
  filas: BarraFila[];
}

/** Espacio reservado a la derecha de cada barra para su valor («12 de 30 publicados»). */
const ESPACIO_VALOR_PX = 120;

function filas(datos: { etiqueta: string; total: number }[], traducir: boolean): BarraFila[] {
  const max = Math.max(1, ...datos.map((d) => d.total));
  const suma = datos.reduce((acc, d) => acc + d.total, 0) || 1;
  return datos.map((d) => ({
    etiqueta: d.etiqueta,
    traducir,
    total: d.total,
    ancho: (d.total / max) * 100,
    porcentaje: Math.round((d.total / suma) * 100),
  }));
}

/** RA-012 · Reportes globales de la plataforma (Administrador y Coordinador). */
@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './reportes-page.component.html',
  styleUrl: './reportes-page.component.scss',
})
export class ReportesPageComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private toast = inject(ToastService);

  readonly resumen = signal<ResumenGlobal | null>(null);
  readonly cargando = signal(false);
  readonly exportando = signal(false);
  readonly error = signal<string | null>(null);

  readonly desgloses = computed<Desglose[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      {
        id: 'usuarios',
        tituloKey: 'reportes.usuariosPorRol',
        unidadKey: 'reportes.unidades.usuarios',
        filas: filas(
          r.usuarios_por_rol.map((u) => ({ etiqueta: `usuarios.roles.${u.rol}`, total: u.total })),
          true,
        ),
      },
      {
        id: 'proyectos',
        tituloKey: 'reportes.proyectosPorEstado',
        unidadKey: 'reportes.unidades.proyectos',
        filas: filas(
          r.proyectos_por_estado.map((p) => ({
            etiqueta: `proyectosEstudiante.estados.${p.estado}`,
            total: p.total,
          })),
          true,
        ),
      },
      {
        id: 'eventos',
        tituloKey: 'reportes.eventosPorEstado',
        unidadKey: 'reportes.unidades.eventos',
        filas: filas(
          r.eventos_por_estado.map((e) => ({
            etiqueta: `reportes.estadosEvento.${e.estado}`,
            total: e.total,
          })),
          true,
        ),
      },
      {
        id: 'membresias',
        tituloKey: 'reportes.membresiasPorEstado',
        unidadKey: 'reportes.unidades.solicitudes',
        filas: filas(
          r.membresias_por_estado.map((m) => ({
            etiqueta: `semilleros.estados.${m.estado}`,
            total: m.total,
          })),
          true,
        ),
      },
    ];
  });

  /** Barra apilada por escuela: publicados + resto, escalada al total de la escuela más grande. */
  readonly escuelas = computed(() => {
    const lista = this.resumen()?.proyectos_por_escuela ?? [];
    const max = Math.max(1, ...lista.map((e) => e.total));
    return [...lista]
      .sort((a, b) => b.total - a.total)
      .map((e) => ({
        ...e,
        anchoPublicados: (e.publicados / max) * 100,
        anchoResto: ((e.total - e.publicados) / max) * 100,
      }));
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Escala la barra sobre el ancho disponible menos el espacio reservado al valor de la punta. */
  anchoBarra(porcentaje: number): string {
    return `calc((100% - ${ESPACIO_VALOR_PX}px) * ${porcentaje / 100})`;
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportesService.resumen().subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('reportes.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  exportar(): void {
    this.exportando.set(true);
    this.reportesService.exportarExcel().subscribe({
      next: (blob) => {
        this.exportando.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_unilab_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.exportando.set(false);
        this.toast.error('reportes.errorExportar');
      },
    });
  }
}
