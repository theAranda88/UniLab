import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

type Fuente = 'body' | 'params' | 'query';

export function validate(schema: ZodType, fuente: Fuente = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req[fuente]);
    if (!resultado.success) {
      res.status(400).json({
        error: 'Validación fallida',
        detalles: resultado.error.issues.map((i) => ({
          campo: i.path.join('.'),
          mensaje: i.message,
        })),
      });
      return;
    }
    req[fuente] = resultado.data;
    next();
  };
}
