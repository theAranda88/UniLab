---
applyTo: "unilab_front/**"
---

# Frontend — Angular 17+ (Standalone Components)

## Stack objetivo

- Angular 17+ con **standalone components** (sin NgModules, no se crean módulos nuevos).
- Angular Signals para estado local y derivado (`signal()`, `computed()`, `effect()`).
- `@if` / `@for` / `@switch` — control flow moderno de Angular 17+ (no `*ngIf` ni `*ngFor`).
- Angular Reactive Forms (`FormBuilder`, `FormGroup`, `FormControl`).
- HttpClient con tipos genéricos (`http.get<TipoRespuesta>(...)`). Nunca uses `any`.
- SCSS con custom properties CSS para variables de diseño.

## Estructura de carpetas

```
unilab_front/src/
  app/
    core/                        ← servicios globales singleton, interceptors, guards base
      auth/
        auth.service.ts
        auth.guard.ts            ← guard parametrizable por rol
      http/
        api-error.interceptor.ts ← interceptor global de errores HTTP
      models/                    ← interfaces TypeScript que reflejan el modelo del back
    features/                    ← una carpeta por dominio funcional
      usuarios/
        usuarios.service.ts
        usuarios-list/
          usuarios-list.component.ts
          usuarios-list.component.html
          usuarios-list.component.scss
        usuarios-form/
          ...
      proyectos/
        ...
      semilleros/
        ...
      eventos/
        ...
    shared/                      ← componentes reutilizables sin lógica de negocio
      ui/
        tabla/
        modal/
        boton/
        badge-rol/
    app.routes.ts                ← routing raíz con lazy loading por feature
    app.config.ts                ← provideRouter, provideHttpClient, interceptors
    app.component.ts
  styles/
    _variables.scss              ← custom properties CSS y tokens de diseño
    _mixins.scss
    styles.scss                  ← importa variables y estilos globales
```

## Reglas de componentes

- Todo componente es **standalone**: `standalone: true` en el decorador.
- Imports del componente solo incluyen lo que el template necesita (no "import everything").
- Sin lógica compleja en el template. Si necesitas más de una expresión para un valor, declara una propiedad computada o método en el TypeScript del componente.
- Inputs y Outputs bien tipados: `input<Tipo>()` (signal-based, Angular 17.1+) o `@Input() nombre: Tipo` si aplica.
- Sin `any` en ningún tipo. Si el tipo viene del backend, crea la interfaz en `core/models/`.

```typescript
// Ejemplo componente correcto
@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent {
  private usuariosService = inject(UsuariosService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => {}, // el interceptor global maneja la notificación
      complete: () => this.cargando.set(false),
    });
  }
}
```

## Reglas de servicios

- Un service por dominio funcional: `UsuariosService`, `ProyectosService`, etc.
- Inyectados con `inject()` (no constructor injection salvo casos excepcionales).
- `providedIn: 'root'` para servicios singleton (auth, usuario actual).
- Los servicios de feature no tienen `providedIn` — se proveen en el componente raíz del feature o en el route config.
- Cada service encapsula las URLs base de su dominio. Sin URLs hardcodeadas fuera del service.

```typescript
// Servicio correcto
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = '/api/usuarios';

  listar(filtroRol?: string): Observable<Usuario[]> {
    const params = filtroRol ? { rol: filtroRol } : {};
    return this.http.get<Usuario[]>(this.base, { params });
  }

  crear(data: CrearUsuarioDto): Observable<{ usuario: Usuario; password_temporal: string }> {
    return this.http.post<{ usuario: Usuario; password_temporal: string }>(this.base, data);
  }
}
```

## Interfaces TypeScript (modelos)

Ubicación: `src/app/core/models/`. Un archivo por dominio. Reflejan exactamente el shape que devuelve el backend.

```typescript
// core/models/usuario.model.ts
export interface Usuario {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string;
  activo: boolean;
  primer_login: boolean;
  rol: { id_rol: number; nombre_rol: string };
  created_at: string;
}

export interface CrearUsuarioDto {
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string;
  rol: 'Administrador' | 'Coordinador' | 'Profesor' | 'Estudiante' | 'Externo';
  // campos opcionales de perfil...
}
```

## Auth Guard — un solo guard parametrizable

