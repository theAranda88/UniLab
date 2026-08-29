---
name: backend-to-frontend-integration
description: Analiza backend existente y genera frontend con permisos diferenciados por rol. Usar cuando el backend está completo y se necesita UI integrada con validación cruzada de permisos.
---

# Skill: Backend → Frontend Integration

## Descripción
**Integración coordinada entre backend existente y frontend nuevo.**

Tomas un módulo backend COMPLETAMENTE IMPLEMENTADO, analizas sus endpoints + permisos por rol, y generas el frontend adecuado que lo consume correctamente, respetando cada restricción de rol.

**Incluye:** Análisis de backend → Extracción de permisos → Service HttpClient → Componentes por rol → i18n → Validación cruzada

---

## Cuándo Usarlo

✅ **Usar este skill si:**
- Backend COMPLETAMENTE FUNCIONAL existe (endpoints, validaciones, permisos)
- Necesitas frontend que lo consume
- Hay diferentes permisos por rol (Admin, Profesor, Estudiante, etc.)
- Necesitas UI diferenciada según rol (botones, campos, secciones distintas)
- Quieres asegurar que frontend respeta permisos backend

❌ **NO usar si:**
- Backend aún no existe → usa `backend-crud`
- Backend existe pero es CRUD simple → usa `frontend-crud`
- Solo necesitas consumir sin rol diferenciado → usa `frontend-crud`
- Es debug de error → usa `debug-fix`

---

## Entrada Conversacional Esperada

**Opción A: Con descripción**
```
"Necesito: backend-to-frontend-integration

Módulo: [NOMBRE] (ej: Eventos)
Backend: Ya implementado en [RUTA]
Estructura: [BREVE DESCRIPCIÓN DE ENDPOINTS]

Roles y permisos:
- Admin: puede [ACCIONES]
- Coordinador: puede [ACCIONES]
- Profesor: puede [ACCIONES]
- Estudiante: puede [ACCIONES]
- Externo: puede [ACCIONES] (o si es limitado)

UI esperada: [DESCRIPCIÓN O IMAGEN]"
```

**Opción B: Con imagen (RECOMENDADO)**
```
"Necesito: backend-to-frontend-integration

Módulo: Eventos
Comparte imagen (mockup/wireframe) de cómo debe verse
Roles: Admin, Coordinador, Profesor, Estudiante (Externo sin acceso)
"
```

### Ejemplo Concreto (Eventos)

```
"Necesito: backend-to-frontend-integration

Módulo: Eventos
Backend: unilab_back/src/controllers/evento.controller.ts (ya funcional)

Endpoints:
- GET /api/eventos → Todos autenticados
- GET /api/eventos/:id → Todos autenticados
- POST /api/eventos → Solo Admin
- POST /api/eventos/:id/jornadas → Solo Admin
- POST /api/eventos/:id/inscripciones → Todos autenticados
- GET /api/eventos/:id/reportes → Admin + Coordinador

Roles:
- Admin: Crear evento, crear jornadas, ver reportes
- Coordinador: Listar, ver reportes
- Profesor: Listar, obtener, inscribirse
- Estudiante: Listar, obtener, inscribirse
- Externo: Listar, obtener, inscribirse

UI esperada:
- Listado de eventos (todos ven)
- Botón crear (solo Admin)
- Detalle de evento (todos ven)
- Sección jornadas (solo Admin ve crear)
- Botón inscribirse (todos menos Admin)
- Reporte (Admin + Coordinador)"
```

---

## Proceso SDD

### 1️⃣ **ANÁLISIS DE BACKEND** (Agent Ejecuta)

Agent inspecciona:
```
unilab_back/src/
├── controllers/[modulo].controller.ts → Qué endpoints existen
├── services/[modulo].service.ts → Qué lógica de negocio hay
├── routes/[modulo].routes.ts → Qué roles pueden acceder a cada endpoint
└── middlewares/validation/schemas → Qué validaciones existen
```

Agent reporta:
- ✅ Endpoints encontrados (GET, POST, PUT, DELETE, etc.)
- ✅ Roles permitidos por endpoint (automático desde `requireRole()`)
- ✅ Campos requeridos/opcionales (desde schemas Zod)
- ✅ Relaciones con otras tablas
- ✅ Restricciones especiales (soft-delete, primer_login, etc.)

**⚠️ VALIDACIÓN CRÍTICA: Documentación Backend**

Antes de continuar, VERIFICA que Swagger y Postman existan:
- [ ] Swagger en http://localhost:3000/api-docs (todos los endpoints visibles con ejemplos)
- [ ] Postman en `docs/postman_collection.json` (requests de prueba con variables)

