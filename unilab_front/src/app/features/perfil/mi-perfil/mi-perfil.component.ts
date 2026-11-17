import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService, type User } from '../../../core/auth/auth.service';
import { PerfilService } from '../perfil.service';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import type { FormacionAcademica, FormacionDto, NivelFormacion } from '../../../core/models/usuario.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { RedesContactoComponent } from '../../../shared/ui/redes-contacto/redes-contacto.component';
import { FotoPerfilComponent } from '../../../shared/ui/foto-perfil/foto-perfil.component';
import { PerfilAsistenteService } from '../../../shared/ui/perfil-asistente/perfil-asistente.service';
import {
  CVLAC_DOMINIO,
  GITHUB_DOMINIO,
  LINKEDIN_DOMINIO,
  ORCID_DOMINIO,
  RESEARCHGATE_DOMINIO,
  SCHOLAR_DOMINIO,
  redesDesdeFormulario,
  urlRedValidator,
} from '../../../shared/validators/redes.validators';

type CampoAcademico = 'url_cvlac' | 'url_orcid' | 'url_google_scholar' | 'url_researchgate';
type ListaEtiquetas = 'especialidades' | 'fortalezas';

const NIVELES: NivelFormacion[] = [
  'tecnico',
  'tecnologo',
  'pregrado',
  'especializacion',
  'maestria',
  'doctorado',
  'curso',
  'otro',
];
const MAX_ETIQUETAS = 15;

/** Mismo formato que valida el backend: opcional «+», 7 a 20 dígitos, espacios o guiones. */
const TELEFONO_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;

type CampoContacto = 'telefono' | 'profesion' | 'url_linkedin' | 'url_github' | 'url_portafolio';

function passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('nueva_password')?.value;
  const confirmar = group.get('confirmar_password')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
}

/**
 * Mi perfil: rol, escuela y semilleros (solo lectura); teléfono, profesión (Coordinador)
 * y redes de contacto editables; cambio de contraseña.
 */
