import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import type { RegisterRequest, RegisterResponse } from '../models/portal.model';
import type {
  ActualizarMiPerfilDto,
  CambiarMiPasswordDto,
  CompletarPerfilDto,
  EscuelaResumen,
  PerfilRol,
  RedesContacto,
  SemilleroUsuario,
} from '../models/usuario.model';
import { environment } from '../../../environments/environment';

/** Sesión del usuario: respuesta de login, Google, completar perfil y GET /auth/me. */
export interface User {
  id_usuario: number;
  email: string;
  id_rol: string;
  primer_login: boolean;
  perfil_pendiente?: boolean;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  escuela?: EscuelaResumen | null;
  semilleros?: SemilleroUsuario[];
  redes?: RedesContacto;
  perfil?: PerfilRol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  usuario: User;
  cuenta_nueva?: boolean;
}

export interface CambiarPasswordResponse {
  mensaje: string;
}

export interface RecuperarPasswordResponse {
  email: string;
  password_temporal: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenSignal = signal<string | null>(this.readToken());
  private userSignal = signal<User | null>(this.readUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly user$ = toObservable(this.userSignal);
  readonly currentRole = computed(() => this.userSignal()?.id_rol ?? null);

  /** @deprecated Usar `user` signal; se mantiene por compatibilidad con interceptors existentes */
  get tokenSubject() {
    return { value: this.tokenSignal() };
  }

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.setAuth(response.token, response.usuario)),
    );
  }

  loginWithGoogle(credential: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { credential }).pipe(
      tap((response) => this.setAuth(response.token, response.usuario)),
    );
  }

  completarPerfil(data: CompletarPerfilDto): Observable<{ mensaje: string; usuario: User }> {
    return this.http
      .post<{ mensaje: string; usuario: User }>(`${this.apiUrl}/completar-perfil`, data)
      .pipe(
        tap((response) => {
          const current = this.userSignal();
          if (current) {
            this.updateUser({ ...response.usuario, perfil_pendiente: false });
          }
        }),
      );
  }

  /** Perfil completo del usuario autenticado; refresca la copia guardada en localStorage. */
  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(tap((user) => this.updateUser(user)));
  }

  /**
   * Actualiza la sesión guardada con GET /auth/me (p. ej. al recargar la página),
   * para que nombre, escuela y semilleros no queden desactualizados.
   * El interceptor no cierra sesión ante un 401 de /api/auth/, por eso se hace aquí.
   */
  refrescarSesion(): void {
    if (!this.isAuthenticated()) return;
    this.me().subscribe({
      error: (err: { status?: number }) => {
        if (err?.status === 401) this.logout();
      },
    });
  }

  /** Teléfono, redes de contacto y (solo Coordinador) profesión. */
  actualizarMiPerfil(data: ActualizarMiPerfilDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me`, data).pipe(tap((user) => this.updateUser(user)));
  }

  /** Cambio voluntario de contraseña desde «Mi perfil» (exige la actual). */
  cambiarMiPassword(data: CambiarMiPasswordDto): Observable<CambiarPasswordResponse> {
    return this.http.post<CambiarPasswordResponse>(`${this.apiUrl}/me/password`, data);
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  cambiarPassword(nuevaPassword: string): Observable<CambiarPasswordResponse> {
    return this.http.post<CambiarPasswordResponse>(`${this.apiUrl}/cambiar-password`, {
      nueva_password: nuevaPassword,
    });
  }

  /** Olvidó contraseña: el backend genera una contraseña temporal para el correo indicado. */
  recuperarPassword(email: string): Observable<RecuperarPasswordResponse> {
    return this.http.post<RecuperarPasswordResponse>(`${this.apiUrl}/cambiar-password`, { email });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  private readToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private readUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('usuario');
    return raw ? (JSON.parse(raw) as User) : null;
  }

  /** @deprecated Usar `isAuthenticated()` */
  isAuthenticatedLegacy(): boolean {
    return this.isAuthenticated();
  }

  hasRole(role: string): boolean {
    return this.userSignal()?.id_rol === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const role = this.userSignal()?.id_rol;
    return role ? roles.includes(role) : false;
  }

  getCurrentUser(): User | null {
    return this.userSignal();
  }

  obtenerToken(): string | null {
    return this.tokenSignal();
  }

  updateUser(partial: Partial<User>): void {
    const current = this.userSignal();
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem('usuario', JSON.stringify(updated));
    this.userSignal.set(updated);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal();
  }
}
