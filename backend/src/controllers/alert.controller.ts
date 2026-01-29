// src/controllers/alert.controller.ts
import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { db } from '../services/database.service';
import { ApiResponse, PaginatedResponse } from '../types';

// Validation schemas
const resolveAlertSchema = z.object({
  resolutionNotes: z.string().optional(),
});

export class AlertController {
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const isResolved = req.query.resolved === 'true';
      const severity = req.query.severity as string;
      const type = req.query.type as string;
      const warehouseId = req.query.warehouseId as string;

      // Build filter
      const where: any = {};
      if (typeof isResolved === 'boolean') {
        where.isResolved = isResolved;
      }
      if (severity) {
        where.severity = severity;
      }
      if (type) {
        where.type = type;
      }
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      // Get total count
      const total = await db.prisma.alert.count({ where });

      // Get alerts
      const alerts = await db.prisma.alert.findMany({
        where,
        include: {
          inventory: {
            include: {
              product: true,
              warehouse: true,
            },
          },
          resolver: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: alerts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      } );
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getUnresolvedAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await db.prisma.alert.findMany({
        where: { isResolved: false },
        include: {
          inventory: {
            include: {
              product: true,
              warehouse: true,
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50,
      });

      res.json({
        success: true,
        data: alerts,
      } as ApiResponse);
    } catch (error) {
      console.error('Get unresolved alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const { resolutionNotes } = resolveAlertSchema.parse(req.body);

      // Check if alert exists
      const alert = await db.prisma.alert.findUnique({
        where: { id },
      });

      if (!alert) {
        res.status(404).json({
          success: false,
          error: 'Alert not found',
        } as ApiResponse);
        return;
      }

      if (alert.isResolved) {
        res.status(400).json({
          success: false,
          error: 'Alert already resolved',
        } as ApiResponse);
        return;
      }

      const updatedAlert = await db.prisma.alert.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: req.user.userId,
        },
        include: {
          resolver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Emit real-time update
      if (req.app.get('io')) {
        req.app.get('io').emit('alert:resolved', {
          alertId: id,
          resolvedBy: req.user.userId,
        });
      }

      res.json({
        success: true,
        data: updatedAlert,
        message: 'Alert resolved successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
error: error.issues[0]?.message || 'Validation error',        } as ApiResponse);
        return;
      }
      
      console.error('Resolve alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async getAlertStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalAlerts,
        unresolvedAlerts,
        alertsBySeverity,
        alertsByType,
        recentAlerts,
      ] = await Promise.all([
        // Total alerts
        db.prisma.alert.count(),

        // Unresolved alerts
        db.prisma.alert.count({
          where: { isResolved: false },
        }),

        // Alerts by severity
        db.prisma.alert.groupBy({
          by: ['severity'],
          _count: {
            _all: true,
          },
          where: { isResolved: false },
        }),

        // Alerts by type
        db.prisma.alert.groupBy({
          by: ['type'],
          _count: {
            _all: true,
          },
          where: { isResolved: false },
        }),

        // Recent alerts (last 7 days)
        db.prisma.alert.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          total: totalAlerts,
          unresolved: unresolvedAlerts,
          bySeverity: alertsBySeverity,
          byType: alertsByType,
          recent: recentAlerts,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get alert stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  async bulkResolveAlerts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { alertIds } = req.body;

      if (!Array.isArray(alertIds) || alertIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'alertIds must be a non-empty array',
        } as ApiResponse);
        return;
      }

      // Validate all alert IDs
      const validAlerts = await db.prisma.alert.findMany({
        where: {
          id: { in: alertIds },
          isResolved: false,
        },
      });

      if (validAlerts.length !== alertIds.length) {
        res.status(400).json({
          success: false,
          error: 'Some alerts are already resolved or do not exist',
        } as ApiResponse);
        return;
      }

      // Update all alerts
      await db.prisma.alert.updateMany({
        where: {
          id: { in: alertIds },
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: req.user.userId,
        },
      });

      // Emit real-time updates
      if (req.app.get('io')) {
        alertIds.forEach((alertId: string) => {
          req.app.get('io').emit('alert:resolved', {
            alertId,
            resolvedBy: req.user!.userId,
          });
        });
      }

      res.json({
        success: true,
        message: `${alertIds.length} alerts resolved successfully`,
      } as ApiResponse);
    } catch (error) {
      console.error('Bulk resolve alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }
}