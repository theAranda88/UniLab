import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { AuthService } from '../../core/auth/auth.service';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);

  private autoRegistroIniciado = false;

  idEvento = signal<number>(0);
  codigoQr = signal('');
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

  private aplicarQrDesdeUrl(qr: string) {
    this.codigoQr.set(qr);
    this.esAutomatico.set(true);
    this.sinQrParam.set(false);
    this.iniciarRegistroAutomatico();
  }

  private iniciarRegistroAutomatico() {
    if (this.autoRegistroIniciado || !this.codigoQr()) return;
    this.autoRegistroIniciado = true;
    setTimeout(() => this.registrarAsistencia(), 400);
  }

  registrarAsistencia() {
    if (!this.codigoQr()) {
      this.mensajeKey.set('asistencia.errorCodigoVacio');
      this.tipoMensaje.set('error');
      return;
    }

    this.registrando.set(true);
    this.mensajeKey.set(null);
    this.mensajeCustom.set(null);

    this.eventoService.registrarAsistencia(this.codigoQr()).subscribe({
      next: () => {
        this.mensajeKey.set('asistencia.registrada');
        this.tipoMensaje.set('success');
        this.registroCompletado.set(true);
        this.registrando.set(false);
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
      },
    });
  }

  mensajeCustom = signal<string | null>(null);

  volver() {
    this.router.navigate([this.eventoService.getBasePath(), this.idEvento()]);
  }
}
