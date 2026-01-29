// src/routes/inventory.routes.ts
import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authorize } from '../middleware/auth';

const router = Router();
const inventoryController = new InventoryController();

router.get('/', inventoryController.getInventory.bind(inventoryController));
router.get('/low-stock', inventoryController.getLowStock.bind(inventoryController));
router.get('/overstock', inventoryController.getOverstock.bind(inventoryController));
router.post('/adjust', authorize('ADMIN', 'MANAGER'), 
  inventoryController.adjustStock.bind(inventoryController));
router.get('/trends', inventoryController.getTrends.bind(inventoryController));
router.get('/export', inventoryController.exportInventory.bind(inventoryController));

export default router;