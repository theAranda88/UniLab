import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CertificadosService, guardarPdf, nombrePdf } from '../certificados.service';
import { Certificado } from '../../../core/models/certificado.model';
import { formatearRangoFechas } from '../../../core/utils/date.util';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/** «Mis certificados» en Mi perfil: certificados vigentes del usuario, con descarga y enlace de verificación. */
@Component({
  selector: 'app-mis-certificados',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './mis-certificados.component.html',
  styleUrl: './mis-certificados.component.scss',
})
export class MisCertificadosComponent implements OnInit {
  private service = inject(CertificadosService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  readonly certificados = signal<Certificado[]>([]);
  readonly cargando = signal(true);
  readonly descargandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.service.misCertificados().subscribe({
      next: (lista) => {
        this.certificados.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  rango(c: Certificado): string {
    return formatearRangoFechas(c.fecha_inicio, c.fecha_fin, this.translate.getCurrentLang() ?? 'es');
  }

  descargar(c: Certificado): void {
    this.descargandoId.set(c.id_certificado);
    this.service.descargar(c.id_certificado).subscribe({
      next: (blob) => {
        this.descargandoId.set(null);
        guardarPdf(blob, nombrePdf(c.nombre_evento, c.nombre_completo));
      },
      error: () => {
        this.descargandoId.set(null);
        this.toast.error('certificados.errorDescargar');
      },
    });
  }
}
