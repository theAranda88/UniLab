import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CertificadosService, guardarPdf, nombrePdf } from '../certificados.service';
import { CertificadosEvento, InscritoCertificado } from '../../../core/models/certificado.model';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

type EstadoInscrito = 'emitido' | 'cumple' | 'pago' | 'noCumple';

/**
 * Certificados del evento para el administrador y el organizador: asistencia de cada inscrito,
 * emisión (solo con el evento finalizado), descarga y anulación.
 */
@Component({
  selector: 'app-certificados-evento',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './certificados-evento.component.html',
  styleUrl: './certificados-evento.component.scss',
})
export class CertificadosEventoComponent implements OnInit {
  private service = inject(CertificadosService);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  readonly idEvento = input.required<number>();

  readonly datos = signal<CertificadosEvento | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly emitiendo = signal(false);
  readonly ocupadoId = signal<number | null>(null);

  readonly emitidos = computed(() => this.datos()?.inscritos.filter((i) => i.certificado).length ?? 0);
  readonly pendientes = computed(() => this.datos()?.inscritos.filter((i) => i.cumple && !i.certificado).length ?? 0);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.resumenEvento(this.idEvento()).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.error.set(false);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  estado(i: InscritoCertificado): EstadoInscrito {
    if (i.certificado) return 'emitido';
    if (i.cumple) return 'cumple';
    if (!i.pago_ok) return 'pago';
    return 'noCumple';
  }

  async emitir(): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'certificados.emitirTitulo',
      message: this.translate.instant('certificados.emitirMensaje', { n: this.pendientes() }),
      confirmKey: 'certificados.emitir',
      cancelKey: 'common.cancelar',
      destructive: false,
    });
    if (!ok) return;

    this.emitiendo.set(true);
    this.service.emitir(this.idEvento()).subscribe({
      next: (r) => {
        this.emitiendo.set(false);
        this.toast.success(this.translate.instant('certificados.emitidos', { n: r.emitidos }));
        this.cargar();
      },
      error: async (err: { message?: string }) => {
        this.emitiendo.set(false);
        await this.dialog.error({ titleKey: 'dialog.error.title', message: err.message });
      },
    });
  }

  descargar(i: InscritoCertificado): void {
    if (!i.certificado) return;
    this.ocupadoId.set(i.id_inscripcion);
    this.service.descargar(i.certificado.id_certificado).subscribe({
      next: (blob) => {
        this.ocupadoId.set(null);
        guardarPdf(blob, nombrePdf(this.datos()!.nombre_evento, i.nombre_completo));
      },
      error: () => {
        this.ocupadoId.set(null);
        this.toast.error('certificados.errorDescargar');
      },
    });
  }

  async anular(i: InscritoCertificado): Promise<void> {
    if (!i.certificado) return;
    const ok = await this.dialog.confirm({
      titleKey: 'certificados.anularTitulo',
      message: this.translate.instant('certificados.anularMensaje', { nombre: i.nombre_completo }),
      confirmKey: 'certificados.anular',
      cancelKey: 'common.cancelar',
    });
    if (!ok) return;

    this.ocupadoId.set(i.id_inscripcion);
    this.service.anular(i.certificado.id_certificado).subscribe({
      next: () => {
        this.ocupadoId.set(null);
        this.toast.success('certificados.anulado');
        this.cargar();
      },
      error: () => {
        this.ocupadoId.set(null);
        this.toast.error('certificados.errorAnular');
      },
    });
  }
}
