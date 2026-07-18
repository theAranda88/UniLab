import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProyectosService } from '../proyectos.service';
import { hasPortalTheme } from '../../../core/utils/portal-theme.util';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import type { Proyecto, ProfesorCoordinadorDisponible, TipoProyecto } from '../../../core/models/proyecto.model';
import type { Curso } from '../../../core/models/portal.model';
import { urlsImagenesProyecto } from '../../../core/models/portal.model';

const TIPOS: TipoProyecto[] = ['web', 'movil', 'podcast', 'otro'];
const MAX_IMAGENES = 3;

@Component({
  selector: 'app-proyecto-estudiante-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
  templateUrl: './proyecto-estudiante-page.component.html',
  styleUrl: './proyecto-estudiante-page.component.scss',
  host: {
    '[class.portal-themed]': 'portalTheme()',
    class: 'portal-route-page',
    '[class.portal-route-page--entered]': 'entered()',
  },
})
export class ProyectoEstudiantePageComponent implements OnInit, OnDestroy {
  readonly proyectosService = inject(ProyectosService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);

  readonly portalTheme = signal(false);
  readonly entered = signal(false);
  readonly modoCrear = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly subiendoImagenes = signal(false);
  readonly error = signal<string | null>(null);
  readonly proyecto = signal<Proyecto | null>(null);
  readonly cursos = signal<Curso[]>([]);
  readonly semilleros = signal<
    {
      id_semillero: number;
      nombre_semillero: string;
      id_profesor_lider: number;
      profesor_lider?: { nombres: string; apellidos: string };
    }[]
  >([]);
  readonly profesoresCoordinadores = signal<ProfesorCoordinadorDisponible[]>([]);
  readonly cargandoProfesores = signal(false);
  readonly idSemilleroForm = signal(0);
  readonly imagenes = signal<{ id_imagen: number; url: string; orden: number }[]>([]);
  readonly imagenesPendientes = signal<File[]>([]);
  readonly previewsPendientes = signal<string[]>([]);

  readonly tipos = TIPOS;
  readonly maxImagenes = MAX_IMAGENES;

