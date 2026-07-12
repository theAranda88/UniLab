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
};
