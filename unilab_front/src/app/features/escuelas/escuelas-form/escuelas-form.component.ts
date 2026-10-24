import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { EscuelasService } from '../escuelas.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import type { CrearEscuelaDto, EscuelaEncargado } from '../../../core/models/escuela.model';
import type { UsuarioConsulta } from '../../../core/models/usuario.model';
import {
  COLORES_ESCUELA,
  ICONOS_ESCUELA,
  estiloDeEscuela,
} from '../../../core/utils/portal-theme.util';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/** Pantalla 10 · Escuela — crear / editar (información, identidad visual y encargado). */
@Component({
  selector: 'app-escuelas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './escuelas-form.component.html',
  styleUrl: './escuelas-form.component.scss',
})
export class EscuelasFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private escuelasService = inject(EscuelasService);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly modoEdicion = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  private idEscuela: number | null = null;

  readonly profesores = signal<UsuarioConsulta[]>([]);
  private readonly encargadoActual = signal<EscuelaEncargado | null>(null);
  /** Profesores activos; el encargado guardado se conserva aunque ya no figure entre ellos. */
  readonly opcionesEncargado = computed(() => {
    const opciones = this.profesores().map(({ id_usuario, nombres, apellidos }) => ({ id_usuario, nombres, apellidos }));
    const actual = this.encargadoActual();
    return actual && !opciones.some((p) => p.id_usuario === actual.id_usuario) ? [...opciones, actual] : opciones;
  });

  readonly maxDescripcion = 2000;
  readonly iconos = ICONOS_ESCUELA;
  readonly colores = COLORES_ESCUELA;

  readonly formulario = this.fb.group({
    nombre_escuela: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(255),
    ]),
    descripcion: this.fb.nonNullable.control('', [Validators.maxLength(this.maxDescripcion)]),
    id_encargado: this.fb.control<number | null>(null),
    color: this.fb.control<string | null>(null),
    icono: this.fb.control<string | null>(null),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  /** Vista previa: color e ícono elegidos o, si se dejan en automático, los deducidos del nombre. */
  readonly estilo = computed(() => {
    const v = this.valores();
    return estiloDeEscuela({ nombre_escuela: v.nombre_escuela ?? '', color: v.color, icono: v.icono });
  });

  ngOnInit(): void {
    this.cargarProfesores();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idEscuela = Number(idParam);
      this.cargar(this.idEscuela);
    }
  }

  private cargarProfesores(): void {
    this.usuariosService.consultar({ rol: 'Profesor' }).subscribe({
      next: (profesores) => this.profesores.set(profesores.filter((p) => p.activo)),
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.escuelasService.obtener(id).subscribe({
      next: (escuela) => {
        this.formulario.patchValue({
          nombre_escuela: escuela.nombre_escuela,
          descripcion: escuela.descripcion ?? '',
          id_encargado: escuela.id_encargado,
          color: escuela.color,
          icono: escuela.icono,
        });
        this.encargadoActual.set(escuela.encargado);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('escuelas.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  elegirColor(color: string | null): void {
    this.formulario.controls.color.setValue(color);
  }

  elegirIcono(icono: string | null): void {
    this.formulario.controls.icono.setValue(icono);
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
    const v = this.formulario.getRawValue();
    const payload: CrearEscuelaDto = {
      nombre_escuela: v.nombre_escuela.trim(),
      descripcion: v.descripcion.trim() || null,
      id_encargado: v.id_encargado || null,
      color: v.color,
      icono: v.icono,
    };

    const request$ =
      this.modoEdicion() && this.idEscuela
        ? this.escuelasService.actualizar(this.idEscuela, payload)
        : this.escuelasService.crear(payload);

    request$.subscribe({
      next: () => {
        this.enviando.set(false);
        this.toast.success(this.modoEdicion() ? 'escuelas.exitoActualizar' : 'escuelas.exitoCrear');
        this.router.navigate([this.escuelasService.getBasePath()]);
      },
      error: () => {
        this.enviando.set(false);
        this.error.set(this.modoEdicion() ? 'escuelas.errorActualizar' : 'escuelas.errorCrear');
      },
    });
  }

  cancelar(): void {
    this.router.navigate([this.escuelasService.getBasePath()]);
  }
}