**Si documentación FALTA:**
```
⛔ DETENTE. No puedes hacer frontend sin saber qué hace el backend.
→ Usuario: ejecuta backend-crud skill primero (incluye documentación)
→ Ref: .github/DOCUMENTACION.md
```

**Si documentación está completa:**
```
✅ Procede al Paso 2
```

---

### 2️⃣ **SPEC DE FRONTEND** (Agent + Usuario)

Agent presenta:
```
SPEC: 
Frontend para Eventos consumiendo [N] endpoints.

Componentes por rol:
- Admin: ✅ Crear evento, ✅ Crear jornada, ✅ Ver reportes
- Coordinador: ✅ Listar, ✅ Ver reportes, ❌ Crear
- Profesor: ✅ Listar, ✅ Obtener, ✅ Inscribirse, ❌ Reportes
- Estudiante: ✅ Listar, ✅ Obtener, ✅ Inscribirse, ❌ Reportes
- Externo: ✅ Listar, ✅ Obtener, ✅ Inscribirse, ❌ Reportes

Estructura:
- Componente listado (todos ven, con filtros según rol)
- Componente detalle (todos ven, diferente por rol)
- Modal crear evento (solo Admin)
- Modal crear jornada (solo Admin)
- Botón inscribirse (todos menos Admin)
- Sección reportes (Admin + Coordinador)
- i18n: eventos.listar, eventos.crear, eventos.jornadas, etc.

¿OK?
```

**Usuario confirma o ajusta.**

### 3️⃣ **IMPLEMENTACIÓN FRONTEND** (Agent Ejecuta)

#### 🔹 Paso 1: Crear Interfaz + Model
Archivo: `unilab_front/src/app/core/models/evento.model.ts`

```typescript
export interface Evento {
  id_evento: number;
  nombre_evento: string;
  tipo_evento: string;
  descripcion: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  lugar: string;
  estado: string;
  requiere_pago: boolean;
  id_organizador: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface EventoCreateInput {
  nombre_evento: string;
  tipo_evento: string;
  descripcion: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  lugar: string;
  estado: string;
  requiere_pago?: boolean;
}

// Jornada, Inscripción, etc. (según endpoints)
export interface Jornada {
  id_jornada: number;
  id_evento: number;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  // ...
}
```

#### 🔹 Paso 2: Crear Service con Validación de Roles
Archivo: `unilab_front/src/app/features/eventos/evento.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento, EventoCreateInput, Jornada } from '../../core/models/evento.model';
import { AuthService } from '../../core/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = '/api/eventos';

  // Métodos públicos que respetan permisos
  listar(): Observable<Evento[]> {
    // Todos autenticados pueden listar
    return this.http.get<Evento[]>(this.baseUrl);
  }

  obtener(id: number): Observable<Evento> {
    // Todos autenticados pueden obtener
    return this.http.get<Evento>(`${this.baseUrl}/${id}`);
  }

  crear(data: EventoCreateInput): Observable<Evento> {
    // Solo Admin puede crear — el backend valida, pero frontend también puede bloquear
    const usuario = this.authService.getUsuario();
    if (usuario?.id_rol !== 'Administrador') {
      throw new Error('No tienes permiso para crear eventos');
    }
    return this.http.post<Evento>(this.baseUrl, data);
  }

  crearJornada(eventoId: number, data: any): Observable<Jornada> {
    // Solo Admin puede crear jornadas
    const usuario = this.authService.getUsuario();
    if (usuario?.id_rol !== 'Administrador') {
      throw new Error('No tienes permiso para crear jornadas');
    }
    return this.http.post<Jornada>(`${this.baseUrl}/${eventoId}/jornadas`, data);
  }

  inscribirse(eventoId: number, data: any): Observable<any> {
    // Todos autenticados (menos Admin probablemente) pueden inscribirse
    return this.http.post(`${this.baseUrl}/${eventoId}/inscripciones`, data);
  }

  obtenerReportes(eventoId: number): Observable<any> {
    // Solo Admin + Coordinador pueden ver reportes
    const usuario = this.authService.getUsuario();
    if (!['Administrador', 'Coordinador'].includes(usuario?.id_rol!)) {
      throw new Error('No tienes permiso para ver reportes');
    }
    return this.http.get(`${this.baseUrl}/${eventoId}/reportes`);
  }

  // Helpers para validación en template
  puedeCrear(): boolean {
    const usuario = this.authService.getUsuario();
    return usuario?.id_rol === 'Administrador';
  }

  puedeVerReportes(): boolean {
    const usuario = this.authService.getUsuario();
    return ['Administrador', 'Coordinador'].includes(usuario?.id_rol!);
  }

  puedeInscribirse(): boolean {
    const usuario = this.authService.getUsuario();
    return usuario?.id_rol !== 'Administrador'; // o la lógica que corresponda
  }
}
```

