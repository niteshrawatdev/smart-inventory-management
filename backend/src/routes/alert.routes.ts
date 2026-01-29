// src/routes/alert.routes.ts
import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';
import { authorize } from '../middleware/auth';

const router = Router();
const alertController = new AlertController();

router.get('/', alertController.getAlerts.bind(alertController));
router.get('/unresolved', alertController.getUnresolvedAlerts.bind(alertController));
router.get('/stats', alertController.getAlertStats.bind(alertController));
router.post('/:id/resolve', authorize('ADMIN', 'MANAGER'), 
  alertController.resolveAlert.bind(alertController));
router.post('/bulk-resolve', authorize('ADMIN', 'MANAGER'), 
  alertController.bulkResolveAlerts.bind(alertController));

export default router;