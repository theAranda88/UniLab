import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

const escuelaResumen = { select: { id_escuela: true, nombre_escuela: true } } as const;
const semilleroResumen = { select: { id_semillero: true, nombre_semillero: true } } as const;

export const usuarioRepository = {
  findByEmail(email: string) {
    return prisma.usuarios.findFirst({
      where: { email, ...activo },
      include: { rol: true },
    });
  },

  findByGoogleSub(google_sub: string) {
    return prisma.usuarios.findFirst({
      where: { google_sub, ...activo },
      include: { rol: true },
    });
  },

  findById(id: number) {
    return prisma.usuarios.findFirst({
      where: { id_usuario: id, ...activo },
      include: {
        rol: true,
        perfil_coordinador: { where: activo },
        perfil_profesor: { where: activo, include: { escuela: true } },
        perfil_estudiante: { where: activo, include: { escuela: true } },
        perfil_externo: { where: activo },
      },
    });
  },

  /** Usuario con escuela, semilleros y redes: base de la respuesta de login y de /auth/me. */
  findPerfilSesion(id: number) {
    return prisma.usuarios.findFirst({
      where: { id_usuario: id, ...activo },
      select: {
        id_usuario: true,
        nombres: true,
        apellidos: true,
        email: true,
        telefono: true,
        primer_login: true,
        perfil_pendiente: true,
        activo: true,
        url_linkedin: true,
        url_github: true,
        url_portafolio: true,
        rol: { select: { nombre_rol: true } },
        perfil_coordinador: { where: activo, select: { cargo: true, dependencia: true, profesion: true } },
        perfil_profesor: { where: activo, select: { codigo_docente: true, escuela: escuelaResumen } },
        perfil_estudiante: {
          where: activo,
          select: { codigo_estudiantil: true, escuela: escuelaResumen },
        },
        perfil_externo: { where: activo, select: { institucion: true, ocupacion: true } },
        semilleros_como_lider: { where: activo, ...semilleroResumen },
        semilleros_como_profesor: {
          where: { ...activo, semillero: activo },
          select: { es_lider: true, semillero: semilleroResumen },
        },
        membresias_semillero: {
          where: { ...activo, estado_solicitud: 'aprobado', semillero: activo },
          select: { semillero: semilleroResumen },
        },
      },
    });
  },

  findPasswordHash(id: number) {
    return prisma.usuarios.findFirst({
      where: { id_usuario: id, ...activo },
      select: { password_hash: true },
    });
  },

  updatePerfilCoordinador(id_usuario: number, data: Prisma.perfiles_coordinadorUpdateInput) {
    return prisma.perfiles_coordinador.update({ where: { id_usuario }, data });
  },

  findMany(filtro?: { id_rol?: number }) {
    return prisma.usuarios.findMany({
      where: { ...activo, ...(filtro?.id_rol ? { id_rol: filtro.id_rol } : {}) },
      include: { rol: true },
      orderBy: { id_usuario: 'asc' },
    });
  },

  create(data: Prisma.usuariosCreateInput) {
    return prisma.usuarios.create({ data, include: { rol: true } });
  },

  update(id: number, data: Prisma.usuariosUpdateInput) {
    return prisma.usuarios.update({
      where: { id_usuario: id },
      data,
      include: { rol: true },
    });
  },

  softDelete(id: number) {
    return prisma.usuarios.update({
      where: { id_usuario: id },
      data: { deleted_at: new Date() },
    });
  },

  findRolByNombre(nombre: string) {
    return prisma.roles.findFirst({ where: { nombre_rol: nombre, ...activo } });
  },

  findAllRoles() {
    return prisma.roles.findMany({ where: activo });
  },

  updatePerfilEstudiante(
    id_usuario: number,
    data: { codigo_estudiantil: string; id_escuela: number },
  ) {
    return prisma.perfiles_estudiante.update({
      where: { id_usuario },
      data: {
        codigo_estudiantil: data.codigo_estudiantil,
        id_escuela: data.id_escuela,
      },
    });
  },

  updatePerfilExterno(id_usuario: number, data: { institucion: string; ocupacion: string }) {
    return prisma.perfiles_externo.update({
      where: { id_usuario },
      data: {
        institucion: data.institucion,
        ocupacion: data.ocupacion,
      },
    });
  },
};
