// src/@types/express.d.ts
import { JWTPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}