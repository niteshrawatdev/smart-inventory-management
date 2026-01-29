// src/controllers/warehouse.controller.ts - Simplified version
import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { db } from '../services/database.service';
import { ApiResponse } from '../types';

// Validation schemas
const createWarehouseSchema = z.object({
  name: z.string().min(2).max(255),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  managerId: z.string().uuid().optional(),
});

const updateWarehouseSchema = createWarehouseSchema.partial();

export class WarehouseController {
  async getWarehouses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      // Build filter
      const where: any = { isActive: true };
      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      // Get total count
      const total = await db.prisma.warehouse.count({ where });

      // Get warehouses
      const warehouses = await db.prisma.warehouse.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
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

      // Don't use the problematic type cast
      res.json({
        success: true,
        data: warehouses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get warehouses error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getWarehouseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const warehouse = await db.prisma.warehouse.findUnique({
        where: { id, isActive: true },
        include: {
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          inventoryItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!warehouse) {
        res.status(404).json({
          success: false,
          error: 'Warehouse not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: warehouse,
      } as ApiResponse);
    } catch (error) {
      console.error('Get warehouse error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getWarehouseStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const warehouse = await db.prisma.warehouse.findUnique({
        where: { id },
        include: {
          inventoryItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!warehouse) {
        res.status(404).json({
          success: false,
          error: 'Warehouse not found',
        } as ApiResponse);
        return;
      }

      // Calculate stats
      const totalProducts = warehouse.inventoryItems.length;
      const totalQuantity = warehouse.inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const lowStockItems = warehouse.inventoryItems.filter(
        item => item.quantity < 10
      ).length;

      const stats = {
        totalProducts,
        totalQuantity,
        lowStockItems,
        utilization: warehouse.capacity
          ? Math.round((totalQuantity / warehouse.capacity) * 100)
          : 0,
      };

      res.json({
        success: true,
        data: stats,
      } as ApiResponse);
    } catch (error) {
      console.error('Get warehouse stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async createWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const data = createWarehouseSchema.parse(req.body);

      const warehouse = await db.prisma.warehouse.create({
        data: {
          ...data,
          isActive: true,
        },
        include: {
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: warehouse,
        message: 'Warehouse created successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: error.issues[0]?.message || 'Validation error',
        } as ApiResponse);
        return;
      }
      
      console.error('Create warehouse error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async updateWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateWarehouseSchema.parse(req.body);

      // Check if warehouse exists
      const existingWarehouse = await db.prisma.warehouse.findUnique({
        where: { id },
      });

      if (!existingWarehouse) {
        res.status(404).json({
          success: false,
          error: 'Warehouse not found',
        } as ApiResponse);
        return;
      }

      const warehouse = await db.prisma.warehouse.update({
        where: { id },
        data,
        include: {
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: warehouse,
        message: 'Warehouse updated successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: error.issues[0]?.message || 'Validation error',
        } as ApiResponse);
        return;
      }
      
      console.error('Update warehouse error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async deleteWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if warehouse exists
      const existingWarehouse = await db.prisma.warehouse.findUnique({
        where: { id },
      });

      if (!existingWarehouse) {
        res.status(404).json({
          success: false,
          error: 'Warehouse not found',
        } as ApiResponse);
        return;
      }

      // Soft delete
      await db.prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Warehouse deleted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Delete warehouse error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }
}