---
name: auth-flow
description: Implementa o modifica autenticación: login, cambio de contraseña, JWT, roles, primer_login. Usar cuando el usuario pide auth-flow o cambios en auth, permisos o tokens.
---

# Skill: Auth Flow — Autenticación y Autorización

## Descripción
Implementar o modificar flujos de autenticación: login, cambio de contraseña, roles, permisos, primer_login.

**Incluye:** Backend (auth.service, middleware, rutas) + Frontend (componentes de auth, guard, interceptor)

---

## Cuándo Usarlo

✅ **Usar este skill si:**
- Modificar login o cambio de contraseña
- Cambiar reglas de primer_login
- Agregar nuevas validaciones de rol o permiso
- Implementar reset de contraseña
- Cambiar estructura del JWT o token

❌ **NO usar si:**
- Es un CRUD simple → usa `backend-crud` o `frontend-crud`
- Es un fix de permiso en un endpoint existente → usa `debug-fix`
- Es un refactor sin cambiar comportamiento → usa `refactor`

---

## Entrada Conversacional Esperada

```
"Necesito [CAMBIO EN AUTH].
Cambio: [DESCRIPCIÓN].
Roles afectados: [ROLES].
¿Cambia primer_login?: [SI/NO, cómo].
¿Cambia token?: [SI/NO, qué campos].
Flujo usuario: [PASOS DEL USUARIO]."
```

### Ejemplo Concreto

```
"Necesito mejorar el flujo de primer_login.
Cambio: Después de cambiar contraseña, guardar en BD que completó setup.
Roles afectados: Todos (primer_login se aplica a todos).
¿Cambia primer_login?: Sí, cuando usuario cambia password, primer_login = false.
¿Cambia token?: No.
Flujo usuario:
1. User recibe credenciales temporales
2. Hace login con temp password → token emitido con primer_login=true en BD
3. Intenta acceder a /dashboard → bloqueado por middleware checkPrimerLogin
4. Es redirigido a /cambiar-password
5. Cambia password → primer_login = false
6. Puede acceder a /dashboard
"
```

---

## Contexto Crítico: Autenticación UniLab

### Política Actual

1. **Login con primer_login = true:**
   - Usuario inicia sesión con contraseña temporal/aleatoria
   - JWT se emite normal
   - Middleware `checkPrimerLogin` bloquea acceso a cualquier ruta EXCEPTO `/auth/cambiar-password`
   - Retorna 403 si intenta otra ruta

2. **POST /auth/cambiar-password (Caso A: Primer Login):**
   - Usuario autenticado con `primer_login = true`
   - Envía nueva contraseña
   - Service actualiza: `password_hash` + `primer_login = false`
   - Usuario ahora tiene acceso a todo según su rol

3. **POST /auth/cambiar-password (Caso B: Reset/Olvido):**
   - Usuario solicita reset (sin token)
   - Sistema genera nueva password aleatoria, hashea, pone `primer_login = true`
   - Devuelve password en texto plano (única vez)
   - Usuario hace login con temp password → sigue Caso A

### Estructura JWT Actual

```json
{
  "id_usuario": 123,
  "id_rol": "Profesor",
  "email": "usuario@universidad.edu",
  "exp": 1234567890
}
```

Sin `id_escuela`, `id_semillero` — estos datos se consultan en BD cuando se necesiten.

### Middleware de Control

```
verifyToken → checkPrimerLogin → requireRole
```

1. `verifyToken`: Valida JWT, extrae payload, lo agrega a `req.user`
2. `checkPrimerLogin`: Si `req.user.primer_login === true`, bloquea todo excepto `/auth/cambiar-password`
3. `requireRole(['Profesor', 'Coordinador'])`: Valida que el rol esté en la lista

---

## Proceso SDD

### 1️⃣ **SPEC** (Agent Guía)

