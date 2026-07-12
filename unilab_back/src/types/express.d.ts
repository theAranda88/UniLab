import type { AuthUser } from '../middlewares/auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
