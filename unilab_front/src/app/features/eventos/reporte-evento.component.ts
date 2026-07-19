import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { ReporteEvento } from '../../core/models/evento.model';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-reporte-evento',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BreadcrumbComponent],
  templateUrl: './reporte-evento.component.html',
  styleUrl: './reporte-evento.component.scss',
})
export class ReporteEventoComponent implements OnInit {
  eventoService = inject(EventosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reporte = signal<ReporteEvento | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  idEvento = signal<number>(0);
  actualizandoPagoId = signal<number | null>(null);

  puedeActualizarPago = computed(() => this.eventoService.puedeActualizarPago());

  tienePagosPendientes = computed(() => {
    const inscritos = this.reporte()?.inscritos ?? [];
    return inscritos.some((inscrito) => inscrito.estado_pago === 'pendiente');
  });

  mostrarColumnaAcciones = computed(
    () => this.puedeActualizarPago() && this.tienePagosPendientes(),
  );

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const rep = this.reporte();
    const base = this.eventoService.getBasePath();
    const id = this.idEvento();
    if (!rep) {
      return [
        { labelKey: 'eventos.title', route: base },
        { labelKey: 'reporte.titulo' },
      ];
    }
    return [
      { labelKey: 'eventos.title', route: base },
      { label: rep.nombre_evento, route: [base, String(id)] },
      { labelKey: 'reporte.titulo' },
    ];
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.idEvento.set(id);
    this.cargarReporte(id);
  }

  cargarReporte(id: number) {
    this.cargando.set(true);
    this.error.set(null);

    this.eventoService.obtenerReporte(id).subscribe({
      next: (data: ReporteEvento) => {
        this.reporte.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('reporte.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  confirmarPago(idInscripcion: number) {
    this.actualizandoPagoId.set(idInscripcion);
    this.eventoService.actualizarPago(idInscripcion, 'confirmado').subscribe({
      next: () => {
        this.actualizandoPagoId.set(null);
        this.cargarReporte(this.idEvento());
      },
      error: () => this.actualizandoPagoId.set(null),
    });
  }

  exportarCSV() {
    this.eventoService.exportarCSV(this.idEvento()).subscribe({
      next: (blob: Blob) => {
        this.descargarArchivo(blob, `reporte_evento_${this.idEvento()}.csv`);
      },
    });
  }

  exportarExcel() {
    this.eventoService.exportarExcel(this.idEvento()).subscribe({
      next: (blob: Blob) => {
        this.descargarArchivo(blob, `reporte_evento_${this.idEvento()}.xlsx`);
      },
    });
  }

  private descargarArchivo(blob: Blob, nombre: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  volver() {
    this.router.navigate([this.eventoService.getBasePath(), this.idEvento()]);
  }

  calcularPorcentajeAsistencia(inscrito: { total_asistencias: number }): string {
    const totalJornadas = this.reporte()?.jornadas.length ?? 0;
    if (totalJornadas === 0) return '0%';
    const porcentaje = Math.round((inscrito.total_asistencias / totalJornadas) * 100);
    return `${porcentaje}%`;
  }

  etiquetaGenero(genero: string): string {
    const mapa: Record<string, string> = {
      M: 'common.masculino',
      F: 'common.femenino',
      O: 'common.otro',
    };
    return mapa[genero] ?? 'common.otro';
  }
}
