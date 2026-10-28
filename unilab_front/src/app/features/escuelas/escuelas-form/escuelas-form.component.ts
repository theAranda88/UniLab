import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EscuelasService } from '../escuelas.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import type {
  CrearEscuelaDto,
  EscuelaAdmin,
  EscuelaEncargado,
  EscuelaImagen,
} from '../../../core/models/escuela.model';
import type { UsuarioConsulta } from '../../../core/models/usuario.model';
import {
  COLORES_ESCUELA,
  ICONOS_ESCUELA,
  estiloDeEscuela,
} from '../../../core/utils/portal-theme.util';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import {
  ImageUploaderComponent,
  type ImagenGuardada,
} from '../../../shared/ui/image-uploader/image-uploader.component';

/** Máximo de imágenes por escuela (lo valida también el backend). */
const MAX_IMAGENES = 5;

/** Pantalla 10 · Escuela — crear / editar (información, identidad visual, encargado e imágenes). */
@Component({
  selector: 'app-escuelas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ImageUploaderComponent],
  templateUrl: './escuelas-form.component.html',
  styleUrl: './escuelas-form.component.scss',
})
export class EscuelasFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
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
  readonly imagenes = signal<EscuelaImagen[]>([]);
  readonly imagenesPendientes = signal<File[]>([]);
  readonly imagenesGuardadas = computed<ImagenGuardada[]>(() =>
    this.imagenes().map((img) => ({ id: img.id_imagen, url: img.url })),
  );

  readonly maxImagenes = MAX_IMAGENES;
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
        this.imagenes.set(escuela.imagenes ?? []);
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

  async eliminarImagen(imagen: ImagenGuardada): Promise<void> {
    if (!this.idEscuela) return;
    const ok = await this.dialog.confirm({
      titleKey: 'escuelas.imagenes.eliminarTitulo',
      message: this.translate.instant('escuelas.imagenes.eliminarMensaje'),
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.escuelasService.eliminarImagen(this.idEscuela, imagen.id).subscribe({
      next: () => {
        this.imagenes.update((lista) => lista.filter((img) => img.id_imagen !== imagen.id));
        this.toast.success('escuelas.imagenes.exitoEliminar');
      },
      error: () => this.toast.error('escuelas.imagenes.errorEliminar'),
    });
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
      next: (escuela) => this.subirPendientes(escuela),
      error: () => {
        this.enviando.set(false);
        this.error.set(this.modoEdicion() ? 'escuelas.errorActualizar' : 'escuelas.errorCrear');
      },
    });
  }

  /** Las imágenes nuevas se suben cuando la escuela ya existe (al crearla aún no tiene id). */
  private subirPendientes(escuela: EscuelaAdmin): void {
    const exitoKey = this.modoEdicion() ? 'escuelas.exitoActualizar' : 'escuelas.exitoCrear';
    const pendientes = this.imagenesPendientes();
    if (pendientes.length === 0) {
      this.terminar(exitoKey);
      return;
    }

    this.escuelasService.subirImagenes(escuela.id_escuela, pendientes).subscribe({
      next: (subidas) => {
        this.imagenes.update((lista) => [...lista, ...subidas]);
        this.imagenesPendientes.set([]);
        this.terminar(exitoKey);
      },
      error: () => {
        // La escuela quedó guardada: se pasa a modo edición para reintentar solo las imágenes
        this.enviando.set(false);
        this.modoEdicion.set(true);
        this.idEscuela = escuela.id_escuela;
        this.imagenes.set(escuela.imagenes ?? []);
        this.error.set('escuelas.imagenes.errorSubir');
      },
    });
  }

  private terminar(exitoKey: string): void {
    this.enviando.set(false);
    this.toast.success(exitoKey);
    this.router.navigate([this.escuelasService.getBasePath()]);
  }

  cancelar(): void {
    this.router.navigate([this.escuelasService.getBasePath()]);
  }
}