@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RedesContactoComponent, RouterLink, FotoPerfilComponent],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.scss',
})
export class MiPerfilComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private perfilService = inject(PerfilService);
  private dialog = inject(DialogService);
  private asistente = inject(PerfilAsistenteService);

  readonly usuario = this.auth.user;
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly cambiandoPassword = signal(false);
  readonly errorPassword = signal<string | null>(null);
  readonly mostrarPasswords = signal(false);

  readonly esCoordinador = computed(() => this.usuario()?.id_rol === 'Coordinador');

  readonly form = this.fb.nonNullable.group({
    telefono: ['', [Validators.required, Validators.pattern(TELEFONO_PATTERN)]],
    profesion: ['', Validators.maxLength(255)],
    url_linkedin: ['', urlRedValidator(LINKEDIN_DOMINIO)],
    url_github: ['', urlRedValidator(GITHUB_DOMINIO)],
    url_portafolio: ['', urlRedValidator()],
  });

  // ---- Perfil profesional (tipo CvLAC) ----
  readonly niveles = NIVELES;
  readonly cvForm = this.fb.nonNullable.group({
    titular: ['', Validators.maxLength(160)],
    biografia: ['', Validators.maxLength(2000)],
    mostrar_telefono: [false],
    url_cvlac: ['', urlRedValidator(CVLAC_DOMINIO)],
    url_orcid: ['', urlRedValidator(ORCID_DOMINIO)],
    url_google_scholar: ['', urlRedValidator(SCHOLAR_DOMINIO)],
    url_researchgate: ['', urlRedValidator(RESEARCHGATE_DOMINIO)],
  });
  readonly especialidades = signal<string[]>([]);
  readonly fortalezas = signal<string[]>([]);
  /** Las listas de etiquetas viven fuera del formulario: este indicador habilita «Guardar». */
  readonly etiquetasCambiadas = signal(false);
  readonly guardandoCv = signal(false);

  readonly formacion = signal<FormacionAcademica[]>([]);
  /** id de la formación en edición; 0 = nueva; null = ninguna. */
  readonly editandoFormacion = signal<number | null>(null);
  readonly guardandoFormacion = signal(false);
  readonly formacionForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(255)]],
    institucion: ['', [Validators.required, Validators.maxLength(255)]],
    nivel: ['pregrado' as NivelFormacion, Validators.required],
    anio_inicio: [null as number | null, [Validators.min(1950), Validators.max(2100)]],
    anio_fin: [null as number | null, [Validators.min(1950), Validators.max(2100)]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      password_actual: ['', Validators.required],
      nueva_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmar_password: ['', Validators.required],
    },
    { validators: passwordsCoinciden },
  );

  readonly nombreCompleto = computed(() => {
    const u = this.usuario();
    return `${u?.nombres ?? ''} ${u?.apellidos ?? ''}`.trim() || u?.email || '';
  });

  /** Filas «etiqueta: valor» del perfil según el rol (solo las que tienen dato). */
  readonly datos = computed(() => {
    const u = this.usuario();
    if (!u) return [];
    const p = u.perfil;
    const filas: { etiqueta: string; valor: string | null | undefined }[] = [
      { etiqueta: 'perfil.escuela', valor: u.escuela?.nombre_escuela },
      { etiqueta: 'usuarios.codigoDocente', valor: p?.codigo_docente },
      { etiqueta: 'usuarios.codigoEstudiantil', valor: p?.codigo_estudiantil },
      { etiqueta: 'usuarios.cargo', valor: p?.cargo },
      { etiqueta: 'usuarios.dependencia', valor: p?.dependencia },
      { etiqueta: 'perfil.profesion', valor: p?.profesion },
      { etiqueta: 'usuarios.institucion', valor: p?.institucion },
      { etiqueta: 'usuarios.ocupacion', valor: p?.ocupacion },
    ];
    return filas.filter((f) => !!f.valor);
  });

  abrirAsistente(): void {
    this.asistente.abrir();
  }

  ngOnInit(): void {
    this.perfilService.listarFormacion().subscribe({ next: (lista) => this.formacion.set(lista) });
    this.cargarFormulario(this.usuario());
    this.cargando.set(true);
    this.auth.me().subscribe({
      next: (u) => {
        this.cargarFormulario(u);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('perfil.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  /** Clave i18n del error de un campo de contacto, o null si es válido o no se ha tocado. */
  errorCampo(name: CampoContacto): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !control.touched) return null;
    if (name === 'telefono') {
      return control.hasError('required') ? 'auth.registro.errors.required' : 'perfil.errores.telefono';
    }
    if (name === 'profesion') return 'perfil.errores.profesion';
    return control.hasError('dominio') ? `perfil.redes.errores.${name}` : 'perfil.redes.errores.url';
  }

  errorAcademico(name: CampoAcademico): string | null {
    const control = this.cvForm.controls[name];
    if (!control.invalid || !control.touched) return null;
    return control.hasError('dominio') ? `perfil.redes.errores.${name}` : 'perfil.redes.errores.url';
  }

  /** Enter o coma agregan la etiqueta escrita; se ignoran vacías y repetidas. */
  agregarEtiqueta(lista: ListaEtiquetas, event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/,/g, '').trim().slice(0, 60);
    event.preventDefault();
    input.value = '';
    if (!valor) return;
    const actual = this[lista]();
    if (actual.length >= MAX_ETIQUETAS || actual.some((v) => v.toLowerCase() === valor.toLowerCase())) return;
    this[lista].set([...actual, valor]);
    this.etiquetasCambiadas.set(true);
  }

  quitarEtiqueta(lista: ListaEtiquetas, valor: string): void {
    this[lista].update((actual) => actual.filter((v) => v !== valor));
    this.etiquetasCambiadas.set(true);
  }

  guardarCv(): void {
    if (this.cvForm.invalid) {
      this.cvForm.markAllAsTouched();
      return;
    }
    const raw = this.cvForm.getRawValue();
    this.guardandoCv.set(true);
    this.auth
      .actualizarMiPerfil({
        titular: raw.titular.trim() || null,
        biografia: raw.biografia.trim() || null,
        mostrar_telefono: raw.mostrar_telefono,
        especialidades: this.especialidades(),
        fortalezas: this.fortalezas(),
        url_cvlac: raw.url_cvlac.trim() || null,
        url_orcid: raw.url_orcid.trim() || null,
        url_google_scholar: raw.url_google_scholar.trim() || null,
        url_researchgate: raw.url_researchgate.trim() || null,
      })
      .subscribe({
        next: (u) => {
          this.guardandoCv.set(false);
          this.cargarFormulario(u);
          this.toast.success('perfil.cv.guardado');
        },
        error: () => {
          this.guardandoCv.set(false);
          this.toast.error('perfil.cv.errorGuardar');
        },
      });
  }

  nuevaFormacion(): void {
    this.formacionForm.reset({ titulo: '', institucion: '', nivel: 'pregrado', anio_inicio: null, anio_fin: null });
    this.editandoFormacion.set(0);
  }

  editarFormacion(f: FormacionAcademica): void {
    this.formacionForm.reset({
      titulo: f.titulo,
      institucion: f.institucion,
      nivel: f.nivel,
      anio_inicio: f.anio_inicio,
      anio_fin: f.anio_fin,
    });
    this.editandoFormacion.set(f.id_formacion);
  }

  cancelarFormacion(): void {
    this.editandoFormacion.set(null);
  }

  guardarFormacion(): void {
    if (this.formacionForm.invalid) {
      this.formacionForm.markAllAsTouched();
      return;
    }
    const raw = this.formacionForm.getRawValue();
    const data: FormacionDto = {
      titulo: raw.titulo.trim(),
      institucion: raw.institucion.trim(),
      nivel: raw.nivel,
      anio_inicio: raw.anio_inicio || null,
      anio_fin: raw.anio_fin || null,
    };
    const id = this.editandoFormacion();
    this.guardandoFormacion.set(true);
    const peticion = id ? this.perfilService.actualizarFormacion(id, data) : this.perfilService.crearFormacion(data);
    peticion.subscribe({
      next: () => {
        this.guardandoFormacion.set(false);
        this.editandoFormacion.set(null);
        this.perfilService.listarFormacion().subscribe({ next: (lista) => this.formacion.set(lista) });
      },
      error: () => {
        this.guardandoFormacion.set(false);
        this.toast.error('perfil.cv.errorFormacion');
      },
    });
  }

  async eliminarFormacion(f: FormacionAcademica): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'dialog.confirm.deleteTitle',
      messageKey: 'perfil.cv.confirmarEliminar',
      confirmKey: 'common.delete',
      cancelKey: 'common.cancelar',
    });
    if (!ok) return;
    this.perfilService.eliminarFormacion(f.id_formacion).subscribe({
      next: () => this.formacion.update((lista) => lista.filter((x) => x.id_formacion !== f.id_formacion)),
      error: () => this.toast.error('perfil.cv.errorFormacion'),
    });
  }

  errorPasswordCampo(name: 'password_actual' | 'nueva_password' | 'confirmar_password'): string | null {
    const control = this.passwordForm.controls[name];
    if (!control.touched) return null;
    if (control.hasError('required')) return 'auth.registro.errors.required';
    if (control.hasError('minlength')) return 'perfil.password.errores.minimo';
    if (name === 'confirmar_password' && this.passwordForm.hasError('noCoinciden')) {
      return 'perfil.password.errores.noCoinciden';
    }
    return null;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    this.auth
      .actualizarMiPerfil({
        telefono: raw.telefono.trim(),
        ...redesDesdeFormulario(raw),
        ...(this.esCoordinador() ? { profesion: raw.profesion.trim() || null } : {}),
      })
      .subscribe({
        next: (u) => {
          this.guardando.set(false);
          this.cargarFormulario(u);
          this.toast.success('perfil.exito');
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('perfil.errorGuardar');
        },
      });
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { password_actual, nueva_password } = this.passwordForm.getRawValue();
    if (password_actual === nueva_password) {
      this.errorPassword.set('perfil.password.errores.igual');
      return;
    }
    this.cambiandoPassword.set(true);
    this.errorPassword.set(null);
    this.auth.cambiarMiPassword({ password_actual, nueva_password }).subscribe({
      next: () => {
        this.cambiandoPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('perfil.password.exito');
      },
      error: (err: { status?: number }) => {
        this.cambiandoPassword.set(false);
        this.errorPassword.set(
          err?.status === 422 ? 'perfil.password.errores.actualIncorrecta' : 'perfil.password.errores.general',
        );
      },
    });
  }

  private cargarFormulario(u: User | null): void {
    this.form.reset({
      telefono: u?.telefono ?? '',
      profesion: u?.perfil?.profesion ?? '',
      url_linkedin: u?.redes?.linkedin ?? '',
      url_github: u?.redes?.github ?? '',
      url_portafolio: u?.redes?.portafolio ?? '',
    });
    this.cvForm.reset({
      titular: u?.cv?.titular ?? '',
      biografia: u?.cv?.biografia ?? '',
      mostrar_telefono: u?.cv?.mostrar_telefono ?? false,
      url_cvlac: u?.redes?.cvlac ?? '',
      url_orcid: u?.redes?.orcid ?? '',
      url_google_scholar: u?.redes?.google_scholar ?? '',
      url_researchgate: u?.redes?.researchgate ?? '',
    });
    this.especialidades.set([...(u?.cv?.especialidades ?? [])]);
    this.fortalezas.set([...(u?.cv?.fortalezas ?? [])]);
    this.etiquetasCambiadas.set(false);
  }
}
