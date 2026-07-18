import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EscuelasService } from '../escuelas.service';

@Component({
  selector: 'app-escuelas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './escuelas-form.component.html',
  styleUrl: './escuelas-form.component.scss',
})
export class EscuelasFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private escuelasService = inject(EscuelasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly modoEdicion = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  private idEscuela: number | null = null;

  readonly formulario = this.fb.nonNullable.group({
    nombre_escuela: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idEscuela = Number(idParam);
      this.cargar(this.idEscuela);
    }
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.escuelasService.obtener(id).subscribe({
      next: (escuela) => {
        this.formulario.patchValue({ nombre_escuela: escuela.nombre_escuela });
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('escuelas.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  submit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const payload = this.formulario.getRawValue();
    const base = this.escuelasService.getBasePath();

    const request$ =
      this.modoEdicion() && this.idEscuela
        ? this.escuelasService.actualizar(this.idEscuela, payload)
        : this.escuelasService.crear(payload);

    request$.subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate([base]);
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
