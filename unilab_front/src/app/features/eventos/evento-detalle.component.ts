import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import QRCode from 'qrcode';
import { EventosService } from './eventos.service';
import { AuthService } from '../../core/auth/auth.service';
import { Evento, EventoJornada } from '../../core/models/evento.model';
import { FormsModule } from '@angular/forms';
import { InscripcionFormComponent } from './inscripcion-form.component';
import { JornadaFormComponent } from './jornada-form.component';

@Component({
  selector: 'app-evento-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, InscripcionFormComponent, JornadaFormComponent],
  templateUrl: './evento-detalle.component.html',
  styleUrl: './evento-detalle.component.scss',
})
export class EventoDetalleComponent implements OnInit, AfterViewInit {
  private eventoService = inject(EventosService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  evento = signal<Evento | null>(null);
  jornadas = signal<EventoJornada[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  usuarioRol = signal<string | null>(null);
  usuarioId = signal<number | null>(null);

  mostrarFormularioInscripcion = signal(false);
  mostrarFormularioJornada = signal(false);

  // Mapa de URLs de QR por id de jornada
  qrUrls = signal<Record<number, string>>({});

  ngOnInit() {
    this.cargarEvento();
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.usuarioRol.set(user.id_rol);
        this.usuarioId.set(user.id_usuario);
      }
    });
  }

  ngAfterViewInit() {
    // Generar QR para cada jornada que se cargue
    const jornadas = this.jornadas();
    if (jornadas.length > 0) {
      this.generarQRsParaJornadas(jornadas);
    }
  }

  async generarQRsParaJornadas(jornadas: EventoJornada[]): Promise<void> {
    const urls: Record<number, string> = {};
    const idEvento = this.evento()?.id_evento;

    for (const jornada of jornadas) {
      try {
        // Generar deeplink: http://localhost:4200/eventos/2/asistencia?qr=UUID
        const deeplink = `${window.location.origin}/eventos/${idEvento}/asistencia?qr=${encodeURIComponent(jornada.codigo_qr)}`;
        
        const qrDataUrl = await QRCode.toDataURL(deeplink, {
          errorCorrectionLevel: 'H',
          type: 'image/png' as any,
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        urls[jornada.id_jornada] = qrDataUrl;
        console.log(`QR generado para jornada ${jornada.id_jornada} con deeplink:`, deeplink);
      } catch (error) {
        console.error(`Error generando QR para jornada ${jornada.id_jornada}:`, error);
      }
    }

    this.qrUrls.set(urls);
    console.log('QRs finales con deeplinks:', this.qrUrls());
  }

  cargarEvento() {
    this.cargando.set(true);
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.eventoService.obtener(id).subscribe({
      next: (data: Evento) => {
        this.evento.set(data);
        this.cargarJornadas(id);
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error.set('Error al cargar el evento');
        this.cargando.set(false);
      },
    });
  }

  cargarJornadas(id: number) {
    this.eventoService.obtenerJornadas(id).subscribe({
      next: (data: EventoJornada[]) => {
        this.jornadas.set(data);
        this.cargando.set(false);
        // Generar QR para todas las jornadas
        this.generarQRsParaJornadas(data);
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.cargando.set(false);
      },
    });
  }

  esAdmin(): boolean {
    return this.usuarioRol() === 'Administrador';
  }

  puedeInscribirse(): boolean {
    return this.usuarioRol() !== 'Administrador';
  }

  abrirFormularioInscripcion() {
    this.mostrarFormularioInscripcion.set(true);
  }

  cerrarFormularioInscripcion() {
    this.mostrarFormularioInscripcion.set(false);
  }

  abrirFormularioJornada() {
    this.mostrarFormularioJornada.set(true);
  }

  cerrarFormularioJornada() {
    this.mostrarFormularioJornada.set(false);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString();
  }

  formatearHora(hora: string): string {
    return hora.substring(0, 5);
  }

  obtenerQRParaJornada(idJornada: number): string {
    return this.qrUrls()[idJornada] || '';
  }
}
