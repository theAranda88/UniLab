import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';

@Component({
  selector: 'app-asistencia-qr',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './asistencia-qr.component.html',
  styleUrl: './asistencia-qr.component.scss',
})
export class AsistenciaQrComponent implements OnInit {
  private eventoService = inject(EventosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  idEvento = signal<number>(0);
  codigoQr = signal<string>('');
  registrando = signal(false);
  mensaje = signal<string | null>(null);
  tipoMensaje = signal<'success' | 'error'>('success');
  esAutomatico = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.idEvento.set(id);

    // Leer parámetro ?qr= del deeplink y registrar automáticamente
    this.route.queryParams.subscribe((params) => {
      if (params['qr']) {
        this.codigoQr.set(params['qr']);
        this.esAutomatico.set(true);
        // Auto-registrar después de que Angular renderice
        setTimeout(() => this.registrarAsistencia(), 500);
      }
    });
  }

  registrarAsistencia() {
    if (!this.codigoQr()) {
      this.mensaje.set('Por favor ingresa el código QR');
      this.tipoMensaje.set('error');
      return;
    }

    this.registrando.set(true);
    this.mensaje.set(null);

    this.eventoService.registrarAsistencia(this.codigoQr()).subscribe({
      next: () => {
        this.mensaje.set('✅ Asistencia registrada correctamente');
        this.tipoMensaje.set('success');
        this.codigoQr.set('');
        this.registrando.set(false);
        
        // Si fue automático (por QR), redirigir al evento en 2 segundos
        if (this.esAutomatico()) {
          setTimeout(() => {
            this.router.navigate(['/eventos', this.idEvento()]);
          }, 2000);
        }
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.mensaje.set(err.error?.message || 'Error al registrar la asistencia');
        this.tipoMensaje.set('error');
        this.registrando.set(false);
      },
    });
  }

  volver() {
    this.router.navigate(['/eventos', this.idEvento()]);
  }
}
