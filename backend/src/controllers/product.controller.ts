// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { db } from '../services/database.service';
import { ApiResponse, PaginatedResponse } from '../types';

// Validation schemas
const createProductSchema = z.object({
  sku: z.string().min(3).max(100),
  name: z.string().min(2).max(255),
  category: z.string().optional(),
  description: z.string().optional(),
  unitPrice: z.number().positive(),
  imageUrl: z.string().url().optional(),
  reorderPoint: z.number().int().positive().default(10),
  optimalStock: z.number().int().positive().default(50),
});

const updateProductSchema = createProductSchema.partial();

export class ProductController {
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search as string;
      const category = req.query.category as string;

      // Build filter
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (category) {
        where.category = category;
      }

      // Get total count
      const total = await db.prisma.product.count({ where });

      // Get products
      const products = await db.prisma.product.findMany({
        where,
        include: {
          _count: {
            select: {
              inventoryItems: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await db.prisma.product.findUnique({
        where: { id },
        include: {
          inventoryItems: {
            include: {
              warehouse: true,
            },
          },
        },
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: product,
      } as ApiResponse);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const data = createProductSchema.parse(req.body);

      // Check if SKU already exists
      const existingProduct = await db.prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingProduct) {
        res.status(409).json({
          success: false,
          error: 'Product with this SKU already exists',
        } as ApiResponse);
        return;
      }

      const product = await db.prisma.product.create({
        data,
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
error: error.issues[0]?.message || 'Validation error',        } as ApiResponse);
        return;
      }
      
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateProductSchema.parse(req.body);

      // Check if product exists
      const existingProduct = await db.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        } as ApiResponse);
        return;
      }

      // Check if SKU is being changed and if it already exists
      if (data.sku && data.sku !== existingProduct.sku) {
        const skuExists = await db.prisma.product.findUnique({
          where: { sku: data.sku },
        });

        if (skuExists) {
          res.status(409).json({
            success: false,
            error: 'SKU already exists',
          } as ApiResponse);
          return;
        }
      }

      const product = await db.prisma.product.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
error: error.issues[0]?.message || 'Validation error',        } as ApiResponse);
        return;
      }
      
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await db.prisma.product.findUnique({
        where: { id },
        include: {
          inventoryItems: true,
        },
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        } as ApiResponse);
        return;
      }

      // Check if product has inventory
      if (existingProduct.inventoryItems.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete product with existing inventory',
        } as ApiResponse);
        return;
      }

      await db.prisma.product.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Product deleted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
        } as ApiResponse);
        return;
      }

      const products = await db.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      res.json({
        success: true,
        data: products,
      } as ApiResponse);
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await db.prisma.product.groupBy({
        by: ['category'],
        where: {
          category: { not: null },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          category: 'asc',
        },
      });

      res.json({
        success: true,
        data: categories,
      } as ApiResponse);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }
}