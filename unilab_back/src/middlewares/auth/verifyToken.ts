import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError';
import { usuarioRepository } from '../../models/usuario.repository';
import type { JwtPayload } from './types';

export async function verifyToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401);
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT_SECRET no configurado', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const usuario = await usuarioRepository.findById(decoded.id_usuario);

    if (!usuario || !usuario.activo) {
      throw new AppError('Usuario no válido o inactivo', 401);
    }

    req.user = {
      id_usuario: usuario.id_usuario,
      id_rol: usuario.rol.nombre_rol,
      email: usuario.email,
      primer_login: usuario.primer_login,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Token inválido o expirado', 401));
  }
}

/** Auth opcional: adjunta usuario si hay token válido, sin fallar si no hay. */
export async function verifyTokenOpcional(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  await verifyToken(req, _res, next);
}
