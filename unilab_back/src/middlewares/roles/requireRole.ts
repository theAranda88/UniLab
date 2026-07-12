import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';

export function requireRole(rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('No autenticado', 401));
      return;
    }

    if (!rolesPermitidos.includes(req.user.id_rol)) {
      next(new AppError('No tiene permiso para esta acción', 403));
      return;
    }

    next();
  };
}
