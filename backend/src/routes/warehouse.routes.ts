// src/routes/warehouse.routes.ts with Swagger docs
import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authorize } from '../middleware/auth';

const router = Router();
const warehouseController = new WarehouseController();

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by warehouse name
 *     responses:
 *       200:
 *         description: List of warehouses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', warehouseController.getWarehouses.bind(warehouseController));

/**
 * @swagger
 * /api/warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Warehouse not found
 */
router.get('/:id', warehouseController.getWarehouseById.bind(warehouseController));

/**
 * @swagger
 * /api/warehouses/{id}/stats:
 *   get:
 *     summary: Get warehouse statistics
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse statistics
 */
router.get('/:id/stats', warehouseController.getWarehouseStats.bind(warehouseController));

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Main Warehouse
 *               location:
 *                 type: string
 *                 example: 123 Main St
 *               capacity:
 *                 type: integer
 *                 example: 1000
 *               managerId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 */
router.post('/', authorize('ADMIN', 'MANAGER'), 
  warehouseController.createWarehouse.bind(warehouseController));

/**
 * @swagger
 * /api/warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               managerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 */
router.put('/:id', authorize('ADMIN', 'MANAGER'), 
  warehouseController.updateWarehouse.bind(warehouseController));

/**
 * @swagger
 * /api/warehouses/{id}:
 *   delete:
 *     summary: Delete warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 */
router.delete('/:id', authorize('ADMIN'), 
  warehouseController.deleteWarehouse.bind(warehouseController));

export default router;