  readonly formulario = this.fb.nonNullable.group({
    id_curso: [0, [Validators.required, Validators.min(1)]],
    id_semillero: [0],
    id_profesor_coordinador: [0],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(20)]],
    tipo_proyecto: ['web' as TipoProyecto, Validators.required],
    url_aplicativo: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    url_apk: [''],
    url_youtube: [''],
    url_spotify: [''],
  });

  readonly puedeEditar = computed(() => {
    const p = this.proyecto();
    return p ? this.proyectosService.puedeEditar(p) : this.modoCrear();
  });

  readonly puedeEnviarRevision = computed(() => {
    const p = this.proyecto();
    return p ? this.proyectosService.puedeEnviarRevision(p) : false;
  });

  readonly puedeGestionarImagenes = computed(() => {
    const p = this.proyecto();
    return p ? this.proyectosService.puedeGestionarImagenes(p) : false;
  });

  readonly slotsImagenesRestantes = computed(() => {
    if (this.modoCrear()) {
      return Math.max(0, MAX_IMAGENES - this.imagenesPendientes().length);
    }
    return Math.max(0, MAX_IMAGENES - this.imagenes().length);
  });

  readonly mostrarSeccionImagenes = computed(
    () => this.modoCrear() || this.puedeGestionarImagenes(),
  );

  readonly tituloPagina = computed(() =>
    this.modoCrear()
      ? 'proyectosEstudiante.crear'
      : 'proyectosEstudiante.gestionar',
  );

  readonly requiereSeleccionProfesor = computed(() => {
    if (!this.modoCrear()) return false;
    return this.idSemilleroForm() <= 0;
  });

  readonly liderSemilleroSeleccionado = computed(() => {
    const idSemillero = this.idSemilleroForm();
    if (idSemillero <= 0) return null;
    const semillero = this.semilleros().find((s) => s.id_semillero === idSemillero);
    if (!semillero?.profesor_lider) return null;
    return `${semillero.profesor_lider.nombres} ${semillero.profesor_lider.apellidos}`;
  });

  ngOnInit(): void {
    this.portalTheme.set(hasPortalTheme(this.route));
    window.setTimeout(() => this.entered.set(true), 120);

    const idParam = this.route.snapshot.paramMap.get('id');
    const isNuevo =
      this.route.snapshot.routeConfig?.path === 'nuevo' || idParam === 'nuevo';
    this.modoCrear.set(isNuevo);

    this.cargarCatalogos();

    if (!isNuevo && idParam) {
      this.cargarProyecto(Number(idParam));
    }

    this.formulario.controls.id_curso.valueChanges.subscribe((idCurso) => {
      this.onCursoCambiado(idCurso);
    });

    this.formulario.controls.id_semillero.valueChanges.subscribe((idSemillero) => {
      this.idSemilleroForm.set(idSemillero);
      this.actualizarValidacionProfesor();
    });

    if (isNuevo) {
      this.actualizarValidacionProfesor();
    }
  }

  ngOnDestroy(): void {
    this.revocarPreviews();
  }

  private revocarPreviews(): void {
    for (const url of this.previewsPendientes()) {
      URL.revokeObjectURL(url);
    }
  }

  private onCursoCambiado(idCurso: number): void {
    this.formulario.patchValue({ id_profesor_coordinador: 0 }, { emitEvent: false });
    this.profesoresCoordinadores.set([]);

    if (!this.modoCrear() || idCurso <= 0 || this.formulario.controls.id_semillero.value > 0) {
      return;
    }

    this.cargarProfesoresCoordinadores(idCurso);
  }

  private cargarProfesoresCoordinadores(idCurso: number): void {
    this.cargandoProfesores.set(true);
    this.proyectosService.listarCoordinadoresDisponibles(idCurso).subscribe({
      next: (data) => {
        this.profesoresCoordinadores.set(data);
        this.cargandoProfesores.set(false);
      },
      error: () => {
        this.profesoresCoordinadores.set([]);
        this.cargandoProfesores.set(false);
      },
    });
  }

  private actualizarValidacionProfesor(): void {
    const control = this.formulario.controls.id_profesor_coordinador;
    if (!this.modoCrear() || this.idSemilleroForm() > 0) {
      control.clearValidators();
      control.setValue(0, { emitEvent: false });
    } else {
      control.setValidators([Validators.required, Validators.min(1)]);
      const idCurso = this.formulario.controls.id_curso.value;
      if (idCurso > 0) {
        this.cargarProfesoresCoordinadores(idCurso);
      }
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private cargarCatalogos(): void {
    this.proyectosService.listarCursos().subscribe({
      next: (data) => this.cursos.set(data),
    });
    this.proyectosService.listarSemilleros().subscribe({
      next: (data) => this.semilleros.set(data),
    });
  }

  private cargarProyecto(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.proyectosService.obtener(id).subscribe({
      next: (data) => {
        this.proyecto.set(data);
        this.patchForm(data);
        this.syncImagenes(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('proyectosEstudiante.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  private patchForm(p: Proyecto): void {
    this.formulario.patchValue({
      id_curso: p.id_curso,
      id_semillero: p.id_semillero ?? 0,
      titulo: p.titulo,
      descripcion: p.descripcion,
      tipo_proyecto: p.tipo_proyecto as TipoProyecto,
      url_aplicativo: p.url_aplicativo,
      url_apk: p.url_apk ?? '',
      url_youtube: p.url_youtube ?? '',
      url_spotify: p.url_spotify ?? '',
    });

    if (!this.puedeEditar()) {
      this.formulario.disable();
    }
  }

  private syncImagenes(p: Proyecto): void {
    if (p.imagenes?.length) {
      this.imagenes.set(
        [...p.imagenes]
          .sort((a, b) => a.orden - b.orden)
          .map((img) => ({
            id_imagen: img.id_imagen,
            url: img.url,
            orden: img.orden,
          })),
      );
      return;
    }

    const legacy = urlsImagenesProyecto(p);
    this.imagenes.set(
      legacy.map((url, index) => ({
        id_imagen: 0,
        url,
        orden: index + 1,
      })),
    );
  }

  volver(): void {
    this.router.navigate(['/mis-proyectos']);
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const raw = this.formulario.getRawValue();
    const payload = {
      id_curso: raw.id_curso,
      id_semillero: raw.id_semillero > 0 ? raw.id_semillero : undefined,
      id_profesor_coordinador:
        raw.id_semillero > 0 ? undefined : raw.id_profesor_coordinador > 0
          ? raw.id_profesor_coordinador
          : undefined,
      titulo: raw.titulo.trim(),
      descripcion: raw.descripcion.trim(),
      tipo_proyecto: raw.tipo_proyecto,
      url_aplicativo: raw.url_aplicativo.trim(),
      url_apk: raw.url_apk?.trim() || undefined,
      url_youtube: raw.url_youtube?.trim() || undefined,
      url_spotify: raw.url_spotify?.trim() || undefined,
    };

    if (this.modoCrear()) {
      if (this.imagenesPendientes().length < 1) {
        this.error.set('proyectosEstudiante.errorImagenesRequeridas');
        return;
      }

      this.proyectosService.crear(payload).subscribe({
        next: (creado) => {
          this.subirYEnviarRevision(creado.id_proyecto, [...this.imagenesPendientes()]);
        },
        error: (err: { message?: string }) => {
          this.enviando.set(false);
          this.error.set(err.message ?? 'proyectosEstudiante.errorCrear');
        },
      });
      return;
    }

    const id = this.proyecto()?.id_proyecto;
    if (!id) return;

    this.proyectosService.actualizar(id, payload).subscribe({
      next: (actualizado) => {
        this.proyecto.set(actualizado);
        this.enviando.set(false);
        void this.dialog.success({ messageKey: 'proyectosEstudiante.exitoGuardar' });
      },
      error: (err: { message?: string }) => {
        this.enviando.set(false);
        this.error.set(err.message ?? 'proyectosEstudiante.errorGuardar');
      },
    });
  }

  async enviarRevision(): Promise<void> {
    const p = this.proyecto();
    if (!p || !this.puedeEnviarRevision()) return;

    const ok = await this.dialog.confirm({
      titleKey: 'proyectosEstudiante.enviarRevisionTitulo',
      messageKey: 'proyectosEstudiante.enviarRevisionMensaje',
      confirmKey: 'proyectosEstudiante.enviarRevision',
    });
    if (!ok) return;

    this.enviando.set(true);
    this.proyectosService
      .cambiarEstado(p.id_proyecto, { estado_proyecto: 'en_revision' })
      .subscribe({
        next: (actualizado) => {
          this.proyecto.set(actualizado);
          this.formulario.disable();
          this.enviando.set(false);
          void this.dialog.success({ messageKey: 'proyectosEstudiante.exitoRevision' });
        },
        error: (err: { message?: string }) => {
          this.enviando.set(false);
          void this.dialog.error({
            message: err.message ?? this.translate.instant('proyectosEstudiante.errorRevision'),
          });
        },
      });
  }

  async eliminar(): Promise<void> {
    const p = this.proyecto();
    if (!p || !this.proyectosService.puedeEliminar(p)) return;

    const ok = await this.dialog.confirm({
      titleKey: 'proyectosEstudiante.eliminarTitulo',
      messageKey: 'proyectosEstudiante.eliminarMensaje',
      confirmKey: 'common.eliminar',
      destructive: true,
    });
    if (!ok) return;

    this.enviando.set(true);
    this.proyectosService.eliminar(p.id_proyecto).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/mis-proyectos']);
      },
      error: (err: { message?: string }) => {
        this.enviando.set(false);
        void this.dialog.error({
          message: err.message ?? this.translate.instant('proyectosEstudiante.errorEliminar'),
        });
      },
    });
  }

  onSeleccionarImagenes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    if (!files.length) return;

    if (this.modoCrear()) {
      const total = this.imagenesPendientes().length + files.length;
      if (total > MAX_IMAGENES) {
        void this.dialog.warning({ messageKey: 'proyectosEstudiante.errorMaxImagenes' });
        return;
      }
      this.imagenesPendientes.update((prev) => [...prev, ...files]);
      this.previewsPendientes.update((prev) => [
        ...prev,
        ...files.map((file) => URL.createObjectURL(file)),
      ]);
      return;
    }

    const p = this.proyecto();
    if (!p || !this.puedeGestionarImagenes()) return;

    if (files.length > this.slotsImagenesRestantes()) {
      void this.dialog.warning({
        messageKey: 'proyectosEstudiante.errorMaxImagenes',
      });
      return;
    }

    this.subiendoImagenes.set(true);
    this.proyectosService.subirImagenes(p.id_proyecto, files).subscribe({
      next: () => {
        this.subiendoImagenes.set(false);
        this.cargarProyecto(p.id_proyecto);
      },
      error: (err: { message?: string }) => {
        this.subiendoImagenes.set(false);
        void this.dialog.error({
          message: err.message ?? this.translate.instant('proyectosEstudiante.errorSubirImagen'),
        });
      },
    });
  }

  quitarImagenPendiente(index: number): void {
    const previews = [...this.previewsPendientes()];
    const files = [...this.imagenesPendientes()];
    URL.revokeObjectURL(previews[index]);
    previews.splice(index, 1);
    files.splice(index, 1);
    this.previewsPendientes.set(previews);
    this.imagenesPendientes.set(files);
  }

  private subirYEnviarRevision(idProyecto: number, files: File[]): void {
    this.subiendoImagenes.set(true);
    this.proyectosService.subirImagenes(idProyecto, files).subscribe({
      next: () => {
        this.proyectosService
          .cambiarEstado(idProyecto, { estado_proyecto: 'en_revision' })
          .subscribe({
            next: () => {
              this.revocarPreviews();
              this.imagenesPendientes.set([]);
              this.previewsPendientes.set([]);
              this.enviando.set(false);
              this.subiendoImagenes.set(false);
              void this.dialog.success({ messageKey: 'proyectosEstudiante.exitoCrearEnviado' });
              this.router.navigate(['/mis-proyectos']);
            },
            error: (err: { message?: string }) => {
              this.enviando.set(false);
              this.subiendoImagenes.set(false);
              this.error.set(err.message ?? 'proyectosEstudiante.errorRevision');
            },
          });
      },
      error: (err: { message?: string }) => {
        this.enviando.set(false);
        this.subiendoImagenes.set(false);
        void this.dialog.error({
          message: err.message ?? this.translate.instant('proyectosEstudiante.errorSubirImagen'),
        });
        this.router.navigate(['/mis-proyectos']);
      },
    });
  }

  async quitarImagen(idImagen: number): Promise<void> {
    const p = this.proyecto();
    if (!p || idImagen <= 0) return;

    const ok = await this.dialog.confirm({
      messageKey: 'proyectosEstudiante.confirmarEliminarImagen',
      confirmKey: 'common.eliminar',
      destructive: true,
    });
    if (!ok) return;

    this.proyectosService.eliminarImagen(p.id_proyecto, idImagen).subscribe({
      next: () => this.cargarProyecto(p.id_proyecto),
      error: (err: { message?: string }) => {
        void this.dialog.error({
          message: err.message ?? this.translate.instant('proyectosEstudiante.errorEliminarImagen'),
        });
      },
    });
  }

  verPublico(): void {
    const id = this.proyecto()?.id_proyecto;
    if (id) this.router.navigate(['/proyectos', id]);
  }

  mostrarCampo(tipo: 'apk' | 'youtube' | 'spotify'): boolean {
    const t = this.formulario.controls.tipo_proyecto.value;
    if (tipo === 'apk') return t === 'movil';
    if (tipo === 'youtube') return t === 'podcast' || t === 'web';
    if (tipo === 'spotify') return t === 'podcast';
    return false;
  }
}