```typescript
// core/auth/auth.guard.ts
export const authGuard = (rolesPermitidos: string[]) =>
  (): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) return router.createUrlTree(['/login']);
    if (!rolesPermitidos.includes(authService.rolActual())) {
      return router.createUrlTree(['/sin-permiso']);
    }
    return true;
  };

// Uso en routes:
{
  path: 'usuarios',
  canActivate: [authGuard(['Administrador'])],
  loadComponent: () => import('./features/usuarios/...')
}
```

No se crea un guard por cada rol. Un único guard con parámetro de rol.

## Interceptor global de errores HTTP

```typescript
// core/http/api-error.interceptor.ts
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Extrae el mensaje del backend ({ error: '...' }) o usa uno genérico
      const mensaje = error.error?.error ?? 'Error de comunicación con el servidor';
      // Notifica via un NotificationService o similar (no alert())
      inject(NotificationService).error(mensaje);
      if (error.status === 401) inject(Router).navigate(['/login']);
      return throwError(() => error);
    })
  );
```

Registrado en `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([apiErrorInterceptor]))
```

## Routing — lazy loading obligatorio

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
  {
    path: 'admin',
    canActivate: [authGuard(['Administrador'])],
    children: [
      { path: 'usuarios', loadComponent: () => import('./features/usuarios/usuarios-list/...') },
    ]
  }
];
```

Cada feature se carga con `loadComponent` o `loadChildren`. Sin imports estáticos de componentes de features en el routing raíz.

## Estilos — reglas críticas

- **Sin estilos inline** en templates: nada de `style="color: red"` ni `[style.color]="'red'"`.
- **Sin valores mágicos** en SCSS de componentes: usa las custom properties definidas en `styles/_variables.scss`.
- **Sin `!important`** salvo casos de override de librerías externas, con comentario explicativo.
- Variables de diseño centralizadas:

```scss
// styles/_variables.scss
:root {
  --color-primary: #1a3a5c;
  --color-secondary: #e8a020;
  --color-danger: #c0392b;
  --color-success: #27ae60;
  --color-text: #2c3e50;
  --color-bg: #f5f6fa;
  --color-surface: #ffffff;
  --border-radius-base: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

## Formularios — Reactive Forms

- Usa `FormBuilder` inyectado via `inject(FormBuilder)`.
- Validadores de Angular para los campos comunes; validadores custom para reglas de negocio específicas.
- Los errores de validación se muestran con un helper de template reutilizable, no con lógica inline en cada campo.
- Nunca uses Template-Driven Forms (`ngModel`) para formularios con lógica de negocio.

## AuthService — contrato mínimo

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private token = signal<string | null>(localStorage.getItem('token'));
  private usuario = signal<UsuarioSesion | null>(null);

  isAuthenticated(): boolean { return !!this.token(); }
  rolActual(): string { return this.usuario()?.id_rol ?? ''; }
  primerLogin(): boolean { return this.usuario()?.primer_login ?? false; }
  obtenerToken(): string | null { return this.token(); }

  login(email: string, password: string): Observable<LoginResponse> { ... }
  logout(): void { ... }
}
```

El token se agrega a las peticiones via un `authInterceptor` que lee del `AuthService`, no hardcodeado en cada service de dominio.

## Convenciones de nomenclatura

- Componentes: `PascalCase` + sufijo `Component`. Archivos: `kebab-case.component.ts`.
- Services: `PascalCase` + sufijo `Service`. Archivos: `kebab-case.service.ts`.
- Interfaces: `PascalCase` sin sufijo especial. DTOs: `PascalCase` + sufijo `Dto`.
- Variables en templates: `camelCase`, descriptivas en español.
- Selectores de componentes: `app-nombre-en-kebab` para componentes de app, `ui-nombre` para componentes de `shared/ui/`.

## Lo que NO hacer

- No crees `NgModule`. Todo es standalone.
- No uses `*ngIf` ni `*ngFor` — usa `@if` y `@for` (Angular 17+).
- No uses `subscribe()` en el constructor — usa `ngOnInit` o efectos con signals.
- No expongas `BehaviorSubject` directamente — usa signals o `asObservable()`.
- No hagas llamadas HTTP directamente en componentes — siempre via service.
- No uses `any` en ningún tipo — crea la interfaz correspondiente.
- No crees un guard por cada rol — parametriza `authGuard`.

## Internacionalización (i18n) — Estándar Obligatorio

### Por qué i18n

**Regla de oro**: **NUNCA hardcodees textos en templates o componentes**. Todo texto visible al usuario debe estar en archivos de traducción.

Usar i18n permite:
- Cambiar textos sin tocar código
- Soportar múltiples idiomas fácilmente
- Facilitar QA y testing
- Consistencia de mensajes en toda la app

### Stack de i18n

- **@ngx-translate/core**: gestor de traducciones
- **@ngx-translate/http-loader**: carga traducciones desde JSON
- Archivos de traducción: `src/assets/i18n/<idioma>.json`

### Estructura

```
src/assets/i18n/
  es.json          ← español (idioma por defecto)
  en.json          ← inglés

