// src/middleware/auth.ts - COMPLETE REPLACEMENT
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Create custom interface
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    
    // Type assertion - THIS IS THE KEY FIX
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'VIEWER',
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Type assertion here too
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};