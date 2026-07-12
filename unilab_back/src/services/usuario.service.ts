import { AppError } from '../utils/AppError';
import { generarPasswordAleatoria, hashearPassword } from '../utils/password';
import { usuarioRepository } from '../models/usuario.repository';
import { prisma } from '../models/prisma.client';

const ROLES_CON_PERFIL = ['Coordinador', 'Profesor', 'Estudiante', 'Externo'] as const;

export const usuarioService = {
  async listar(filtroRol?: string) {
    let id_rol: number | undefined;
    if (filtroRol) {
      const rol = await usuarioRepository.findRolByNombre(filtroRol);
      if (!rol) throw new AppError('Rol de filtro no válido', 400);
      id_rol = rol.id_rol;
    }
    return usuarioRepository.findMany(id_rol ? { id_rol } : undefined);
  },

  async obtenerPorId(id: number) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    return usuario;
  },

  async crear(data: {
    nombres: string;
    apellidos: string;
    email: string;
    documento_identidad: string;
    telefono: string;
    rol: string;
    created_by: number;
    codigo_docente?: string;
    codigo_estudiantil?: string;
    id_escuela?: number;
    cargo?: string;
    dependencia?: string;
    institucion?: string;
    ocupacion?: string;
  }) {
    const existente = await usuarioRepository.findByEmail(data.email);
    if (existente) throw new AppError('El email ya está registrado', 409);

    const rol = await usuarioRepository.findRolByNombre(data.rol);
    if (!rol) throw new AppError('Rol no válido', 422);

    validarPerfilObligatorio(data.rol, data);

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
      creador: { connect: { id_usuario: data.created_by } },
      rol: { connect: { id_rol: rol.id_rol } },
      ...construirPerfilCreate(data),
    });

    return { usuario, password_temporal: passwordPlano };
  },

  async actualizar(id: number, data: Record<string, unknown>) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);

    if (data.email && data.email !== usuario.email) {
      const dup = await usuarioRepository.findByEmail(data.email as string);
      if (dup) throw new AppError('El email ya está en uso', 409);
    }

    const actualizado = await usuarioRepository.update(id, {
      nombres: data.nombres as string | undefined,
      apellidos: data.apellidos as string | undefined,
      email: data.email as string | undefined,
      documento_identidad: data.documento_identidad as string | undefined,
      telefono: data.telefono as string | undefined,
    });

    await actualizarPerfilExtendido(usuario.rol.nombre_rol, id, data);
    return usuarioRepository.findById(id) ?? actualizado;
  },

  async suspender(id: number) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    return usuarioRepository.update(id, { activo: !usuario.activo });
  },

  async eliminar(id: number) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    await usuarioRepository.softDelete(id);
  },
};

function validarPerfilObligatorio(
  rol: string,
  data: {
    codigo_docente?: string;
    codigo_estudiantil?: string;
    id_escuela?: number;
    cargo?: string;
    dependencia?: string;
    institucion?: string;
    ocupacion?: string;
  },
) {
  if (rol === 'Profesor' && (!data.codigo_docente || !data.id_escuela)) {
    throw new AppError('Profesor requiere codigo_docente e id_escuela', 422);
  }
  if (rol === 'Estudiante' && (!data.codigo_estudiantil || !data.id_escuela)) {
    throw new AppError('Estudiante requiere codigo_estudiantil e id_escuela', 422);
  }
  if (rol === 'Coordinador' && (!data.cargo || !data.dependencia)) {
    throw new AppError('Coordinador requiere cargo y dependencia', 422);
  }
  if (rol === 'Externo' && (!data.institucion || !data.ocupacion)) {
    throw new AppError('Externo requiere institucion y ocupacion', 422);
  }
}

function construirPerfilCreate(data: {
  rol: string;
  codigo_docente?: string;
  codigo_estudiantil?: string;
  id_escuela?: number;
  cargo?: string;
  dependencia?: string;
  institucion?: string;
  ocupacion?: string;
  created_by: number;
}) {
  switch (data.rol) {
    case 'Coordinador':
      return {
        perfil_coordinador: {
          create: {
            cargo: data.cargo!,
            dependencia: data.dependencia!,
            creador: { connect: { id_usuario: data.created_by } },
          },
        },
      };
    case 'Profesor':
      return {
        perfil_profesor: {
          create: {
            codigo_docente: data.codigo_docente!,
            escuela: { connect: { id_escuela: data.id_escuela! } },
            creador: { connect: { id_usuario: data.created_by } },
          },
        },
      };
    case 'Estudiante':
      return {
        perfil_estudiante: {
          create: {
            codigo_estudiantil: data.codigo_estudiantil!,
            escuela: { connect: { id_escuela: data.id_escuela! } },
            creador: { connect: { id_usuario: data.created_by } },
          },
        },
      };
    case 'Externo':
      return {
        perfil_externo: {
          create: {
            institucion: data.institucion!,
            ocupacion: data.ocupacion!,
            creador: { connect: { id_usuario: data.created_by } },
          },
        },
      };
    default:
      return {};
  }
}

async function actualizarPerfilExtendido(rol: string, id_usuario: number, data: Record<string, unknown>) {
  if (!ROLES_CON_PERFIL.includes(rol as (typeof ROLES_CON_PERFIL)[number])) return;

  if (rol === 'Coordinador' && (data.cargo || data.dependencia)) {
    await prisma.perfiles_coordinador.update({
      where: { id_usuario },
      data: {
        cargo: data.cargo as string | undefined,
        dependencia: data.dependencia as string | undefined,
      },
    });
  }
  if (rol === 'Profesor' && (data.codigo_docente || data.id_escuela)) {
    await prisma.perfiles_profesor.update({
      where: { id_usuario },
      data: {
        codigo_docente: data.codigo_docente as string | undefined,
        ...(data.id_escuela ? { id_escuela: data.id_escuela as number } : {}),
      },
    });
  }
  if (rol === 'Estudiante' && (data.codigo_estudiantil || data.id_escuela)) {
    await prisma.perfiles_estudiante.update({
      where: { id_usuario },
      data: {
        codigo_estudiantil: data.codigo_estudiantil as string | undefined,
        ...(data.id_escuela ? { id_escuela: data.id_escuela as number } : {}),
      },
    });
  }
  if (rol === 'Externo' && (data.institucion || data.ocupacion)) {
    await prisma.perfiles_externo.update({
      where: { id_usuario },
      data: {
        institucion: data.institucion as string | undefined,
        ocupacion: data.ocupacion as string | undefined,
      },
    });
  }
}
