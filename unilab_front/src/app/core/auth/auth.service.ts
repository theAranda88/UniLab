import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import type { RegisterRequest, RegisterResponse } from '../models/portal.model';

export interface User {
  id_usuario: number;
  email: string;
  id_rol: string;
  primer_login: boolean;
  nombres?: string;
  apellidos?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  usuario: User;
}

export interface CambiarPasswordResponse {
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
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

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  cambiarPassword(nuevaPassword: string): Observable<CambiarPasswordResponse> {
    return this.http.post<CambiarPasswordResponse>(`${this.apiUrl}/cambiar-password`, {
      nueva_password: nuevaPassword,
    });
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
