import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id_usuario: number;
  email: string;
  id_rol: string; // 'Administrador' | 'Coordinador' | 'Profesor' | 'Estudiante' | 'Externo'
  primer_login: boolean;
  [key: string]: any; // Campos adicionales que pueda devolver el backend
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
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // Cambiar según configuración
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());

  user$ = this.userSubject.asObservable();
  token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.setAuth(response.token, response.usuario);
      })
    );
  }

  cambiarPassword(nuevaPassword: string): Observable<CambiarPasswordResponse> {
    return this.http.post<CambiarPasswordResponse>(`${this.apiUrl}/cambiar-password`, {
      nueva_password: nuevaPassword
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.userSubject.next(null);
    this.tokenSubject.next(null);
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.userSubject.next(user);
  }

  private getTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  hasRole(role: string): boolean {
    return this.userSubject.value?.id_rol === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.userSubject.value?.id_rol;
    return userRole ? roles.includes(userRole) : false;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}
