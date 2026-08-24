import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

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