src/app/core/i18n/
  i18n.service.ts           ← servicio de gestión de idioma
  i18n.providers.ts         ← proveedores para app.config.ts
```

### Archivo de traducción (es.json)

Organiza por módulo/feature:

```json
{
  "auth": {
    "login": {
      "title": "UniLab",
      "email": "Correo Electrónico",
      "emailPlaceholder": "Ej: estudiante@uniautónoma.edu"
    },
    "cambiarPassword": {
      "title": "Cambiar Contraseña",
      "nuevaPassword": "Nueva Contraseña",
      "passwordsMismatch": "Las contraseñas no coinciden"
    }
  },
  "dashboard": {
    "title": "UniLab - Dashboard",
    "welcome": "Bienvenido,",
    "logout": "Cerrar Sesión"
  },
  "common": {
    "error": "Error",
    "success": "Éxito",
    "loading": "Cargando..."
  }
}
```

### Uso en componentes

**Template** — Usa el pipe `translate`:

```html
<!-- ✅ CORRECTO: Usa translate pipe -->
<h1>{{ 'auth.login.title' | translate }}</h1>
<button>{{ 'common.save' | translate }}</button>
<input [placeholder]="'auth.login.emailPlaceholder' | translate" />

<!-- ❌ INCORRECTO: Hardcoded -->
<h1>Portal Estudiantil</h1>
<button>Guardar</button>
<input placeholder="Correo..." />
```

**Component TypeScript** — Cuando necesites texto en la lógica:

```typescript
import { TranslateService } from '@ngx-translate/core';

export class MiComponent {
  private translate = inject(TranslateService);

  ngOnInit() {
    this.translate.get('common.error').subscribe(
      (msg) => this.mostrarAlerta(msg)
    );
  }

  // O para cambiar idioma
  cambiarIdioma(idioma: string) {
    this.i18nService.setLanguage(idioma); // i18nService maneja automáticamente
  }
}
```

### I18nService — Gestor centralizado

```typescript
@Injectable({ providedIn: 'root' })
export class I18nService {
  private defaultLanguage = 'es';
  private supportedLanguages = ['es', 'en'];

  constructor(private translateService: TranslateService) {}

  initialize(): void {
    const savedLanguage = localStorage.getItem('unilab_language');
    const langToUse = this.validateLanguage(savedLanguage || this.defaultLanguage);
    this.translateService.setDefaultLanguage(this.defaultLanguage);
    this.setLanguage(langToUse);
  }

  setLanguage(lang: string): void {
    const validLang = this.validateLanguage(lang);
    this.translateService.use(validLang);
    localStorage.setItem('unilab_language', validLang);
  }

  getCurrentLanguage(): string {
    return this.translateService.currentLanguage || this.defaultLanguage;
  }

  private validateLanguage(lang: string): string {
    return this.supportedLanguages.includes(lang) ? lang : this.defaultLanguage;
  }
}
```

### Configuración en app.config.ts

```typescript
import { i18nProviders } from './core/i18n/i18n.providers';
import { TranslateModule } from '@ngx-translate/core';
import { importProvidersFrom } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(TranslateModule.forRoot()),
    ...i18nProviders
  ]
};
```

### Importar TranslateModule en componentes

```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule], // ← Importa TranslateModule
  templateUrl: './login.component.html'
})
export class LoginComponent { }
```

### Agregando nuevos idiomas

1. Crea archivo `src/assets/i18n/<idioma>.json` con las mismas keys que `es.json`
2. Agrega el idioma a `supportedLanguages` en `I18nService`
3. Opcional: Crea componente language-selector para cambiar idioma

### Checklist antes de completar una feature

- [ ] Todo texto visible está en archivos JSON de i18n
- [ ] Templates usan `{{ 'key' | translate }}`
- [ ] Componentes importan `TranslateModule`
- [ ] Si hay diálogos/errores dinámicos, usa `TranslateService.get()`
- [ ] Nuevos textos se agregaron a AMBOS idiomas (es.json y en.json)
- [ ] No hay `any` strings en templates

