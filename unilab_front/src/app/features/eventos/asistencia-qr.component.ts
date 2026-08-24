import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { PublicPortalService } from '../home/public-portal.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  guardarDocumentoInscripcion,
  obtenerDocumentoInscripcion,
} from '../../core/utils/inscripcion-documento.util';
import { hasPortalTheme, shouldUsePortalUi } from '../../core/utils/portal-theme.util';
import { SpiderwebCanvasComponent } from '../home/spiderweb-canvas/spiderweb-canvas.component';

@Component({
  selector: 'app-asistencia-qr',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, SpiderwebCanvasComponent],
  templateUrl: './asistencia-qr.component.html',
  styleUrl: './asistencia-qr.component.scss',
  host: {
    '[class.portal-themed]': 'portalTheme()',
    '[class.asistencia-qr--mobile]': 'scanFlow()',
  },
})
export class AsistenciaQrComponent implements OnInit {
  private eventoService = inject(EventosService);
  private portal = inject(PublicPortalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);

  private autoRegistroIniciado = false;

  idEvento = signal<number>(0);
  codigoQr = signal('');
  /** Campo de documento (propiedad simple para ngModel fiable). */
  documentoIdentidad = '';
  requiereDocumento = signal(false);
  registrando = signal(false);
  mensajeKey = signal<string | null>(null);
  tipoMensaje = signal<'success' | 'error'>('success');
  esAutomatico = signal(false);
  registroCompletado = signal(false);
  sinQrParam = signal(false);
  portalTheme = signal(false);

  mobileMode = computed(() => !!this.route.snapshot.data['mobileMode']);
  shellMode = computed(() => !!this.route.snapshot.data['shellMode']);
  scanFlow = computed(() => this.mobileMode() || this.esAutomatico());

  ngOnInit() {
    this.portalTheme.set(
      hasPortalTheme(this.route) || shouldUsePortalUi(this.router, this.auth.currentRole()),
    );

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.idEvento.set(id);

    const qrFromUrl = this.route.snapshot.queryParamMap.get('qr');
    if (qrFromUrl) {
      this.aplicarQrDesdeUrl(qrFromUrl);
    }

    this.route.queryParams.subscribe((params) => {
      if (params['qr']) {
        this.aplicarQrDesdeUrl(params['qr']);
      } else if (this.mobileMode()) {
        this.sinQrParam.set(true);
      }
    });
  }

  /**
   * API pública solo para visitantes sin cuenta o staff (admin) que escanea QR
   * sin inscripción vinculada a su usuario. Estudiante, Externo y Profesor usan JWT.
   */
  private usarAsistenciaPublica(): boolean {
    if (!this.auth.isAuthenticated()) return true;
    return !this.auth.hasAnyRole(['Estudiante', 'Externo', 'Profesor']);
  }

  private aplicarQrDesdeUrl(qr: string) {
    const normalizado = decodeURIComponent(qr).trim();
    this.codigoQr.set(normalizado);
    this.esAutomatico.set(true);
    this.sinQrParam.set(false);
    this.iniciarRegistroAutomatico();
  }

  private iniciarRegistroAutomatico() {
    if (this.autoRegistroIniciado || !this.codigoQr()) return;

    if (this.usarAsistenciaPublica()) {
      const documento = obtenerDocumentoInscripcion();
      if (documento) {
        this.documentoIdentidad = documento;
        this.autoRegistroIniciado = true;
        setTimeout(() => this.registrarAsistencia(), 400);
      } else {
        this.autoRegistroIniciado = true;
        this.requiereDocumento.set(true);
      }
      return;
    }

    this.autoRegistroIniciado = true;
    setTimeout(() => this.registrarAsistencia(), 400);
  }

  confirmarDocumento() {
    const documento = this.documentoIdentidad.trim();
    if (!documento) {
      this.mensajeKey.set('asistencia.documentoRequerido');
      this.tipoMensaje.set('error');
      return;
    }
    guardarDocumentoInscripcion(documento);
    this.documentoIdentidad = documento;
    this.mensajeKey.set(null);
    this.mensajeCustom.set(null);
    this.registrarAsistencia();
  }

  registrarAsistencia() {
    if (!this.codigoQr()) {
      this.mensajeKey.set('asistencia.errorCodigoVacio');
      this.tipoMensaje.set('error');
      return;
    }

    if (this.usarAsistenciaPublica()) {
      const documento = this.documentoIdentidad.trim() || obtenerDocumentoInscripcion();
      if (!documento) {
        this.requiereDocumento.set(true);
        return;
      }
      this.documentoIdentidad = documento;
      this.requiereDocumento.set(false);
    }

    this.registrando.set(true);
    this.mensajeKey.set(null);
    this.mensajeCustom.set(null);

    const request = this.usarAsistenciaPublica()
      ? this.portal.registrarAsistenciaPublica(this.codigoQr(), this.documentoIdentidad.trim())
      : this.eventoService.registrarAsistencia(this.codigoQr());

    request.subscribe({
      next: () => {
        this.mensajeKey.set('asistencia.registrada');
        this.tipoMensaje.set('success');
        this.registroCompletado.set(true);
        this.registrando.set(false);
        this.requiereDocumento.set(false);
      },
      error: (err: { message?: string }) => {
        const msg = err.message ?? null;
        if (msg) {
          this.mensajeCustom.set(msg);
          this.mensajeKey.set(null);
        } else {
          this.mensajeCustom.set(null);
          this.mensajeKey.set('asistencia.errorRegistrar');
        }
        this.tipoMensaje.set('error');
        this.registrando.set(false);
        if (this.usarAsistenciaPublica()) {
          this.requiereDocumento.set(true);
        }
      },
    });
  }

  mensajeCustom = signal<string | null>(null);

  volver() {
    const destino = this.usarAsistenciaPublica()
      ? ['/eventos', this.idEvento()]
      : [this.eventoService.getBasePath(), this.idEvento()];
    this.router.navigate(destino);
  }
}
