import { Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { type Observable, catchError, filter, map, of } from 'rxjs';
import { AuthService, type User } from '../../../core/auth/auth.service';
import type { FormacionAcademica, NivelFormacion } from '../../../core/models/usuario.model';
import { PerfilService } from '../../../features/perfil/perfil.service';
import { ToastService } from '../toast/toast.service';
import { FotoPerfilComponent } from '../foto-perfil/foto-perfil.component';
import { PerfilAsistenteService } from './perfil-asistente.service';
import {
  CVLAC_DOMINIO,
  GITHUB_DOMINIO,
  LINKEDIN_DOMINIO,
  ORCID_DOMINIO,
  RESEARCHGATE_DOMINIO,
  SCHOLAR_DOMINIO,
  urlRedValidator,
} from '../../validators/redes.validators';

type PasoId = 'bienvenida' | 'foto' | 'sobre' | 'habilidades' | 'formacion' | 'enlaces' | 'listo';
type ListaEtiquetas = 'especialidades' | 'fortalezas';
type CampoEnlace =
  | 'url_linkedin'
  | 'url_github'
  | 'url_portafolio'
  | 'url_cvlac'
  | 'url_orcid'
  | 'url_google_scholar'
  | 'url_researchgate';

const ORDEN: PasoId[] = ['bienvenida', 'foto', 'sobre', 'habilidades', 'formacion', 'enlaces', 'listo'];

/** Pasos numerados del indicador superior (sin la bienvenida ni el cierre). */
const PASOS = [
  { id: 'foto', icono: 'ti-camera' },
  { id: 'sobre', icono: 'ti-user-edit' },
  { id: 'habilidades', icono: 'ti-bulb' },
  { id: 'formacion', icono: 'ti-school' },
  { id: 'enlaces', icono: 'ti-link' },
] as const;

const ENLACES: { campo: CampoEnlace; icono: string; etiqueta: string; ejemplo: string }[] = [
  { campo: 'url_linkedin', icono: 'ti-brand-linkedin', etiqueta: 'perfil.redes.linkedin', ejemplo: 'https://www.linkedin.com/in/...' },
  { campo: 'url_github', icono: 'ti-brand-github', etiqueta: 'perfil.redes.github', ejemplo: 'https://github.com/...' },
  { campo: 'url_portafolio', icono: 'ti-world', etiqueta: 'perfil.redes.portafolio', ejemplo: 'https://...' },
  { campo: 'url_cvlac', icono: 'ti-certificate', etiqueta: 'perfil.redes.cvlac', ejemplo: 'https://scienti.minciencias.gov.co/cvlac/...' },
  { campo: 'url_orcid', icono: 'ti-id', etiqueta: 'perfil.redes.orcid', ejemplo: 'https://orcid.org/0000-0000-0000-0000' },
  { campo: 'url_google_scholar', icono: 'ti-school', etiqueta: 'perfil.redes.google_scholar', ejemplo: 'https://scholar.google.com/citations?user=...' },
  { campo: 'url_researchgate', icono: 'ti-atom', etiqueta: 'perfil.redes.researchgate', ejemplo: 'https://www.researchgate.net/profile/...' },
];

const NIVELES: NivelFormacion[] = ['tecnico', 'tecnologo', 'pregrado', 'especializacion', 'maestria', 'doctorado', 'curso', 'otro'];
const MAX_ETIQUETAS = 15;

/**
 * Asistente para completar el perfil tipo CvLAC, paso a paso: foto, titular y biografía,
 * especialidades y fortalezas, formación y enlaces. En el primer ingreso es obligatorio: no se puede
 * cerrar hasta completar los datos requeridos (los enlaces son opcionales). Desde «Mi perfil» se abre
 * a pedido y se puede cerrar. Cada paso se guarda al avanzar.
 */
@Component({
  selector: 'app-perfil-asistente',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, FotoPerfilComponent],
  templateUrl: './perfil-asistente.component.html',
  styleUrl: './perfil-asistente.component.scss',
})
export class PerfilAsistenteComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private perfilService = inject(PerfilService);
  private asistente = inject(PerfilAsistenteService);

  private readonly dialogo = viewChild<ElementRef<HTMLElement>>('dialogo');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly pasos = PASOS;
  readonly enlaces = ENLACES;
  readonly niveles = NIVELES;

  /** Queda abierto hasta llegar al cierre aunque el perfil ya quede marcado como revisado. */
  private readonly abiertoAuto = signal(false);

  readonly visible = computed(() => this.abiertoAuto() || this.asistente.abierto());
  readonly paso = signal(0);
  readonly direccion = signal<'adelante' | 'atras'>('adelante');
  readonly guardando = signal(false);

  readonly pasoId = computed(() => ORDEN[this.paso()]);
  /** Índice dentro de PASOS (0-4); -1 en la bienvenida y 5 al terminar. */
  readonly indicePaso = computed(() => this.paso() - 1);
  readonly progresoPasos = computed(() => Math.min(100, Math.max(0, (this.indicePaso() / PASOS.length) * 100)));

  readonly usuario = this.auth.user;
  readonly nombre = computed(() => this.usuario()?.nombres ?? '');
  /** Primer ingreso: hay que completar el perfil antes de usar la plataforma. */
  readonly obligatorio = computed(() => this.usuario()?.perfil_cv_revisado === false);
  /** Mensaje del dato que falta en el paso actual (clave de traducción). */
  readonly aviso = signal<string | null>(null);

  readonly sobreForm = this.fb.nonNullable.group({
    titular: ['', Validators.maxLength(160)],
    biografia: ['', Validators.maxLength(2000)],
  });
  readonly especialidades = signal<string[]>([]);
  readonly fortalezas = signal<string[]>([]);
  private readonly etiquetasCambiadas = signal(false);

  readonly enlacesForm = this.fb.nonNullable.group({
    url_linkedin: ['', urlRedValidator(LINKEDIN_DOMINIO)],
    url_github: ['', urlRedValidator(GITHUB_DOMINIO)],
    url_portafolio: ['', urlRedValidator()],
    url_cvlac: ['', urlRedValidator(CVLAC_DOMINIO)],
    url_orcid: ['', urlRedValidator(ORCID_DOMINIO)],
    url_google_scholar: ['', urlRedValidator(SCHOLAR_DOMINIO)],
    url_researchgate: ['', urlRedValidator(RESEARCHGATE_DOMINIO)],
    mostrar_telefono: [false],
  });

  readonly formacion = signal<FormacionAcademica[]>([]);
  readonly agregandoFormacion = signal(false);
  readonly formacionForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(255)]],
    institucion: ['', [Validators.required, Validators.maxLength(255)]],
    nivel: ['pregrado' as NivelFormacion, Validators.required],
    anio_inicio: [null as number | null, [Validators.min(1950), Validators.max(2100)]],
    anio_fin: [null as number | null, [Validators.min(1950), Validators.max(2100)]],
  });

  /** Qué tan completo quedó el perfil (para el cierre). */
  readonly checklist = computed(() => {
    const u = this.usuario();
    const r = u?.redes;
    return [
      { clave: 'foto', icono: 'ti-camera', hecho: !!u?.url_foto },
      { clave: 'titular', icono: 'ti-id-badge-2', hecho: !!u?.cv?.titular },
      { clave: 'biografia', icono: 'ti-align-left', hecho: !!u?.cv?.biografia },
      { clave: 'habilidades', icono: 'ti-bulb', hecho: !!(u?.cv?.especialidades?.length || u?.cv?.fortalezas?.length) },
      { clave: 'formacion', icono: 'ti-school', hecho: this.formacion().length > 0 },
      { clave: 'enlaces', icono: 'ti-link', hecho: !!r && Object.values(r).some((v) => !!v) },
    ];
  });
  readonly porcentaje = computed(() => {
    const items = this.checklist();
    return Math.round((items.filter((i) => i.hecho).length / items.length) * 100);
  });

  /** Ruta del perfil público del usuario en sesión. */
  readonly perfilPublico = computed(() => ['/personas', this.usuario()?.id_usuario ?? 0]);

  constructor() {
    // Primer ingreso: se abre (y no se puede cerrar) mientras el perfil no esté completo
    effect(() => {
      const u = this.usuario();
      const url = this.url();
      if (!u || u.primer_login || u.perfil_pendiente || u.perfil_cv_revisado !== false) return;
      // Los flujos de acceso van primero
      if (/\/(login|registro|cambiar-password|completar-perfil)(\/|$|\?)/.test(url)) return;
      untracked(() => {
        if (!this.abiertoAuto()) this.preparar(0);
        this.abiertoAuto.set(true);
      });
    });

    // El aviso desaparece en cuanto el paso tiene su dato (foto subida, etiqueta o estudio agregado)
    effect(() => {
      this.usuario();
      this.formacion();
      this.especialidades();
      this.fortalezas();
      untracked(() => {
        if (this.aviso() && !this.faltaEnPaso(this.pasoId())) this.aviso.set(null);
      });
    });

    // Apertura desde «Mi perfil»: salta la bienvenida
    effect(() => {
      if (!this.asistente.abierto()) return;
      untracked(() => {
        if (!this.abiertoAuto()) this.preparar(1);
      });
    });
  }

  empezar(): void {
    this.mover(1);
  }

  anterior(): void {
    this.ir(this.paso() - 1);
  }

  siguiente(): void {
    this.ir(this.paso() + 1);
  }

  /** Guarda el paso actual y, si todo va bien, pasa al indicado. */
  ir(destino: number): void {
    if (this.guardando() || destino === this.paso() || destino < 1 || destino >= ORDEN.length) return;
    // En el primer ingreso no se avanza sin el dato obligatorio del paso
    const falta = destino > this.paso() && this.obligatorio() ? this.faltaEnPaso(this.pasoId()) : null;
    this.aviso.set(falta);
    if (falta) return;
    this.guardando.set(true);
    this.guardarPasoActual().subscribe((ok) => {
      if (!ok) {
        this.guardando.set(false);
        return;
      }
      // Al terminar el último paso del primer ingreso se valida el perfil completo
      if (ORDEN[destino] === 'listo' && this.obligatorio()) {
        this.completar();
        return;
      }
      this.guardando.set(false);
      this.mover(destino);
    });
  }

  /** Pasa al siguiente sin guardar lo que haya en este paso (solo pasos opcionales en el primer ingreso). */
  omitir(): void {
    if (this.guardando() || !this.puedeOmitir()) return;
    this.ir(this.paso() + 1);
  }

  /** En el primer ingreso solo los enlaces son opcionales. */
  puedeOmitir(): boolean {
    return !this.obligatorio() || this.pasoId() === 'enlaces';
  }

  cerrar(): void {
    // El primer ingreso no se puede cerrar hasta completar el perfil
    if (this.obligatorio()) return;
    this.abiertoAuto.set(false);
    this.asistente.cerrar();
  }

  verPerfilPublico(): void {
    const destino = this.perfilPublico();
    this.cerrar();
    void this.router.navigate(destino);
  }

  // ---- Etiquetas ----

  agregarEtiqueta(lista: ListaEtiquetas, event: Event): void {
    const input = event.target as HTMLInputElement;
    event.preventDefault();
    this.sumarEtiqueta(lista, input.value);
    input.value = '';
  }

  sumarEtiqueta(lista: ListaEtiquetas, texto: string): void {
    const valor = texto.replace(/,/g, '').trim().slice(0, 60);
    if (!valor) return;
    const actual = this[lista]();
    if (actual.length >= MAX_ETIQUETAS || this.tieneEtiqueta(lista, valor)) return;
    this[lista].set([...actual, valor]);
    this.etiquetasCambiadas.set(true);
  }

  quitarEtiqueta(lista: ListaEtiquetas, valor: string): void {
    this[lista].update((actual) => actual.filter((v) => v !== valor));
    this.etiquetasCambiadas.set(true);
  }

  tieneEtiqueta(lista: ListaEtiquetas, valor: string): boolean {
    return this[lista]().some((v) => v.toLowerCase() === valor.toLowerCase());
  }

  // ---- Formación ----

  guardarFormacion(): void {
    if (this.formacionForm.invalid) {
      this.formacionForm.markAllAsTouched();
      return;
    }
    const raw = this.formacionForm.getRawValue();
    this.agregandoFormacion.set(true);
    this.perfilService
      .crearFormacion({
        titulo: raw.titulo.trim(),
        institucion: raw.institucion.trim(),
        nivel: raw.nivel,
        anio_inicio: raw.anio_inicio || null,
        anio_fin: raw.anio_fin || null,
      })
      .subscribe({
        next: (f) => {
          this.agregandoFormacion.set(false);
          this.formacion.update((lista) => [f, ...lista]);
          this.formacionForm.reset({ titulo: '', institucion: '', nivel: 'pregrado', anio_inicio: null, anio_fin: null });
        },
        error: () => {
          this.agregandoFormacion.set(false);
          this.toast.error('perfil.cv.errorFormacion');
        },
      });
  }

  eliminarFormacion(f: FormacionAcademica): void {
    this.perfilService.eliminarFormacion(f.id_formacion).subscribe({
      next: () => this.formacion.update((lista) => lista.filter((x) => x.id_formacion !== f.id_formacion)),
      error: () => this.toast.error('perfil.cv.errorFormacion'),
    });
  }

  errorFormacion(campo: 'titulo' | 'institucion'): boolean {
    const c = this.formacionForm.controls[campo];
    return c.invalid && c.touched;
  }

  errorEnlace(campo: CampoEnlace): string | null {
    const control = this.enlacesForm.controls[campo];
    if (!control.invalid || !control.touched) return null;
    return control.hasError('dominio') ? `perfil.redes.errores.${campo}` : 'perfil.redes.errores.url';
  }

  // ---- Internos ----

  /** Clave del mensaje del dato obligatorio que falta en el paso, o null si está completo. */
  private faltaEnPaso(id: PasoId): string | null {
    const u = this.usuario();
    switch (id) {
      case 'foto':
        return u?.url_foto ? null : 'asistentePerfil.requerido.foto';
      case 'sobre': {
        const { titular, biografia } = this.sobreForm.getRawValue();
        return titular.trim() && biografia.trim() ? null : 'asistentePerfil.requerido.sobre';
      }
      case 'habilidades':
        return this.especialidades().length + this.fortalezas().length > 0 ? null : 'asistentePerfil.requerido.habilidades';
      case 'formacion':
        return this.formacion().length > 0 ? null : 'asistentePerfil.requerido.formacion';
      default:
        return null;
    }
  }

  private completar(): void {
    this.auth.completarPerfilCv().subscribe({
      next: () => {
        this.guardando.set(false);
        this.mover(ORDEN.indexOf('listo'));
      },
      error: () => {
        this.guardando.set(false);
        // Lleva al primer paso al que le falta información
        const pendiente = PASOS.find((p) => this.faltaEnPaso(p.id));
        if (pendiente) {
          this.mover(ORDEN.indexOf(pendiente.id));
          this.aviso.set(this.faltaEnPaso(pendiente.id));
        } else {
          this.toast.error('perfil.cv.errorGuardar');
        }
      },
    });
  }

  private preparar(paso: number): void {
    this.cargarFormularios(this.usuario());
    this.perfilService.listarFormacion().subscribe({ next: (lista) => this.formacion.set(lista), error: () => undefined });
    this.direccion.set('adelante');
    this.paso.set(paso);
    this.enfocar();
  }

  private mover(destino: number): void {
    if (destino !== this.paso()) this.aviso.set(null);
    this.direccion.set(destino > this.paso() ? 'adelante' : 'atras');
    this.paso.set(destino);
    this.enfocar();
  }

  private enfocar(): void {
    setTimeout(() => this.dialogo()?.nativeElement.focus());
  }

  private guardarPasoActual(): Observable<boolean> {
    switch (this.pasoId()) {
      case 'sobre': {
        if (this.sobreForm.invalid) {
          this.sobreForm.markAllAsTouched();
          return of(false);
        }
        if (this.sobreForm.pristine) return of(true);
        const raw = this.sobreForm.getRawValue();
        return this.guardar({ titular: raw.titular.trim() || null, biografia: raw.biografia.trim() || null });
      }
      case 'habilidades':
        if (!this.etiquetasCambiadas()) return of(true);
        return this.guardar({ especialidades: this.especialidades(), fortalezas: this.fortalezas() });
      case 'enlaces': {
        if (this.enlacesForm.invalid) {
          this.enlacesForm.markAllAsTouched();
          return of(false);
        }
        if (this.enlacesForm.pristine) return of(true);
        const raw = this.enlacesForm.getRawValue();
        const limpio = (v: string) => v.trim() || null;
        return this.guardar({
          url_linkedin: limpio(raw.url_linkedin),
          url_github: limpio(raw.url_github),
          url_portafolio: limpio(raw.url_portafolio),
          url_cvlac: limpio(raw.url_cvlac),
          url_orcid: limpio(raw.url_orcid),
          url_google_scholar: limpio(raw.url_google_scholar),
          url_researchgate: limpio(raw.url_researchgate),
          mostrar_telefono: raw.mostrar_telefono,
        });
      }
      default:
        return of(true);
    }
  }

  private guardar(datos: Parameters<AuthService['actualizarMiPerfil']>[0]): Observable<boolean> {
    return this.auth.actualizarMiPerfil(datos).pipe(
      map(() => {
        this.sobreForm.markAsPristine();
        this.enlacesForm.markAsPristine();
        this.etiquetasCambiadas.set(false);
        return true;
      }),
      catchError(() => {
        this.toast.error('perfil.cv.errorGuardar');
        return of(false);
      }),
    );
  }

  private cargarFormularios(u: User | null): void {
    this.sobreForm.reset({ titular: u?.cv?.titular ?? '', biografia: u?.cv?.biografia ?? '' });
    this.especialidades.set([...(u?.cv?.especialidades ?? [])]);
    this.fortalezas.set([...(u?.cv?.fortalezas ?? [])]);
    this.etiquetasCambiadas.set(false);
    this.enlacesForm.reset({
      url_linkedin: u?.redes?.linkedin ?? '',
      url_github: u?.redes?.github ?? '',
      url_portafolio: u?.redes?.portafolio ?? '',
      url_cvlac: u?.redes?.cvlac ?? '',
      url_orcid: u?.redes?.orcid ?? '',
      url_google_scholar: u?.redes?.google_scholar ?? '',
      url_researchgate: u?.redes?.researchgate ?? '',
      mostrar_telefono: u?.cv?.mostrar_telefono ?? false,
    });
    this.formacionForm.reset({ titulo: '', institucion: '', nivel: 'pregrado', anio_inicio: null, anio_fin: null });
  }
}
