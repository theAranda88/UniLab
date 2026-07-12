import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CambiarPasswordGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();

    // Solo accesible si está autenticado Y tiene primer_login = true
    if (user && user.primer_login) {
      return true;
    }

    // Si no tiene primer_login = true, redirige al dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
