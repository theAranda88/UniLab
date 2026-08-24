import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';

/** Bloquea acceso si primer_login=true, excepto cambio de contraseña. */
export function checkPrimerLogin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next();
    return;
  }

  const isCambiarPassword = req.originalUrl.includes('/auth/cambiar-password');
  const isCompletarPerfil = req.originalUrl.includes('/auth/completar-perfil');

  if (req.user.primer_login && !isCambiarPassword && !isCompletarPerfil) {
    next(new AppError('Debe cambiar su contraseña antes de continuar', 403));
    return;
  }

  next();
}

/** Bloquea acceso si perfil_pendiente=true, excepto completar-perfil. */
export function checkPerfilPendiente(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next();
    return;
  }

  const isCompletarPerfil = req.originalUrl.includes('/auth/completar-perfil');

  if (req.user.perfil_pendiente && !isCompletarPerfil) {
    next(new AppError('Debe completar su perfil antes de continuar', 403));
    return;
  }

  next();
}
