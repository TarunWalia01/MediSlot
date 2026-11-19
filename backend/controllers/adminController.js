import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

const appointmentStatuses = [
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed'
];

export async function getAdminDashboard(request, response) {
  try {
    const [totalDoctors, totalPatients, appointmentCounts, totalAppointments] = await Promise.all([
      Doctor.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'patient' }),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.countDocuments()
    ]);

    const countsByStatus = Object.fromEntries(
      appointmentStatuses.map((status) => [status, 0])
    );
    for (const result of appointmentCounts) {
      if (Object.hasOwn(countsByStatus, result._id)) {
        countsByStatus[result._id] = result.count;
      }
    }

    return response.json({
      success: true,
      data: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        appointmentsByStatus: countsByStatus
      }
    });
  } catch (error) {
    console.error('Could not load admin dashboard data:', error.message);
    return response.status(500).json({
      success: false,
      message: 'Unable to load dashboard statistics right now.'
    });
  }
}
