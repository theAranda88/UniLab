import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { generarPasswordAleatoria, hashearPassword, verificarPassword } from '../utils/password';
import {
  esEmailUniversitario,
  extraerNombresGoogle,
  verificarGoogleIdToken,
} from '../utils/googleAuth';
import { usuarioRepository } from '../models/usuario.repository';
import { escuelaRepository } from '../models/escuela.repository';
import type { JwtPayload } from '../middlewares/auth/types';
import { configuracionService } from './configuracion.service';

type PerfilSesion = NonNullable<Awaited<ReturnType<typeof usuarioRepository.findPerfilSesion>>>;

type RolSemillero = 'lider' | 'profesor' | 'miembro';

/** Une los semilleros del usuario (líder, profesor asignado o miembro aprobado) sin duplicados. */
function semillerosDeUsuario(u: PerfilSesion) {
  const porId = new Map<number, { id_semillero: number; nombre_semillero: string; rol_semillero: RolSemillero }>();
  const agregar = (s: { id_semillero: number; nombre_semillero: string }, rol: RolSemillero) => {
    const previo = porId.get(s.id_semillero);
    if (!previo || rol === 'lider') porId.set(s.id_semillero, { ...s, rol_semillero: rol });
  };
  u.semilleros_como_profesor.forEach((p) => agregar(p.semillero, p.es_lider ? 'lider' : 'profesor'));
  u.semilleros_como_lider.forEach((s) => agregar(s, 'lider'));
  u.membresias_semillero.forEach((m) => agregar(m.semillero, 'miembro'));
  return [...porId.values()].sort((a, b) => a.nombre_semillero.localeCompare(b.nombre_semillero));
}

/** Respuesta común de login, login con Google, completar perfil y GET /auth/me. */
export function mapUsuarioSesion(u: PerfilSesion) {
  const perfilAcademico = u.perfil_profesor ?? u.perfil_estudiante;
  return {
    id_usuario: u.id_usuario,
    email: u.email,
    id_rol: u.rol.nombre_rol,
    primer_login: u.primer_login,
    perfil_pendiente: u.perfil_pendiente,
    nombres: u.nombres,
    apellidos: u.apellidos,
    telefono: u.telefono,
    escuela: perfilAcademico?.escuela ?? null,
    semilleros: semillerosDeUsuario(u),
    redes: {
      linkedin: u.url_linkedin,
      github: u.url_github,
      portafolio: u.url_portafolio,
    },
    perfil: {
      codigo_docente: u.perfil_profesor?.codigo_docente ?? null,
      codigo_estudiantil: u.perfil_estudiante?.codigo_estudiantil ?? null,
      cargo: u.perfil_coordinador?.cargo ?? null,
      dependencia: u.perfil_coordinador?.dependencia ?? null,
      profesion: u.perfil_coordinador?.profesion ?? null,
      institucion: u.perfil_externo?.institucion ?? null,
      ocupacion: u.perfil_externo?.ocupacion ?? null,
    },
  };
}

async function construirSesion(id_usuario: number) {
  const perfil = await usuarioRepository.findPerfilSesion(id_usuario);
  if (!perfil) throw new AppError('Usuario no encontrado', 404);
  return mapUsuarioSesion(perfil);
}

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

async function resolverEscuelaPorDefecto(): Promise<number> {
  const escuela = await escuelaRepository.findFirst();
  if (!escuela) {
    throw new AppError('No hay escuelas registradas para asignar perfil de estudiante', 422);
  }
  return escuela.id_escuela;
}

async function verificarRegistroAbierto(): Promise<void> {
  if (!(await configuracionService.obtener('registro_abierto'))) {
    throw new AppError('El registro de nuevas cuentas está cerrado temporalmente', 422);
  }
}

