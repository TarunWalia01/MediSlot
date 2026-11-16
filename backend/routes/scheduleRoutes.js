import { Router } from 'express';
import {
  createSchedule,
  deactivateSchedule,
  getAdminSchedules,
  getDoctorSchedules,
  updateSchedule
} from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/admin', authenticate, authorizeRoles('admin'), getAdminSchedules);
router.get('/:doctorId', getDoctorSchedules);
router.post('/', authenticate, authorizeRoles('admin'), createSchedule);
router.put('/:id', authenticate, authorizeRoles('admin'), updateSchedule);
router.delete('/:id', authenticate, authorizeRoles('admin'), deactivateSchedule);

export default router;
