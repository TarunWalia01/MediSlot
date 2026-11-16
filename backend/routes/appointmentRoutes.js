import { Router } from 'express';
import {
  cancelMyAppointment,
  createAppointment,
  getAdminAppointments,
  getAppointmentById,
  getMyAppointments,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/', authenticate, authorizeRoles('patient'), createAppointment);
router.get('/my', authenticate, authorizeRoles('patient'), getMyAppointments);
router.get('/', authenticate, authorizeRoles('admin'), getAdminAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.patch('/:id/cancel', authenticate, authorizeRoles('patient'), cancelMyAppointment);
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('admin'),
  updateAppointmentStatus
);

export default router;
