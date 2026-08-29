---
name: frontend-crud
description: Crea UI Angular para consumir un CRUD backend existente (service, listado, formulario, i18n, rutas). Usar cuando el usuario pide frontend-crud o interfaz para un modelo backend ya implementado.
---

# Skill: Frontend CRUD Simple

## Descripción
Crear un nuevo módulo frontend para consumir un modelo backend existente con operaciones CRUD básicas.

**Incluye:** Service HttpClient → Componente de Listado → Componente de Formulario → i18n → Integración en rutas

---

## Cuándo Usarlo

✅ **Usar este skill si:**
- Backend CRUD ya existe y funciona (endpoints GET, POST, PUT, DELETE)
- Necesitas interfaz para crear, listar, editar, eliminar (CRUD básico)
- La lógica de UI es directa (listado de tabla + modal/formulario)
- Sin interacciones multi-paso complejas

❌ **NO usar si:**
- El backend aún no existe → usa `backend-crud` primero
- UI compleja con múltiples pasos, validaciones anidadas → usa `frontend-feature`
- Es un fix de UI → usa `debug-fix`

---

## Entrada Conversacional Esperada

```
"Necesito frontend para [MODELO]. 
Campos a mostrar en listado: [CAMPO1, CAMPO2, ...].
Campos a editar en formulario: [CAMPO1, CAMPO2, ...].
Permisos/accesos: [SOLO ROL X PUEDE CREAR?, etc].
Filtros especiales?: [SI/NO y cuáles]."
```

### Ejemplo Concreto
```
"Necesito frontend para Evento (backend ya hecho).
Listado mostrar: nombre, fecha_evento, ubicacion, capacidad.
Formulario editar: nombre, descripcion, fecha_evento, ubicacion, capacidad.
Permisos: solo Coordinador y Administrador pueden crear/editar.
Filtros: por fecha (próximos eventos)."
```

---

## Proceso SDD

### 1️⃣ **SPEC** (Agent Guía)

Agent presentará en 1 párrafo:
- **Qué:** componentes (listado, formulario, modal)
- **Dónde:** módulo en carpeta `features/[modelo]`
- **Quién:** roles que ven qué (botón crear solo si rol autorizado)
- **Campos:** qué se muestra, qué se edita
- **Filtros:** búsqueda, paginación, filtros especiales
- **i18n:** namespaces de traducciones a usar
- **Rutas:** lazy loading, URL para acceder

**Agent espera tu confirmación.**

### 2️⃣ **CONFIRMACIÓN** (Usuario)

Confirma o ajusta. Si necesitas clarificación:
- Agent hace UNA pregunta específica
- No avanza sin certeza

### 3️⃣ **IMPLEMENTACIÓN Frontend** (Agent Ejecuta)

#### 🔹 Paso 1: Crear Interfaz de Modelo
Archivo: `unilab_front/src/app/core/models/[modelo].model.ts`

```typescript
export interface [Modelo] {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaEvento: Date;
  ubicacion: string;
  capacidad: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  deletedAt?: Date;
}

export interface [Modelo]CreateInput {
  nombre: string;
  descripcion?: string;
  fechaEvento: Date;
  ubicacion: string;
  capacidad: number;
}

export type [Modelo]UpdateInput = Partial<[Modelo]CreateInput>;
```