async function crearUsuarioDesdeGoogle(payload: Awaited<ReturnType<typeof verificarGoogleIdToken>>) {
  const rolNombre = esEmailUniversitario(payload.email) ? 'Estudiante' : 'Externo';
  const rol = await usuarioRepository.findRolByNombre(rolNombre);
  if (!rol) throw new AppError('Rol no encontrado', 422);

  const { nombres, apellidos } = extraerNombresGoogle(payload);
  const password_hash = await hashearPassword(generarPasswordAleatoria());
  const documentoPlaceholder = `PEND-G-${payload.sub.slice(0, 18)}`;

  const baseUsuario = {
    nombres,
    apellidos,
    email: payload.email,
    documento_identidad: documentoPlaceholder,
    telefono: '0000000000',
    password_hash,
    google_sub: payload.sub,
    primer_login: false,
    perfil_pendiente: true,
    rol: { connect: { id_rol: rol.id_rol } },
  };

  if (rolNombre === 'Estudiante') {
    const id_escuela = await resolverEscuelaPorDefecto();
    const codigoPlaceholder = `PEND-${payload.email.split('@')[0].slice(0, 20)}`;
    return usuarioRepository.create({
      ...baseUsuario,
      perfil_estudiante: {
        create: {
          codigo_estudiantil: codigoPlaceholder,
          escuela: { connect: { id_escuela } },
        },
      },
    });
  }

  return usuarioRepository.create({
    ...baseUsuario,
    perfil_externo: {
      create: {
        institucion: 'Pendiente',
        ocupacion: 'Pendiente',
      },
    },
  });
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
      usuario: await construirSesion(usuario.id_usuario),
    };
  },

  async loginGoogle(credential: string) {
    const payload = await verificarGoogleIdToken(credential);

    let usuario = await usuarioRepository.findByGoogleSub(payload.sub);

    if (!usuario) {
      const porEmail = await usuarioRepository.findByEmail(payload.email);
      if (porEmail) {
        if (porEmail.google_sub && porEmail.google_sub !== payload.sub) {
          throw new AppError('Esta cuenta ya está vinculada a otro perfil de Google', 409);
        }
        usuario = await usuarioRepository.update(porEmail.id_usuario, { google_sub: payload.sub });
      } else {
        await verificarRegistroAbierto();
        usuario = await crearUsuarioDesdeGoogle(payload);
      }
    }

    if (!usuario.activo) {
      throw new AppError('Usuario inactivo', 403);
    }

    const token = emitirToken(usuario);
    return {
      token,
      usuario: await construirSesion(usuario.id_usuario),
      cuenta_nueva: usuario.perfil_pendiente,
    };
  },

  async completarPerfil(
    id_usuario: number,
    data: {
      documento_identidad: string;
      telefono: string;
      codigo_estudiantil?: string;
      id_escuela?: number;
      institucion?: string;
      ocupacion?: string;
      url_linkedin?: string | null;
      url_github?: string | null;
      url_portafolio?: string | null;
    },
  ) {
    const usuario = await usuarioRepository.findById(id_usuario);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    if (!usuario.perfil_pendiente) {
      throw new AppError('El perfil ya está completo', 422);
    }

    const rol = usuario.rol.nombre_rol;

    if (rol === 'Estudiante') {
      if (!data.codigo_estudiantil || !data.id_escuela) {
        throw new AppError('Estudiante requiere codigo_estudiantil e id_escuela', 422);
      }
      const escuela = await escuelaRepository.findById(data.id_escuela);
      if (!escuela) throw new AppError('Escuela no encontrada', 404);
    } else if (rol === 'Externo') {
      if (!data.institucion || !data.ocupacion) {
        throw new AppError('Externo requiere institucion y ocupacion', 422);
      }
    }

    await usuarioRepository.update(id_usuario, {
      documento_identidad: data.documento_identidad,
      telefono: data.telefono,
      perfil_pendiente: false,
      url_linkedin: data.url_linkedin,
      url_github: data.url_github,
      url_portafolio: data.url_portafolio,
    });

    if (rol === 'Estudiante') {
      await usuarioRepository.updatePerfilEstudiante(id_usuario, {
        codigo_estudiantil: data.codigo_estudiantil!,
        id_escuela: data.id_escuela!,
      });
    } else if (rol === 'Externo') {
      await usuarioRepository.updatePerfilExterno(id_usuario, {
        institucion: data.institucion!,
        ocupacion: data.ocupacion!,
      });
    }

    return {
      mensaje: 'Perfil completado correctamente',
      usuario: await construirSesion(id_usuario),
    };
  },

  async obtenerSesion(id_usuario: number) {
    return construirSesion(id_usuario);
  },

  /** PATCH /auth/me: teléfono, redes y, solo para Coordinador, profesión. */
  async actualizarMiPerfil(
    solicitante: { id_usuario: number; id_rol: string },
    data: {
      telefono?: string;
      profesion?: string | null;
      url_linkedin?: string | null;
      url_github?: string | null;
      url_portafolio?: string | null;
    },
  ) {
    const { profesion, ...datosUsuario } = data;
    if (profesion !== undefined && solicitante.id_rol !== 'Coordinador') {
      throw new AppError('Solo el coordinador puede registrar su profesión', 422);
    }
    if (Object.keys(datosUsuario).length > 0) {
      await usuarioRepository.update(solicitante.id_usuario, datosUsuario);
    }
    if (profesion !== undefined) {
      await usuarioRepository.updatePerfilCoordinador(solicitante.id_usuario, { profesion });
    }
    return construirSesion(solicitante.id_usuario);
  },

  /** Cambio voluntario de contraseña: exige la contraseña actual. */
  async cambiarMiPassword(id_usuario: number, password_actual: string, nueva_password: string) {
    const usuario = await usuarioRepository.findPasswordHash(id_usuario);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    const valida = await verificarPassword(password_actual, usuario.password_hash);
    if (!valida) throw new AppError('La contraseña actual no es correcta', 422);
    await usuarioRepository.update(id_usuario, {
      password_hash: await hashearPassword(nueva_password),
      primer_login: false,
    });
    return { mensaje: 'Contraseña actualizada correctamente' };
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
    await verificarRegistroAbierto();

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
