import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UsuariosService } from '../usuarios.service';
import type { RolNombre, UsuarioAdmin } from '../../../core/models/usuario.model';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

const PAGE_SIZE = 10;

/** Pantalla 07 · Usuarios — tabla con filtro por rol y paginación (en cliente). */
@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  readonly roles: RolNombre[] = ['Administrador', 'Coordinador', 'Profesor', 'Estudiante', 'Externo'];

  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eliminandoId = signal<number | null>(null);
  readonly filtroRol = signal<RolNombre | null>(null);
  readonly pagina = signal(1);

  readonly filtrados = computed(() => {
    const rol = this.filtroRol();
    const lista = this.usuarios();
    return rol ? lista.filter((u) => u.rol.nombre_rol === rol) : lista;
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / PAGE_SIZE)));

  readonly paginaActual = computed(() => {
    const inicio = (Math.min(this.pagina(), this.totalPaginas()) - 1) * PAGE_SIZE;
    return this.filtrados().slice(inicio, inicio + PAGE_SIZE);
  });

  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuariosService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('usuarios.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  setFiltroRol(rol: RolNombre | null): void {
    this.filtroRol.set(rol);
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
  }

  iniciales(u: UsuarioAdmin): string {
    return `${u.nombres?.charAt(0) ?? ''}${u.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  }

  crear(): void {
    this.router.navigate(['/admin/usuarios/crear']);
  }

  editar(id: number): void {
    this.router.navigate(['/admin/usuarios', id, 'editar']);
  }

  async suspender(usuario: UsuarioAdmin): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: usuario.activo ? 'usuarios.suspenderTitulo' : 'usuarios.reactivarTitulo',
      message: this.translate.instant(
        usuario.activo ? 'usuarios.suspenderMensaje' : 'usuarios.reactivarMensaje',
        { nombre: `${usuario.nombres} ${usuario.apellidos}` },
      ),
      confirmKey: usuario.activo ? 'usuarios.suspender' : 'usuarios.reactivar',
      cancelKey: 'common.cancelar',
      destructive: usuario.activo,
    });
    if (!ok) return;

    this.usuariosService.suspender(usuario.id_usuario).subscribe({
      next: () => {
        this.toast.success(usuario.activo ? 'usuarios.exitoSuspender' : 'usuarios.exitoReactivar');
        this.cargar();
      },
      error: () => this.error.set('usuarios.errorSuspender'),
    });
  }

  async eliminar(usuario: UsuarioAdmin): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'usuarios.eliminarTitulo',
      message: this.translate.instant('usuarios.eliminarMensaje', {
        nombre: `${usuario.nombres} ${usuario.apellidos}`,
      }),
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.eliminandoId.set(usuario.id_usuario);
    this.usuariosService.eliminar(usuario.id_usuario).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.toast.success('usuarios.exitoEliminar');
        this.cargar();
      },
      error: () => {
        this.eliminandoId.set(null);
        this.error.set('usuarios.errorEliminar');
      },
    });
  }

  trackById(_: number, item: UsuarioAdmin): number {
    return item.id_usuario;
  }
}