#### 🔹 Paso 3: Componentes por Rol
Archivo: `unilab_front/src/app/features/eventos/evento-list/evento-list.component.ts`

```typescript
@Component({
  selector: 'app-evento-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="container">
      <h1>{{ 'eventos.titulo' | translate }}</h1>

      <!-- Botón crear (solo Admin) -->
      @if (eventoService.puedeCrear()) {
        <button (click)="abrirCrear()">
          {{ 'eventos.crear' | translate }}
        </button>
      }

      <!-- Listado -->
      <table>
        <tr *ngFor="let evento of eventos()">
          <td>{{ evento.nombre_evento }}</td>
          <td>{{ evento.fecha_inicio | date }}</td>
          <td>
            <button (click)="verDetalle(evento.id_evento)">
              {{ 'eventos.ver' | translate }}
            </button>
            
            <!-- Inscribirse (no Admin) -->
            @if (eventoService.puedeInscribirse()) {
              <button (click)="inscribirse(evento.id_evento)">
                {{ 'eventos.inscribirse' | translate }}
              </button>
            }
          </td>
        </tr>
      </table>
    </div>
  `
})
export class EventoListComponent implements OnInit {
  eventoService = inject(EventoService);
  eventos = signal<Evento[]>([]);

  ngOnInit() {
    this.eventoService.listar().subscribe(data => this.eventos.set(data));
  }

  abrirCrear() {
    // Modal para crear
  }

  verDetalle(id: number) {
    // Navegar a detalle
  }

  inscribirse(id: number) {
    // Modal de inscripción
  }
}
```

#### 🔹 Paso 4: Componente Detalle con Diferenciación por Rol
Archivo: `unilab_front/src/app/features/eventos/evento-detail/evento-detail.component.ts`

```typescript
@Component({
  selector: 'app-evento-detail',
  standalone: true,
  template: `
    <div *ngIf="evento()">
      <h2>{{ evento().nombre_evento }}</h2>
      <p>{{ evento().descripcion }}</p>
      <p>{{ 'eventos.fecha' | translate }}: {{ evento().fecha_inicio | date }}</p>

      <!-- Jornadas (solo Admin ve crear) -->
      <section>
        <h3>{{ 'eventos.jornadas' | translate }}</h3>
        @if (eventoService.puedeCrear()) {
          <button (click)="abrirCrearJornada()">
            {{ 'eventos.crearJornada' | translate }}
          </button>
        }
        <ul *ngFor="let jornada of jornadas()">
          <li>{{ jornada.fecha | date }} - {{ jornada.hora_inicio }}</li>
        </ul>
      </section>

      <!-- Reportes (Admin + Coordinador) -->
      @if (eventoService.puedeVerReportes()) {
        <section>
          <h3>{{ 'eventos.reportes' | translate }}</h3>
          <button (click)="cargarReportes()">
            {{ 'eventos.verReporte' | translate }}
          </button>
          <div *ngIf="reporte()">
            <!-- Mostrar datos del reporte -->
          </div>
        </section>
      }

      <!-- Inscribirse (todos menos Admin) -->
      @if (eventoService.puedeInscribirse()) {
        <button (click)="inscribirse()">
          {{ 'eventos.inscribirse' | translate }}
        </button>
      }
    </div>
  `
})
export class EventoDetailComponent implements OnInit {
  eventoService = inject(EventoService);
  route = inject(ActivatedRoute);

  evento = signal<Evento | null>(null);
  jornadas = signal<Jornada[]>([]);
  reporte = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.eventoService.obtener(Number(id)).subscribe(
      data => this.evento.set(data)
    );
  }

  cargarReportes() {
    const id = this.evento()?.id_evento;
    if (id) {
      this.eventoService.obtenerReportes(id).subscribe(
        data => this.reporte.set(data)
      );
    }
  }

  // ... otros métodos
}
```

#### 🔹 Paso 5: i18n Actualizado
Archivo: `unilab_front/src/assets/i18n/es.json`

```json
{
  "eventos": {
    "titulo": "Eventos",
    "crear": "Crear Evento",
    "crearJornada": "Crear Jornada",
    "inscribirse": "Inscribirse",
    "ver": "Ver Detalle",
    "fecha": "Fecha",
    "lugar": "Lugar",
    "jornadas": "Jornadas",
    "reportes": "Reportes",
    "verReporte": "Ver Reporte",
    "permisoNegado": "No tienes permiso para realizar esta acción",
    "inscripcionExitosa": "Inscripción realizada exitosamente"
  }
}
```

#### 🔹 Paso 6: Integración en Rutas
Archivo: `unilab_front/src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  // ...
  {
    path: 'eventos',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/eventos/evento-list.component')
          .then(m => m.EventoListComponent),
        canActivate: [authGuard]
      },
      {
        path: ':id',
        loadComponent: () => import('./features/eventos/evento-detail.component')
          .then(m => m.EventoDetailComponent),
        canActivate: [authGuard]
      }
    ]
  }
];
```

### 4️⃣ **VALIDACIÓN CRUZADA** (Agent Ejecuta)

Agent valida:
- ✅ Endpoints backend accesibles desde frontend
- ✅ Validaciones Zod del backend coinciden con frontend
- ✅ Permisos en frontend COINCIDEN con backend (doble validación)
- ✅ i18n 100% completado
- ✅ Componentes renderean correctamente por rol
- ✅ Frontend compila sin errores

Pruebas:
```
Test 1: Login como Admin
  ✅ Botón "Crear Evento" visible
  ✅ Botón "Ver Reporte" visible
  ✅ POST /api/eventos funciona

