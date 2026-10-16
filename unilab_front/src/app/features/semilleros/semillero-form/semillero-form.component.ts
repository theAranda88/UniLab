import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { SemillerosService } from '../semilleros.service';
import { EscuelasService } from '../../escuelas/escuelas.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import type { EscuelaAdmin } from '../../../core/models/escuela.model';
import type { UsuarioAdmin } from '../../../core/models/usuario.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/** RA-010 · Semillero — crear / editar (solo Administrador). */
@Component({
  selector: 'app-semillero-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './semillero-form.component.html',
  styleUrl: './semillero-form.component.scss',
})
export class SemilleroFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private semillerosService = inject(SemillerosService);
  private escuelasService = inject(EscuelasService);
  private usuariosService = inject(UsuariosService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly modoEdicion = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly escuelas = signal<EscuelaAdmin[]>([]);
  readonly profesores = signal<UsuarioAdmin[]>([]);
  private idSemillero: number | null = null;

  readonly formulario = this.fb.nonNullable.group({
    nombre_semillero: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    id_escuela: [0, [Validators.min(1)]],
    id_profesor_lider: [0, [Validators.min(1)]],
    activo: [true],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idSemillero = Number(idParam);
    }
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    forkJoin({
      escuelas: this.escuelasService.listar(),
      profesores: this.usuariosService.listar('Profesor'),
    }).subscribe({
      next: ({ escuelas, profesores }) => {
        this.escuelas.set(escuelas);
        this.profesores.set(profesores.filter((p) => p.activo));
        if (this.idSemillero) {
          this.cargarSemillero(this.idSemillero);
        } else {
          this.cargando.set(false);
        }
      },
      error: () => {
        this.error.set('semilleros.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  private cargarSemillero(id: number): void {
    this.semillerosService.obtener(id).subscribe({
      next: (s) => {
        this.formulario.patchValue({
          nombre_semillero: s.nombre_semillero,
          descripcion: s.descripcion,
          id_escuela: s.id_escuela,
          id_profesor_lider: s.id_profesor_lider,
          activo: s.activo,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('semilleros.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  invalido(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  submit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const { activo, ...datos } = this.formulario.getRawValue();
    const request$ =
      this.modoEdicion() && this.idSemillero
        ? this.semillerosService.actualizar(this.idSemillero, { ...datos, activo })
        : this.semillerosService.crear(datos);

    request$.subscribe({
      next: () => {
        this.enviando.set(false);
        this.toast.success(
          this.modoEdicion() ? 'semilleros.exitoActualizar' : 'semilleros.exitoCrear',
        );
        this.router.navigate([this.semillerosService.getBasePath()]);
      },
      error: (err: { message?: string }) => {
        this.enviando.set(false);
        this.error.set(
          err?.message ??
            (this.modoEdicion() ? 'semilleros.errorActualizar' : 'semilleros.errorCrear'),
        );
      },
    });
  }

  cancelar(): void {
    this.router.navigate([this.semillerosService.getBasePath()]);
  }
}
