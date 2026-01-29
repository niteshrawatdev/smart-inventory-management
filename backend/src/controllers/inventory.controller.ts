// src/controllers/inventory.controller.ts - FIXED VERSION
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../services/database.service';
import { ApiResponse } from '../types';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Validation schemas
const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int(),
  movementType: z.enum(['incoming', 'outgoing', 'adjustment']),
  reason: z.string().optional(),
  location: z.string().optional(),
});

export class InventoryController {
  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const warehouseId = req.query.warehouseId as string;
      const productId = req.query.productId as string;
      const skip = (page - 1) * limit;

      // Build filter
      const where: any = {};
      if (warehouseId) where.warehouseId = warehouseId;
      if (productId) where.productId = productId;

      // Get total count
      const total = await db.prisma.inventory.count({ where });

      // Get inventory items with related data
      const inventory = await db.prisma.inventory.findMany({
        where,
        include: {
          product: true,
          warehouse: true,
        },
        skip,
        take: limit,
        orderBy: { lastUpdated: 'desc' },
      });

      // Fix: Use proper response type
      res.json({
        success: true,
        data: inventory,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      // Simple low stock detection: quantity < 10
      const lowStockItems = await db.prisma.inventory.findMany({
        where: {
          quantity: { lt: 10 },
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      res.json({
        success: true,
        data: lowStockItems,
      } as ApiResponse);
    } catch (error) {
      console.error('Get low stock error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getOverstock(req: Request, res: Response): Promise<void> {
    try {
      // Simple overstock detection: quantity > 100
      const overstockItems = await db.prisma.inventory.findMany({
        where: {
          quantity: { gt: 100 },
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      res.json({
        success: true,
        data: overstockItems,
      } as ApiResponse);
    } catch (error) {
      console.error('Get overstock error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async adjustStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productId, warehouseId, quantity, movementType, reason, location } = 
        adjustStockSchema.parse(req.body);

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      // Simple stock adjustment
      let inventoryItem = await db.prisma.inventory.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId,
            productId,
          },
        },
      });

      const previousQuantity = inventoryItem?.quantity || 0;
      let newQuantity = previousQuantity;

      // Calculate new quantity
      switch (movementType) {
        case 'incoming':
          newQuantity = previousQuantity + quantity;
          break;
        case 'outgoing':
          newQuantity = previousQuantity - quantity;
          if (newQuantity < 0) {
            res.status(400).json({
              success: false,
              error: 'Insufficient stock',
            } as ApiResponse);
            return;
          }
          break;
        case 'adjustment':
          newQuantity = quantity;
          break;
      }

      // Update or create inventory item
      inventoryItem = await db.prisma.inventory.upsert({
        where: {
          warehouseId_productId: {
            warehouseId,
            productId,
          },
        },
        update: {
          quantity: newQuantity,
          lastUpdated: new Date(),
          locationInWarehouse: location,
        },
        create: {
          warehouseId,
          productId,
          quantity: newQuantity,
          locationInWarehouse: location,
        },
      });

      // Create stock movement record
      await db.prisma.stockMovement.create({
        data: {
          inventoryId: inventoryItem.id,
          movementType,
          quantityChange: Math.abs(quantity),
          previousQuantity,
          newQuantity,
          reason,
          userId: req.user.userId,
        },
      });

      // Check for alerts
      await this.checkAndCreateAlerts(inventoryItem, previousQuantity, newQuantity);

      res.json({
        success: true,
        data: inventoryItem,
        message: 'Stock adjusted successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: error.issues[0]?.message || 'Validation error', // Fixed: error.issues instead of error.errors
        } as ApiResponse);
        return;
      }
      
      console.error('Adjust stock error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse);
    }
  }

  async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const trends = await db.prisma.stockMovement.findMany({
        where: {
          createdAt: { gte: dateThreshold },
        },
        include: {
          inventory: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({
        success: true,
        data: trends,
      } as ApiResponse);
    } catch (error) {
      console.error('Get trends error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async exportInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await db.prisma.inventory.findMany({
        include: {
          product: true,
          warehouse: true,
        },
        take: 100, // Limit for demo
      });

      // Simple CSV export
      const csvRows = [
        ['SKU', 'Product', 'Warehouse', 'Quantity', 'Location', 'Last Updated'],
        ...inventory.map(item => [
          item.product.sku,
          item.product.name,
          item.warehouse.name,
          item.quantity,
          item.locationInWarehouse || 'N/A',
          item.lastUpdated.toISOString().split('T')[0],
        ]),
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');

      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=inventory.csv');
      res.send(csvContent);
    } catch (error) {
      console.error('Export inventory error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  private async checkAndCreateAlerts(
    inventoryItem: any,
    previousQuantity: number,
    newQuantity: number
  ): Promise<void> {
    try {
      const product = await db.prisma.product.findUnique({
        where: { id: inventoryItem.productId },
      });

      if (!product) return;

      // Check for low stock
      if (newQuantity <= product.reorderPoint && previousQuantity > product.reorderPoint) {
        await db.prisma.alert.create({
          data: {
            type: 'low_stock',
            severity: newQuantity <= product.reorderPoint / 2 ? 'high' : 'medium',
            message: `Low stock alert for ${product.name}. Current: ${newQuantity}, Reorder point: ${product.reorderPoint}`,
            inventoryId: inventoryItem.id,
            warehouseId: inventoryItem.warehouseId,
          },
        });
      }

      // Check for overstock
      if (newQuantity > product.optimalStock * 1.5) {
        await db.prisma.alert.create({
          data: {
            type: 'overstock',
            severity: 'medium',
            message: `Overstock alert for ${product.name}. Current: ${newQuantity}, Optimal: ${product.optimalStock}`,
            inventoryId: inventoryItem.id,
            warehouseId: inventoryItem.warehouseId,
          },
        });
      }
    } catch (error) {
      console.error('Error creating alerts:', error);
    }
  }
}