// src/controllers/auth.controller.ts - COMPLETE REPLACEMENT
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../services/database.service';

// Simple validation function (no Zod for now)
const validateRegister = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!data.email.includes('@')) {
    errors.push('Invalid email format');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateLogin = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('Register attempt:', req.body);

      // Manual validation
      const validation = validateRegister(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.errors[0],
        });
        return;
      }

      const { email, password, fullName } = req.body;

      // Check if user exists
      const existingUser = await db.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'User already exists',
        });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await db.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: 'VIEWER',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate JWT - FIXED: Proper JWT sign call
      const JWT_SECRET = process.env.JWT_SECRET as string;
      const token = jwt.sign(
        {
          userId: user.id.toString(),
          email: user.email,
          role: user.role
        } as jwt.JwtPayload,
        JWT_SECRET,
        {
          expiresIn: '24h'
        } as SignOptions
      );

      res.status(201).json({
        success: true,
        data: { user, token },
        message: 'User registered successfully',
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: 'Email already exists',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('Login attempt:', req.body);

      // Manual validation
      const validation = validateLogin(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.errors[0],
        });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const user = await db.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      // Update last login
      await db.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const JWT_SECRET = process.env.JWT_SECRET as string;
      const token = jwt.sign(
        {
          userId: user.id.toString(),
          email: user.email,
          role: user.role
        } as jwt.JwtPayload,
        JWT_SECRET,
        {
          expiresIn: '24h'
        } as SignOptions
      );

      // Return user data (excluding password)
      const { passwordHash: _, ...userData } = user;

      res.json({
        success: true,
        data: { user: userData, token },
        message: 'Login successful',
      });
    } catch (error: any) {
      console.error('Login error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // Type assertion for req.user
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const dbUser = await db.prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!dbUser) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: dbUser,
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}