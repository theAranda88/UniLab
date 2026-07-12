import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/auth.service';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.status(200).json(result);
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),

  cambiarPassword: asyncHandler(async (req: Request, res: Response) => {
    if (req.user?.primer_login && req.body.nueva_password) {
      const result = await authService.cambiarPassword({
        id_usuario: req.user.id_usuario,
        primer_login: true,
        nueva_password: req.body.nueva_password,
      });
      res.status(200).json(result);
      return;
    }

    if (req.body.email) {
      const result = await authService.cambiarPassword({ email: req.body.email });
      res.status(200).json(result);
      return;
    }

    res.status(422).json({ error: 'Envíe nueva_password (autenticado) o email (reset)' });
  }),
};
