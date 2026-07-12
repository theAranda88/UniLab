import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { generarPasswordAleatoria, hashearPassword, verificarPassword } from '../utils/password';
import { usuarioRepository } from '../models/usuario.repository';
import type { JwtPayload } from '../middlewares/auth/types';

function emitirToken(usuario: { id_usuario: number; email: string; rol: { nombre_rol: string } }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT_SECRET no configurado', 500);

  const payload: JwtPayload = {
    id_usuario: usuario.id_usuario,
    id_rol: usuario.rol.nombre_rol,
    email: usuario.email,
  };

  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

export const authService = {
  async login(email: string, password: string) {
    const usuario = await usuarioRepository.findByEmail(email);
    if (!usuario) throw new AppError('Credenciales inválidas', 401);

    const valido = await verificarPassword(password, usuario.password_hash);
    if (!valido) throw new AppError('Credenciales inválidas', 401);

    const token = emitirToken(usuario);
    return {
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        id_rol: usuario.rol.nombre_rol,
        primer_login: usuario.primer_login,
      },
    };
  },

  async register(data: {
    nombres: string;
    apellidos: string;
    email: string;
    documento_identidad: string;
    telefono: string;
    rol: 'Estudiante' | 'Externo';
    codigo_estudiantil?: string;
    id_escuela?: number;
    institucion?: string;
    ocupacion?: string;
  }) {
    const existente = await usuarioRepository.findByEmail(data.email);
    if (existente) throw new AppError('El email ya está registrado', 409);

    const rol = await usuarioRepository.findRolByNombre(data.rol);
    if (!rol) throw new AppError('Rol no encontrado', 422);

    if (data.rol === 'Estudiante') {
      if (!data.codigo_estudiantil || !data.id_escuela) {
        throw new AppError('Estudiante requiere codigo_estudiantil e id_escuela', 422);
      }
    } else if (!data.institucion || !data.ocupacion) {
      throw new AppError('Externo requiere institucion y ocupacion', 422);
    }

    const passwordPlano = generarPasswordAleatoria();
    const password_hash = await hashearPassword(passwordPlano);

    const usuario = await usuarioRepository.create({
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email,
      documento_identidad: data.documento_identidad,
      telefono: data.telefono,
      password_hash,
      primer_login: true,
      rol: { connect: { id_rol: rol.id_rol } },
      ...(data.rol === 'Estudiante'
        ? {
            perfil_estudiante: {
              create: {
                codigo_estudiantil: data.codigo_estudiantil!,
                escuela: { connect: { id_escuela: data.id_escuela! } },
              },
            },
          }
        : {
            perfil_externo: {
              create: {
                institucion: data.institucion!,
                ocupacion: data.ocupacion!,
              },
            },
          }),
    });

    return {
      usuario,
      password_temporal: passwordPlano,
      mensaje: 'Guarde esta contraseña; solo se muestra una vez.',
    };
  },

  async cambiarPassword(input: {
    id_usuario?: number;
    primer_login?: boolean;
    nueva_password?: string;
    email?: string;
  }) {
    // Caso A: primer login con usuario autenticado
    if (input.id_usuario && input.primer_login) {
      if (!input.nueva_password) throw new AppError('nueva_password es requerida', 400);
      const hash = await hashearPassword(input.nueva_password);
      await usuarioRepository.update(input.id_usuario, {
        password_hash: hash,
        primer_login: false,
      });
      return { mensaje: 'Contraseña actualizada correctamente' };
    }

    // Caso B: olvidó contraseña (sin auth)
    if (input.email) {
      const usuario = await usuarioRepository.findByEmail(input.email);
      if (!usuario) throw new AppError('Usuario no encontrado', 404);

      const passwordPlano = generarPasswordAleatoria();
      const hash = await hashearPassword(passwordPlano);
      await usuarioRepository.update(usuario.id_usuario, {
        password_hash: hash,
        primer_login: true,
      });

      return {
        email: usuario.email,
        password_temporal: passwordPlano,
        mensaje: 'Contraseña temporal generada. Inicie sesión y cámbiela.',
      };
    }

    throw new AppError('Solicitud de cambio de contraseña inválida', 422);
  },
};
