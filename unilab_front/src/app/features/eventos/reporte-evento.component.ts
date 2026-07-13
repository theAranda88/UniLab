import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { ReporteEvento } from '../../core/models/evento.model';

@Component({
  selector: 'app-reporte-evento',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './reporte-evento.component.html',
  styleUrl: './reporte-evento.component.scss',
})
export class ReporteEventoComponent implements OnInit {
  private eventoService = inject(EventosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reporte = signal<ReporteEvento | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  idEvento = signal<number>(0);

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
      error: (err: any) => {
        console.error('Error:', err);
        this.error.set('Error al cargar el reporte');
        this.cargando.set(false);
      },
    });
  }

  exportarCSV() {
    this.eventoService.exportarCSV(this.idEvento()).subscribe({
      next: (blob: Blob) => {
        this.descargarArchivo(blob, `reporte_evento_${this.idEvento()}.csv`);
      },
      error: (err: any) => {
        console.error('Error:', err);
        alert('Error al exportar CSV');
      },
    });
  }

  exportarExcel() {
    this.eventoService.exportarExcel(this.idEvento()).subscribe({
      next: (blob: Blob) => {
        this.descargarArchivo(blob, `reporte_evento_${this.idEvento()}.xlsx`);
      },
      error: (err: any) => {
        console.error('Error:', err);
        alert('Error al exportar Excel');
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
    this.router.navigate(['/eventos', this.idEvento()]);
  }

  calcularPorcentajeAsistencia(inscrito: any): string {
    if (!inscrito.asistencias || inscrito.asistencias.length === 0) {
      return '0%';
    }
    const presentes = inscrito.asistencias.filter((a: any) => a.presente).length;
    const porcentaje = Math.round((presentes / inscrito.asistencias.length) * 100);
    return `${porcentaje}%`;
  }
}