Agent presentará en 1 párrafo:
- **Qué cambia:** en qué componente (login, JWT, primer_login, rol, permiso)
- **Cómo afecta backend:** qué endpoints cambian, qué middleware se modifica
- **Cómo afecta frontend:** qué componentes, guards, o interceptors cambiar
- **Flujo usuario:** paso a paso qué sucede
- **Casos límite:** qué sucede si [situación X], [situación Y]
- **Rollback:** ¿es reversible sin migración de BD?

**Agent espera confirmación.**

### 2️⃣ **CONFIRMACIÓN** (Usuario)

Confirma o ajusta. Si hay duda, agent hace UNA pregunta.

### 3️⃣ **IMPLEMENTACIÓN** (Agent Ejecuta)

#### BACKEND

##### 🔹 Paso 1: Actualizar Auth Service
Archivo: `unilab_back/src/services/auth.service.ts`

Revisar/actualizar:
- `login(email, password)` — valida credenciales, retorna JWT
- `cambiarPassword(userId, passwordAntigua, passwordNueva)` — valida ambas, actualiza `password_hash`, set `primer_login = false`
- `resetPassword(email)` — genera password aleatoria, hashea, pone `primer_login = true`, devuelve en texto plano

```typescript
export const authService = {
  login: async (email: string, password: string) => {
    const usuario = await usuarioRepository.obtenerPorEmail(email);
    if (!usuario || !await verificarPassword(password, usuario.password_hash)) {
      throw new AppError('Credenciales inválidas', 401);
    }
    return generarJWT(usuario);
  },

  cambiarPassword: async (userId: number, passwordAntigua: string, passwordNueva: string) => {
    const usuario = await usuarioRepository.obtenerPorId(userId);
    if (!await verificarPassword(passwordAntigua, usuario.password_hash)) {
      throw new AppError('Contraseña actual incorrecta', 400);
    }
    const hash = await hashPassword(passwordNueva);
    return usuarioRepository.actualizarUno(userId, {
      password_hash: hash,
      primer_login: false
    });
  },

  resetPassword: async (email: string) => {
    const usuario = await usuarioRepository.obtenerPorEmail(email);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    const tempPassword = generarPasswordAleatoria();
    const hash = await hashPassword(tempPassword);
    await usuarioRepository.actualizarUno(usuario.id_usuario, {
      password_hash: hash,
      primer_login: true
    });
    return { mensaje: 'Contraseña reseteada', tempPassword }; // SOLO aquí se devuelve en texto plano
  }
};
```

##### 🔹 Paso 2: Actualizar/Revisar Middleware
Archivo: `unilab_back/src/middlewares/auth/checkPrimerLogin.ts`

```typescript
export const checkPrimerLogin = (req: Request, res: Response, next: NextFunction) => {
  const rutasPermitidas = ['/api/auth/cambiar-password', '/api/auth/logout'];
  
  if (req.user?.primer_login === true && !rutasPermitidas.includes(req.path)) {
    return res.status(403).json({
      status: 'error',
      message: 'Debes cambiar tu contraseña antes de continuar',
      code: 'FIRST_LOGIN_REQUIRED'
    });
  }
  
  next();
};
```

##### 🔹 Paso 3: Crear/Actualizar Controller
Archivo: `unilab_back/src/controllers/auth.controller.ts`

```typescript
export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result); // { token, usuario: { id, email, rol, primer_login } }
  }),

  cambiarPassword: asyncHandler(async (req: Request, res: Response) => {
    const { user } = req; // del middleware verifyToken
    const { passwordAntigua, passwordNueva } = req.body;
    const result = await authService.cambiarPassword(user.id, passwordAntigua, passwordNueva);
    res.json({ mensaje: 'Contraseña actualizada', usuario: result });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    // NO incluir email en rutas protegidas — es público
    const result = await authService.resetPassword(email);
    res.json(result); // { mensaje, tempPassword }
  })
};
```

##### 🔹 Paso 4: Rutas Auth
Archivo: `unilab_back/src/routes/auth.routes.ts`