Test 2: Login como Profesor
  ❌ Botón "Crear Evento" NO visible (correctamente bloqueado)
  ❌ Botón "Ver Reporte" NO visible (correctamente bloqueado)
  ✅ Botón "Inscribirse" visible
  ✅ POST /api/eventos/:id/inscripciones funciona

Test 3: Login como Estudiante
  ✅ Puede listar eventos
  ✅ Puede inscribirse
  ❌ NO puede crear evento (error 403 si lo intenta desde frontend)

Test 4: Sin autenticación
  ❌ Redirige a login (guard funciona)
```

---

## Checklist de Salida

- [ ] **Backend documentado** (Swagger + Postman validados en Paso 1)
- [ ] Backend completamente analizado (endpoints, roles, permisos extraídos)
- [ ] Model/Interface TypeScript creada
- [ ] Service HttpClient con validaciones de rol
- [ ] Componentes creados por rol (listado, detalle, etc.)
- [ ] Permisos verificados EN SERVICE y en TEMPLATE
- [ ] i18n claves agregadas a es.json y en.json
- [ ] Rutas integradas con lazy loading
- [ ] Frontend compila: `npm run build`
- [ ] Cada rol VE lo que debe ver
- [ ] Cada rol NO VE lo que no debe ver
- [ ] POST/PUT/DELETE bloqueados si rol no autorizado
- [ ] Validación cruzada: frontend vs backend permisos COINCIDEN
- [ ] **Postman actualizado** (si frontend crea nuevos endpoints o modifica flujos)
- [ ] **Swagger actualizado** (si frontend crea nuevos endpoints o modifica flujos)

---

## Casos Límite a Probar

- ¿Qué sucede si usuario intenta manipular permisos via DevTools (cambiar rol en localStorage)? → Backend valida nuevamente
- ¿Qué sucede si backend cambia permisos después de que frontend se cargó? → Siguiente request falla correctamente
- ¿Qué sucede si usuario sin permiso POST a endpoint directamente? → Backend devuelve 403
- ¿Hay soft-delete? → Componentes no muestran registros deleted_at != null

---

## Diferencia con `frontend-crud`

| Aspecto | `frontend-crud` | `backend-to-frontend-integration` |
|--------|-----------------|----------------------------------|
| Entrada | Descripción manual | Analiza backend automáticamente |
| Roles | Asume mismo para todos | Extrae roles de middleware backend |
| Componentes | Genéricos | Diferenciados por rol |
| Validación | Solo Zod | Zod + doble validación permisos |
| Complejidad | Baja | Media-Alta |
| Reusabilidad | Para CRUD simple | Para cualquier backend con roles |

---

## Para Cualquier Módulo Backend

Este skill funciona para **cualquier módulo backend**, no solo Eventos:
- **Proyectos** ← aplica igual
- **Semilleros** ← aplica igual
- **Usuarios** ← aplica igual
- **Cualquier future module** ← aplica igual

Solo necesitas:
1. Backend implementado
2. Roles definidos en `requireRole()`
3. Endpoints funcionales

---

## Tips & Trampas Comunes

⚠️ **Frontend valida, pero backend VALIDA SIEMPRE** — No confíes solo en frontend  
⚠️ **Permisos en service Y en template** — Double-check en ambos lados  
⚠️ **i18n no solo en labels** — Errores de permisos también deben estar traducidos  
⚠️ **Roles no son estáticos** — Si Admin cambia a Profesor en BD, frontend debe reflejarlo en próximo request  
⚠️ **Soft-delete en queries** — Frontend no debería mostrar deleted_at registros  

---

**¿Listo? Sigue el formato de entrada arriba en el chat y comienza el SDD. Agent analizará backend + generará frontend.**
