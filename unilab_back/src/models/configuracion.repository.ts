import { prisma } from './prisma.client';

export const configuracionRepository = {
  findAll() {
    return prisma.configuracion_sistema.findMany();
  },

  findByClave(clave: string) {
    return prisma.configuracion_sistema.findUnique({ where: { clave } });
  },

  upsertMany(valores: { clave: string; valor: string }[], updated_by: number) {
    return prisma.$transaction(
      valores.map(({ clave, valor }) =>
        prisma.configuracion_sistema.upsert({
          where: { clave },
          create: { clave, valor, updated_by },
          update: { valor, updated_by },
        }),
      ),
    );
  },
};