#### 🔹 Paso 2: Crear Service
Archivo: `unilab_front/src/app/features/[modelos]/[modelo].service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { [Modelo], [Modelo]CreateInput, [Modelo]UpdateInput } from '../../core/models/[modelo].model';

@Injectable({ providedIn: 'root' })
export class [Modelo]Service {
  private http = inject(HttpClient);
  private baseUrl = '/api/[modelos]';

  listar(pagina?: number, tamanio?: number, filtros?: any): Observable<[Modelo][]> {
    let params = new HttpParams();
    if (pagina) params = params.set('pagina', pagina);
    if (tamanio) params = params.set('tamanio', tamanio);
    // Agregar filtros dinámicos
    return this.http.get<[Modelo][]>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<[Modelo]> {
    return this.http.get<[Modelo]>(`${this.baseUrl}/${id}`);
  }

  crear(data: [Modelo]CreateInput): Observable<[Modelo]> {
    return this.http.post<[Modelo]>(this.baseUrl, data);
  }

  actualizar(id: number, data: [Modelo]UpdateInput): Observable<[Modelo]> {
    return this.http.put<[Modelo]>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

#### 🔹 Paso 3: Crear Componente de Listado
Archivo: `unilab_front/src/app/features/[modelos]/[modelo]-list/[modelo]-list.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { [Modelo]Service } from '../[modelo].service';
import { [Modelo] } from '../../../core/models/[modelo].model';
import { signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-[modelo]-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="container">
      <h1>{{ '[modelo]s.title' | translate }}</h1>
      <button (click)="abrirFormulario()">{{ '[modelo]s.create' | translate }}</button>
      
      <table>
        <thead>
          <tr>
            <th>{{ '[modelo]s.nombre' | translate }}</th>
            <th>{{ '[modelo]s.fecha' | translate }}</th>
            <th>{{ '[modelo]s.acciones' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (item of [modelos](); track item.id) {
            <tr>
              <td>{{ item.nombre }}</td>
              <td>{{ item.fechaEvento | date: 'short' }}</td>
              <td>
                <button (click)="editar(item.id)">{{ '[modelo]s.edit' | translate }}</button>
                <button (click)="eliminar(item.id)">{{ '[modelo]s.delete' | translate }}</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class [Modelo]ListComponent implements OnInit {
  private service = inject([Modelo]Service);
  [modelos] = signal<[Modelo][]>([]);
  cargando = signal(false);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (data) => this.[modelos].set(data),
      error: () => this.cargando.set(false),
      complete: () => this.cargando.set(false)
    });
  }

  abrirFormulario() {
    // Abrir modal de crear (ver componente formulario)
  }

  editar(id: number) {
    // Abrir modal de editar
  }

  eliminar(id: number) {
    if (confirm('¿Confirmar eliminación?')) {
      this.service.eliminar(id).subscribe(() => this.cargar());
    }
  }
}
```

#### 🔹 Paso 4: Crear Componente de Formulario
Archivo: `unilab_front/src/app/features/[modelos]/[modelo]-form/[modelo]-form.component.ts`

```typescript
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { [Modelo]Service } from '../[modelo].service';
import { [Modelo] } from '../../../core/models/[modelo].model';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-[modelo]-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <div>
        <label>{{ '[modelo]s.nombre' | translate }}</label>
        <input type="text" formControlName="nombre" required />
      </div>
      
      <div>
        <label>{{ '[modelo]s.descripcion' | translate }}</label>
        <textarea formControlName="descripcion"></textarea>
      </div>
      
      <div>
        <label>{{ '[modelo]s.fecha' | translate }}</label>
        <input type="datetime-local" formControlName="fechaEvento" required />
      </div>
      
      <button type="submit" [disabled]="!form.valid">
        {{ esEdicion ? '[modelo]s.update' : '[modelo]s.create' | translate }}
      </button>
    </form>
  `
})
export class [Modelo]FormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject([Modelo]Service);

  [modelo]Id = input<number | null>(null);
  guardarCompleto = output<[Modelo]>();

  form!: FormGroup;
  esEdicion = false;

  ngOnInit() {
    this.inicializarForm();
    if (this.[modelo]Id()) {
      this.cargarParaEditar(this.[modelo]Id()!);
    }
  }

  inicializarForm() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      fechaEvento: ['', Validators.required],
      ubicacion: ['', Validators.required],
      capacidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  cargarParaEditar(id: number) {
    this.esEdicion = true;
    this.service.obtener(id).subscribe({
      next: ([modelo]) => this.form.patchValue([modelo])
    });
  }

  guardar() {
    if (!this.form.valid) return;

    const data = this.form.value;
    const op$ = this.esEdicion 
      ? this.service.actualizar(this.[modelo]Id()!, data)
      : this.service.crear(data);

    op$.subscribe({
      next: (resultado) => this.guardarCompleto.emit(resultado),
      error: (err) => console.error(err)
    });
  }
}
```

#### 🔹 Paso 5: Agregar i18n
Actualizar: `unilab_front/src/assets/i18n/es.json`

```json
{
  "[modelo]s": {
    "title": "Gestión de [Modelos]",
    "create": "Crear [Modelo]",
    "edit": "Editar",
    "delete": "Eliminar",
    "update": "Actualizar",
    "nombre": "Nombre",
    "descripcion": "Descripción",
    "fecha": "Fecha",
    "ubicacion": "Ubicación",
    "capacidad": "Capacidad",
    "acciones": "Acciones"
  }
}
```

Lo mismo en `en.json`

#### 🔹 Paso 6: Integrar en Rutas
Archivo: `unilab_front/src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  // ... otras rutas
  {
    path: '[modelos]',
    loadComponent: () => import('./features/[modelos]/[modelo]-list.component')
      .then(m => m.[Modelo]ListComponent),
    data: { roles: ['Coordinador', 'Administrador', 'Profesor'] }
  }
];
```

### 4️⃣ **VALIDACIÓN** (Agent + Usuario)

Agent compila frontend:
```bash
npm run build
```

Pruebas funcionales:
- ✅ Listado se carga: GET `/api/[modelos]` retorna datos
- ✅ Tabla muestra registros correctamente
- ✅ Botón crear abre formulario
- ✅ Crear nuevo registro: POST funciona, registro aparece en listado
- ✅ Editar: modal carga datos, actualiza correctamente
- ✅ Eliminar: soft-delete funciona, registro desaparece del listado
- ✅ Textos en español: i18n funciona
- ✅ Validaciones en formulario: campos requeridos funcionan
- ✅ Permisos: botón crear no visible si usuario no autorizado

---

## Checklist de Salida

- [ ] Interfaz TypeScript creada en `core/models`
- [ ] Service HttpClient creado con métodos CRUD
- [ ] Componente listado con Signals y @for
- [ ] Componente formulario con reactive forms
- [ ] Validaciones Zod/HTML en formulario
- [ ] i18n claves agregadas a es.json y en.json
- [ ] Rutas integradas en app.routes.ts
- [ ] Frontend compila: `npm run build`
- [ ] Listado se carga correctamente
- [ ] CRUD completo funciona (create, read, update, delete)
- [ ] Textos en español

---

## No Incluye Este Skill

❌ Backend (debe existir ya)  
❌ Tests unitarios  
❌ UI compleja/multi-paso (usar `frontend-feature`)

---

## Tips & Trampas Comunes

⚠️ **HttpClient retorna Observable, no Promise** — Usa `.subscribe()` o `async` pipe  
⚠️ **Olvidar TranslatePipe en imports** — El template fallará si no está  
⚠️ **Signals vs tradicional** — Usa `signal()` para estado, NO variables mutables  
⚠️ **Formulario no se resetea** — Llama a `form.reset()` después de guardar  
⚠️ **Rutas no registradas** — Si componente no aparece, verifica app.routes.ts

---

**¿Listo? Sigue el formato de entrada en el chat y comienza el SDD.**
