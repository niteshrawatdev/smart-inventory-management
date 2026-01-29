// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error.stack);

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: (error as any).errors,
    } as ApiResponse);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Duplicate entry',
      } as ApiResponse);
      return;
    }
    
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Record not found',
      } as ApiResponse);
      return;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    } as ApiResponse);
    return;
  }

  // Handle custom errors
  if (error.name === 'CustomError') {
    res.status(400).json({
      success: false,
      error: error.message,
    } as ApiResponse);
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } as ApiResponse);
};