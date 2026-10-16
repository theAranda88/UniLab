import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CursosService } from '../cursos.service';
import { EscuelasService } from '../../escuelas/escuelas.service';
import type { EscuelaAdmin } from '../../../core/models/escuela.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/** RA-003 · Curso — crear / editar. */
@Component({
  selector: 'app-cursos-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './cursos-form.component.html',
  styleUrl: './cursos-form.component.scss',
})
export class CursosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cursosService = inject(CursosService);
  private escuelasService = inject(EscuelasService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly modoEdicion = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly escuelas = signal<EscuelaAdmin[]>([]);
  private idCurso: number | null = null;

  readonly formulario = this.fb.nonNullable.group({
    nombre_curso: ['', [Validators.required, Validators.minLength(2)]],
    periodo_academico: ['', [Validators.required]],
    id_escuela: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const escuelaInicial = Number(this.route.snapshot.queryParamMap.get('escuela'));
    if (escuelaInicial) this.formulario.patchValue({ id_escuela: escuelaInicial });

    this.escuelasService.listar().subscribe({
      next: (escuelas) => this.escuelas.set(escuelas),
      error: () => this.error.set('cursos.errorCargar'),
    });

    if (idParam) {
      this.modoEdicion.set(true);
      this.idCurso = Number(idParam);
      this.cargar(this.idCurso);
    }
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.cursosService.obtener(id).subscribe({
      next: (curso) => {
        this.formulario.patchValue({
          nombre_curso: curso.nombre_curso,
          periodo_academico: curso.periodo_academico,
          id_escuela: curso.id_escuela,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('cursos.errorCargar');
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
    const payload = this.formulario.getRawValue();
    const request$ =
      this.modoEdicion() && this.idCurso
        ? this.cursosService.actualizar(this.idCurso, payload)
        : this.cursosService.crear(payload);

    request$.subscribe({
      next: () => {
        this.enviando.set(false);
        this.toast.success(this.modoEdicion() ? 'cursos.exitoActualizar' : 'cursos.exitoCrear');
        this.router.navigate(['/admin/cursos']);
      },
      error: (err: { message?: string }) => {
        this.enviando.set(false);
        this.error.set(
          err?.message ?? (this.modoEdicion() ? 'cursos.errorActualizar' : 'cursos.errorCrear'),
        );
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/cursos']);
  }
}
