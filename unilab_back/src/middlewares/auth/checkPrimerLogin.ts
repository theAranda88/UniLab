import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';

/** Bloquea acceso si primer_login=true, excepto cambio de contraseña. */
export function checkPrimerLogin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next();
    return;
  }

  const isCambiarPassword = req.originalUrl.includes('/auth/cambiar-password');

  if (req.user.primer_login && !isCambiarPassword) {
    next(new AppError('Debe cambiar su contraseña antes de continuar', 403));
    return;
  }

  next();
}
