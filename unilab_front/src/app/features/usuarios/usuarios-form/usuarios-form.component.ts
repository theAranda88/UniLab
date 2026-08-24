import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UsuariosService } from '../usuarios.service';
import { EscuelasService } from '../../escuelas/escuelas.service';
import type { RolNombre } from '../../../core/models/usuario.model';
import type { EscuelaAdmin } from '../../../core/models/escuela.model';

const ROLES: RolNombre[] = [
  'Administrador',
  'Coordinador',
  'Profesor',
  'Estudiante',
  'Externo',
];

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './usuarios-form.component.html',
  styleUrl: './usuarios-form.component.scss',
})
export class UsuariosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private escuelasService = inject(EscuelasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly modoEdicion = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly tempPassword = signal<string | null>(null);
  readonly escuelas = signal<EscuelaAdmin[]>([]);
  readonly roles = ROLES;

  private idUsuario: number | null = null;
  private rolInicial: RolNombre | null = null;

  readonly form = this.fb.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    documento_identidad: ['', Validators.required],
    telefono: ['', Validators.required],
    rol: ['Estudiante' as RolNombre, Validators.required],
    codigo_docente: [''],
    codigo_estudiantil: [''],
    id_escuela: [null as number | null],
    cargo: [''],
    dependencia: [''],
    institucion: [''],
    ocupacion: [''],
  });

  ngOnInit(): void {
    this.escuelasService.listar().subscribe({
      next: (data) => this.escuelas.set(data),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idUsuario = Number(idParam);
      this.cargar(this.idUsuario);
    } else {
      this.aplicarValidadoresRol(this.form.controls.rol.value);
    }

    this.form.controls.rol.valueChanges.subscribe((rol) => this.aplicarValidadoresRol(rol));
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.usuariosService.obtener(id).subscribe({
      next: (usuario) => {
        this.rolInicial = usuario.rol.nombre_rol;
        this.form.patchValue({
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          email: usuario.email,
          documento_identidad: usuario.documento_identidad,
          telefono: usuario.telefono,
          rol: usuario.rol.nombre_rol,
        });
        this.aplicarValidadoresRol(usuario.rol.nombre_rol);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('usuarios.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  private aplicarValidadoresRol(rol: RolNombre): void {
    const fields = {
      codigo_docente: this.form.controls.codigo_docente,
      codigo_estudiantil: this.form.controls.codigo_estudiantil,
      id_escuela: this.form.controls.id_escuela,
      cargo: this.form.controls.cargo,
      dependencia: this.form.controls.dependencia,
      institucion: this.form.controls.institucion,
      ocupacion: this.form.controls.ocupacion,
    };

    Object.values(fields).forEach((ctrl) => ctrl.clearValidators());

    switch (rol) {
      case 'Profesor':
        fields.codigo_docente.setValidators([Validators.required]);
        fields.id_escuela.setValidators([Validators.required]);
        break;
      case 'Estudiante':
        fields.codigo_estudiantil.setValidators([Validators.required]);
        fields.id_escuela.setValidators([Validators.required]);
        break;
      case 'Coordinador':
        fields.cargo.setValidators([Validators.required]);
        fields.dependencia.setValidators([Validators.required]);
        break;
      case 'Externo':
        fields.institucion.setValidators([Validators.required]);
        fields.ocupacion.setValidators([Validators.required]);
        break;
    }

    Object.values(fields).forEach((ctrl) => ctrl.updateValueAndValidity());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      nombres: raw.nombres,
      apellidos: raw.apellidos,
      email: raw.email,
      documento_identidad: raw.documento_identidad,
      telefono: raw.telefono,
      rol: raw.rol,
      ...(raw.rol === 'Profesor'
        ? { codigo_docente: raw.codigo_docente, id_escuela: Number(raw.id_escuela) }
        : {}),
      ...(raw.rol === 'Estudiante'
        ? { codigo_estudiantil: raw.codigo_estudiantil, id_escuela: Number(raw.id_escuela) }
        : {}),
      ...(raw.rol === 'Coordinador' ? { cargo: raw.cargo, dependencia: raw.dependencia } : {}),
      ...(raw.rol === 'Externo' ? { institucion: raw.institucion, ocupacion: raw.ocupacion } : {}),
    };

    this.enviando.set(true);
    this.error.set(null);

    if (this.modoEdicion() && this.idUsuario) {
      const rolCambia = this.rolInicial && raw.rol !== this.rolInicial;
      if (rolCambia) {
        Object.assign(payload, { rol: raw.rol });
      } else {
        delete (payload as { rol?: RolNombre }).rol;
      }

      this.usuariosService.actualizar(this.idUsuario, payload).subscribe({
        next: () => {
          this.enviando.set(false);
          this.router.navigate(['/admin/usuarios']);
        },
        error: () => {
          this.enviando.set(false);
          this.error.set('usuarios.errorActualizar');
        },
      });
      return;
    }

    this.usuariosService.crear(payload).subscribe({
      next: (response) => {
        this.enviando.set(false);
        this.tempPassword.set(response.password_temporal);
      },
      error: () => {
        this.enviando.set(false);
        this.error.set('usuarios.errorCrear');
      },
    });
  }

  continuarTrasCrear(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  cancelar(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  rolActual(): RolNombre {
    return this.form.controls.rol.value;
  }
}
