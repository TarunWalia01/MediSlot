import { Router } from 'express';
import { getAdminAppointments } from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/health', authenticate, authorizeRoles('admin'), (request, response) => {
  response.json({
    success: true,
    message: 'Admin authorization is working.'
  });
});
router.get('/appointments', authenticate, authorizeRoles('admin'), getAdminAppointments);

export default router;