```typescript
const router = Router();

// POST /api/auth/login — SIN autenticación
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/cambiar-password — CON autenticación + primer_login puede ser true o false
router.post(
  '/cambiar-password',
  validate(cambiarPasswordSchema),
  verifyToken,
  authController.cambiarPassword
);

// POST /api/auth/reset-password — SIN autenticación
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// POST /api/auth/logout — CON autenticación
router.post('/logout', verifyToken, authController.logout);

export default router;
```

##### 🔹 Paso 5: Schemas Zod
Archivo: `unilab_back/src/middlewares/validation/schemas/index.ts`

```typescript
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const cambiarPasswordSchema = z.object({
  passwordAntigua: z.string().min(8),
  passwordNueva: z.string().min(8)
});

export const resetPasswordSchema = z.object({
  email: z.string().email()
});
```

##### 🔹 Paso 6: Swagger
Actualizar `src/docs/swagger/paths.ts`:

```typescript
'/api/auth/login': {
  post: {
    tags: ['Auth'],
    summary: 'Login con credenciales',
    requestBody: { /* ... */ },
    responses: {
      '200': { description: 'Login exitoso, retorna token' },
      '401': { description: 'Credenciales inválidas' }
    }
  }
},
'/api/auth/cambiar-password': {
  post: {
    tags: ['Auth'],
    summary: 'Cambiar contraseña (primer_login o reset)',
    security: [{ bearerAuth: [] }],
    requestBody: { /* ... */ },
    responses: {
      '200': { description: 'Contraseña cambiada' },
      '403': { description: 'Primer login bloqueado' }
    }
  }
}
```

#### FRONTEND

##### 🔹 Paso 7: Auth Service
Archivo: `unilab_front/src/app/core/auth/auth.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  usuarioSubject = new BehaviorSubject<Usuario | null>(null);

  login(email: string, password: string): Observable<any> {
    return this.http.post('/api/auth/login', { email, password }).pipe(
      tap(({ token, usuario }) => {
        localStorage.setItem('token', token);
        this.tokenSubject.next(token);
        this.usuarioSubject.next(usuario);
      })
    );
  }

  cambiarPassword(passwordAntigua: string, passwordNueva: string): Observable<any> {
    return this.http.post('/api/auth/cambiar-password', {
      passwordAntigua,
      passwordNueva
    }).pipe(
      tap(() => {
        // Usuario ya autenticado, actualizar flag primer_login
        const usuario = this.usuarioSubject.value;
        if (usuario) usuario.primer_login = false;
        this.usuarioSubject.next(usuario);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }
}
```

