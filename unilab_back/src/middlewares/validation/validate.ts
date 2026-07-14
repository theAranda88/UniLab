import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

type Fuente = 'body' | 'params' | 'query';

/** Express 5 expone query/params como getters; no se puede reasignar el objeto completo. */
function aplicarValidado(req: Request, fuente: Fuente, data: unknown): void {
  if (fuente === 'body') {
    req.body = data;
    return;
  }
  const destino = req[fuente] as Record<string, unknown>;
  const valores = data as Record<string, unknown>;
  for (const key of Object.keys(valores)) {
    destino[key] = valores[key];
  }
}

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
    aplicarValidado(req, fuente, resultado.data);
    next();
  };
}
