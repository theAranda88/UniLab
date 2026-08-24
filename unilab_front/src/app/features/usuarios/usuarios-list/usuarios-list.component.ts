import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UsuariosService } from '../usuarios.service';
import type { UsuarioAdmin } from '../../../core/models/usuario.model';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);

  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eliminandoId = signal<number | null>(null);

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
      next: () => this.cargar(),
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
