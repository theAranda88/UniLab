import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CertificadosService } from '../certificados.service';
import { CertificadoVerificado } from '../../../core/models/certificado.model';
import { formatearFechaLocal, formatearRangoFechas } from '../../../core/utils/date.util';

/** Página pública que abre el QR del diploma: confirma si el certificado es auténtico. */
@Component({
  selector: 'app-verificar-certificado',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './verificar-certificado.component.html',
  styleUrl: './verificar-certificado.component.scss',
})
export class VerificarCertificadoComponent implements OnInit {
  private service = inject(CertificadosService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  readonly certificado = signal<CertificadoVerificado | null>(null);
  readonly cargando = signal(true);
  readonly codigo = this.route.snapshot.paramMap.get('codigo') ?? '';

  ngOnInit(): void {
    this.service.verificar(this.codigo).subscribe({
      next: (c) => {
        this.certificado.set(c);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  rango(c: CertificadoVerificado): string {
    return formatearRangoFechas(c.fecha_inicio, c.fecha_fin, this.translate.getCurrentLang() ?? 'es');
  }

  fecha(iso: string): string {
    return formatearFechaLocal(iso);
  }
}
