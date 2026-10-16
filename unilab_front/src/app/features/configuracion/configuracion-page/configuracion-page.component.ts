import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfiguracionService } from '../configuracion.service';
import type { ConfiguracionSistema } from '../../../core/models/configuracion.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

export const MAX_MENSAJE_PORTAL = 280;

/** RA-013 · Configuración del sistema sin despliegue (solo Administrador). */
@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './configuracion-page.component.html',
  styleUrl: './configuracion-page.component.scss',
})
export class ConfiguracionPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private configuracion = inject(ConfiguracionService);
  private toast = inject(ToastService);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly maxMensaje = MAX_MENSAJE_PORTAL;

  readonly formulario = this.fb.nonNullable.group({
    registro_abierto: [true],
    semilleros_solicitudes_abiertas: [true],
    mensaje_portal: ['', [Validators.maxLength(MAX_MENSAJE_PORTAL)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.configuracion.obtener().subscribe({
      next: (config) => {
        this.aplicar(config);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('configuracion.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const valores = this.formulario.getRawValue();
    this.configuracion
      .actualizar({ ...valores, mensaje_portal: valores.mensaje_portal.trim() })
      .subscribe({
        next: (config) => {
          this.aplicar(config);
          this.guardando.set(false);
          this.toast.success('configuracion.exitoGuardar');
        },
        error: (err: { message?: string }) => {
          this.guardando.set(false);
          this.toast.error(err?.message ?? 'configuracion.errorGuardar');
        },
      });
  }

  descartar(): void {
    this.cargar();
  }

  private aplicar(config: ConfiguracionSistema): void {
    this.formulario.reset(config);
  }
}
