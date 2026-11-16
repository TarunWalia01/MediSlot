import { Router } from 'express';
import {
  createService,
  deactivateService,
  getServiceById,
  getServices,
  updateService
} from '../controllers/serviceController.js';
import { authenticate, authenticateIfProvided } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', authenticateIfProvided, getServices);
router.get('/:id', authenticateIfProvided, getServiceById);
router.post('/', authenticate, authorizeRoles('admin'), createService);
router.put('/:id', authenticate, authorizeRoles('admin'), updateService);
router.delete('/:id', authenticate, authorizeRoles('admin'), deactivateService);

export default router;
