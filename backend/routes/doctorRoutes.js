import { Router } from 'express';
import {
  createDoctor,
  deactivateDoctor,
  getDoctorById,
  getDoctors,
  updateDoctor
} from '../controllers/doctorController.js';
import { authenticate, authenticateIfProvided } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', authenticateIfProvided, getDoctors);
router.get('/:id', authenticateIfProvided, getDoctorById);
router.post('/', authenticate, authorizeRoles('admin'), createDoctor);
router.put('/:id', authenticate, authorizeRoles('admin'), updateDoctor);
router.delete('/:id', authenticate, authorizeRoles('admin'), deactivateDoctor);

export default router;
