import type { AuthenticatedUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
