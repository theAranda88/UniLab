import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CertificadosService, guardarPdf, nombrePdf } from '../certificados.service';
import { Certificado } from '../../../core/models/certificado.model';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Descarga del certificado desde el detalle de un evento finalizado.
 * Con sesión se busca entre «mis certificados»; sin cuenta se piden la cédula y el correo de la inscripción.
 */
@Component({
  selector: 'app-mi-certificado-evento',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule],
  templateUrl: './mi-certificado-evento.component.html',
  styleUrl: './mi-certificado-evento.component.scss',
})
export class MiCertificadoEventoComponent implements OnInit {
  private service = inject(CertificadosService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly idEvento = input.required<number>();
  readonly nombreEvento = input.required<string>();

  readonly conSesion = this.auth.isAuthenticated();
  readonly certificado = signal<Certificado | null>(null);
  readonly buscando = signal(this.conSesion);
  readonly descargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly formAbierto = signal(false);

  readonly form = this.fb.nonNullable.group({
    documento_identidad: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    if (!this.conSesion) return;
    this.service.misCertificados().subscribe({
      next: (lista) => {
        this.certificado.set(lista.find((c) => c.id_evento === this.idEvento()) ?? null);
        this.buscando.set(false);
      },
      error: () => this.buscando.set(false),
    });
  }

  descargarMio(): void {
    const c = this.certificado();
    if (!c) return;
    this.descargando.set(true);
    this.service.descargar(c.id_certificado).subscribe({
      next: (blob) => this.guardar(blob, c.nombre_completo),
      error: () => this.fallo('certificados.errorDescargar'),
    });
  }

  descargarPublico(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { documento_identidad, email } = this.form.getRawValue();
    this.descargando.set(true);
    this.error.set(null);
    this.service.descargarPublico(this.idEvento(), documento_identidad, email).subscribe({
      next: (blob) => this.guardar(blob, documento_identidad),
      error: (err: { status?: number }) =>
        this.fallo(err.status === 404 ? 'certificados.publico.noEncontrado' : 'certificados.errorDescargar'),
    });
  }

  private guardar(blob: Blob, persona: string): void {
    this.descargando.set(false);
    guardarPdf(blob, nombrePdf(this.nombreEvento(), persona));
  }

  private fallo(clave: string): void {
    this.descargando.set(false);
    this.error.set(clave);
  }
}