##### 🔹 Paso 8: Componente Login
Archivo: `unilab_front/src/app/features/auth/login/login.component.ts`

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  cargando = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    if (this.form.invalid) return;
    
    this.cargando.set(true);
    this.authService.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: (response) => {
        if (response.usuario.primer_login) {
          this.router.navigate(['/cambiar-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error.set('Credenciales inválidas');
        this.cargando.set(false);
      }
    });
  }
}
```

##### 🔹 Paso 9: Componente Cambiar Password
Archivo: `unilab_front/src/app/features/auth/cambiar-password/cambiar-password.component.ts`

```typescript
@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './cambiar-password.component.html'
})
export class CambiarPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    passwordAntigua: ['', [Validators.required, Validators.minLength(8)]],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
    confirmar: ['', Validators.required]
  }, { validators: this.passwordsMatch });

  cargando = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  passwordsMatch(form: any) {
    return form.get('passwordNueva')?.value === form.get('confirmar')?.value 
      ? null 
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.cargando.set(true);
    this.authService.cambiarPassword(
      this.form.value.passwordAntigua!,
      this.form.value.passwordNueva!
    ).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      },
      error: (err) => {
        this.error.set('Error al cambiar contraseña');
        this.cargando.set(false);
      }
    });
  }
}
```

##### 🔹 Paso 10: Guard y Rutas
Archivo: `unilab_front/src/app/core/auth/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  const usuario = authService.getUsuario();

  if (requiredRoles && !requiredRoles.includes(usuario?.id_rol)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
```

Registrar en `app.routes.ts`:
```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
];
```

##### 🔹 Paso 11: Documentar Swagger + Postman (OBLIGATORIO)

**Swagger** (`src/docs/swagger/paths.ts`):
```typescript
'/auth/cambiar-password': {
  post: {
    tags: ['Auth'],
    summary: 'Cambiar contraseña',
    description: '**Caso A:** Usuario con primer_login=true crea nueva password. **Caso B:** Reset sin token genera temporal.',
    security: [{ bearerAuth: [] }, {}],
    requestBody: jsonBody('#/components/schemas/CambiarPasswordRequest'),
    responses: {
      200: { description: 'Contraseña actualizada' },
      400: err[400],
      403: err[403]
    }
  }
}
```

**Postman** (`docs/postman_collection.json`):
```json
{
  "name": "Cambiar Password (Caso A: Primer Login)",
  "request": {
    "method": "POST",
    "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
    "body": { "raw": "{\"passwordNueva\": \"MiNuevaPassword123!\"}" },
    "url": "{{base_url}}/api/auth/cambiar-password"
  }
},
{
  "name": "Reset Password (Caso B: Olvido)",
  "request": {
    "method": "POST",
    "body": { "raw": "{\"email\": \"usuario@example.com\"}" },
    "url": "{{base_url}}/api/auth/reset-password"
  }
}
```

### 4️⃣ **VALIDACIÓN** (Agent + Usuario)

Backend compila:
```bash
cd unilab_back && npm run build
```

Frontend compila:
```bash
cd unilab_front && npm run build
```

Pruebas conversacionales:
- ✅ Login con credenciales válidas → JWT retornado + redirect a dashboard o cambiar-password según primer_login
- ✅ Login con credenciales inválidas → 401 + mensaje de error
- ✅ Usuario con primer_login=true intenta acceder a /dashboard → bloqueado, redirige a /cambiar-password (403)
- ✅ Cambiar password: actualiza contraseña, pone primer_login=false
- ✅ Intenta login con contraseña vieja → fallido
- ✅ Login con contraseña nueva → éxito + acceso a dashboard
- ✅ Logout limpia token de localStorage
- ✅ JWT válido + rol autorizado para ruta → acceso permitido
- ✅ JWT válido + rol NO autorizado → 403
- ✅ Rutas sin JWT → redirige a login

---

## Checklist de Salida

- [ ] Auth service backend actualizado (login, cambiarPassword, resetPassword)
- [ ] Middleware checkPrimerLogin funciona correctamente
- [ ] Controller auth con endpoints correctos
- [ ] Rutas auth registradas (login, cambiar-password, reset-password, logout)
- [ ] Zod schemas para validación
- [ ] Swagger documentado
- [ ] Backend compila: `npm run build`
- [ ] Auth service frontend con métodos CRUD
- [ ] Componente login funciona
- [ ] Componente cambiar-password funciona
- [ ] Guard de autenticación protege rutas
- [ ] Tokens en localStorage manejados correctamente
- [ ] Frontend compila: `npm run build`
- [ ] Flujo primer_login probado end-to-end
- [ ] Logout limpia estado correctamente

---

## Casos Límite a Probar

- ¿Qué sucede si token expira? → Interceptor redirige a login
- ¿Qué sucede si usuario es deletado (soft-delete)? → Verificar que no puede login
- ¿Qué sucede si rol cambia en BD mientras usuario está online? → Next request recarga rol
- ¿Qué sucede en reset password si email no existe? → Devolver error genérico (no revelar si existe)

---

**¿Listo? Describe el cambio de auth que necesitas en el chat siguiendo el formato de entrada.**
