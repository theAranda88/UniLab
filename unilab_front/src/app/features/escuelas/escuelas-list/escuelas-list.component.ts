import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EscuelasService } from '../escuelas.service';
import type { EscuelaAdmin } from '../../../core/models/escuela.model';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';

@Component({
  selector: 'app-escuelas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './escuelas-list.component.html',
  styleUrl: './escuelas-list.component.scss',
})
export class EscuelasListComponent implements OnInit {
  private escuelasService = inject(EscuelasService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);

  readonly escuelas = signal<EscuelaAdmin[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  readonly puedeGestionar = this.escuelasService.puedeGestionar();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.escuelasService.listar().subscribe({
      next: (data) => {
        this.escuelas.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('escuelas.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.router.navigate([this.escuelasService.getBasePath(), 'crear']);
  }

  editar(id: number): void {
    this.router.navigate([this.escuelasService.getBasePath(), id, 'editar']);
  }

  async eliminar(escuela: EscuelaAdmin): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'escuelas.eliminarTitulo',
      message: this.translate.instant('escuelas.eliminarMensaje', {
        nombre: escuela.nombre_escuela,
      }),
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.eliminandoId.set(escuela.id_escuela);
    this.escuelasService.eliminar(escuela.id_escuela).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargar();
      },
      error: () => {
        this.eliminandoId.set(null);
        this.error.set('escuelas.errorEliminar');
      },
    });
  }

  trackById(_: number, item: EscuelaAdmin): number {
    return item.id_escuela;
  }
}
