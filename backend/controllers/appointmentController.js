import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Schedule from '../models/Schedule.js';
import Service from '../models/Service.js';
import { supportsMongoTransactions } from '../config/db.js';
import { HttpError, sendControllerError } from '../utils/httpError.js';
import { getClinicToday, isValidClinicDate } from '../utils/scheduleTime.js';

const objectIdPattern = /^[a-f\d]{24}$/i;
const activeStatuses = ['pending', 'confirmed', 'completed'];
const populatedAppointmentFields = [
  { path: 'doctorId', select: 'name specialization profileImage consultationFee' },
  { path: 'serviceId', select: 'name description fee duration' },
  { path: 'patientId', select: 'name email phone' }
];

export async function createAppointment(request, response) {
  const input = validateBookingInput(request.body);
  if (input.error) {
    return response.status(400).json({ success: false, message: input.error });
  }

  let appointmentId;
  try {
    if (supportsMongoTransactions()) {
      appointmentId = await createBookingInTransaction(request.user._id, input.data);
    } else {
      appointmentId = await createBookingWithAtomicClaim(request.user._id, input.data);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate(populatedAppointmentFields);
    return response.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: appointment
    });
  } catch (error) {
    return sendControllerError(error, response, 'appointment');
  }
}

export async function getMyAppointments(request, response) {
  const filters = { patientId: request.user._id };
  const status = readStatusFilter(request.query.status, response);
  if (status === null) {
    return;
  }
  if (status) {
    filters.status = status;
  }

  try {
    const appointments = await Appointment.find(filters)
      .populate(populatedAppointmentFields)
      .sort({ appointmentDate: -1, 'timeSlot.startTime': -1 })
      .limit(200)
      .lean();

    return response.json({ success: true, data: appointments });
  } catch (error) {
    return sendControllerError(error, response, 'appointment');
  }
}

export async function getAdminAppointments(request, response) {
  const filters = {};
  const { doctorId, patientId, date, status, page = '1', limit = '20' } = request.query;

  for (const [field, value] of [['doctorId', doctorId], ['patientId', patientId]]) {
    if (value !== undefined) {
      if (typeof value !== 'string' || !objectIdPattern.test(value)) {
        return response.status(400).json({
          success: false,
          message: `${field} must be a valid ID.`
        });
      }
      filters[field] = value;
    }
  }

  if (date !== undefined) {
    if (!isValidClinicDate(date)) {
      return response.status(400).json({
        success: false,
        message: 'Date must be a real calendar date in YYYY-MM-DD format.'
      });
    }
    filters.appointmentDate = date;
  }

  const filteredStatus = readStatusFilter(status, response);
  if (filteredStatus === null) {
    return;
  }
  if (filteredStatus) {
    filters.status = filteredStatus;
  }

  const pageNumber = parsePositiveInteger(page);
  const pageSize = parsePositiveInteger(limit);
  if (!pageNumber || !pageSize || pageSize > 100) {
    return response.status(400).json({
      success: false,
      message: 'page and limit must be positive integers, and limit cannot exceed 100.'
    });
  }

  try {
    const [appointments, total] = await Promise.all([
      Appointment.find(filters)
        .populate(populatedAppointmentFields)
        .sort({ appointmentDate: 1, 'timeSlot.startTime': 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Appointment.countDocuments(filters)
    ]);

    return response.json({
      success: true,
      data: appointments,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    return sendControllerError(error, response, 'appointment');
  }
}

export async function getAppointmentById(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({ success: false, message: 'Appointment ID is invalid.' });
  }

  try {
    const appointment = await Appointment.findById(request.params.id);

    if (!appointment) {
      return response.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (
      request.user.role !== 'admin'
      && appointment.patientId.toString() !== request.user._id.toString()
    ) {
      return response.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    await appointment.populate(populatedAppointmentFields);
    return response.json({ success: true, data: appointment });
  } catch (error) {
    return sendControllerError(error, response, 'appointment');
  }
}

export async function cancelMyAppointment(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({ success: false, message: 'Appointment ID is invalid.' });
  }

  try {
    const appointment = await changeAppointmentStatus({
      appointmentId: request.params.id,
      patientId: request.user._id,
      nextStatus: 'cancelled',
      patientInitiated: true
    });

    return response.json({
      success: true,
      message: 'Appointment cancelled successfully.',
      data: appointment
    });
  } catch (error) {
    return sendControllerError(error, response, 'appointment');
  }
}

export async function updateAppointmentStatus(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({ success: false, message: 'Appointment ID is invalid.' });
  }

  const body = request.body || {};
  const unsupportedField = Object.keys(body).find((field) => field !== 'status');
  if (unsupportedField) {
    return response.status(400).json({
      success: false,
      message: `Unsupported appointment field: ${unsupportedField}.`
    });
  }
  const { status } = body;
  if (!['confirmed', 'rejected', 'cancelled', 'completed'].includes(status)) {
    return response.status(400).json({
      success: false,
      message: 'status must be confirmed, rejected, cancelled, or completed.'
    });
  }

  try {
    const appointment = await changeAppointmentStatus({
      appointmentId: request.params.id,
      nextStatus: status,
      patientInitiated: false
    });

    return response.json({
      success: true,
      message: `Appointment ${status} successfully.`,
      data: appointment
    });
  } catch (error) {
    return sendControllerError(error, response, 'appointment');
  }
}

async function createBookingInTransaction(patientId, booking) {
  const session = await mongoose.startSession();
  let appointmentId;

  try {
    await session.withTransaction(async () => {
      const { doctor, service, schedule, slot, appointmentEnd } = await validateBooking(
        booking,
        session
      );
      await ensureNoAppointmentOverlap(
        doctor._id,
        schedule.date,
        slot.startTime,
        appointmentEnd,
        session
      );

      const newAppointment = new Appointment({
        patientId,
        doctorId: doctor._id,
        serviceId: service._id,
        scheduleId: schedule._id,
        appointmentDate: schedule.date,
        timeSlot: {
          startTime: slot.startTime,
          endTime: appointmentEnd
        },
        reason: booking.reason
      });

      const claimedSchedule = await claimScheduleSlot(
        schedule,
        slot,
        newAppointment._id,
        session
      );
      if (!claimedSchedule) {
        throw new HttpError(409, 'That appointment slot is no longer available.');
      }

      await newAppointment.save({ session });
      appointmentId = newAppointment._id;
    });

    return appointmentId;
  } finally {
    await session.endSession();
  }
}

async function createBookingWithAtomicClaim(patientId, booking) {
  const { doctor, service, schedule, slot, appointmentEnd } = await validateBooking(
    booking
  );
  await ensureNoAppointmentOverlap(doctor._id, schedule.date, slot.startTime, appointmentEnd);

  const appointment = new Appointment({
    patientId,
    doctorId: doctor._id,
    serviceId: service._id,
    scheduleId: schedule._id,
    appointmentDate: schedule.date,
    timeSlot: {
      startTime: slot.startTime,
      endTime: appointmentEnd
    },
    reason: booking.reason
  });
  const claimedSchedule = await claimScheduleSlot(schedule, slot, appointment._id);
  if (!claimedSchedule) {
    throw new HttpError(409, 'That appointment slot is no longer available.');
  }

  try {
    await appointment.save();
    return appointment._id;
  } catch (error) {
    try {
      const released = await releaseScheduleSlot(appointment);
      if (!released) {
        throw new Error('Matching booked schedule slot was not found.');
      }
    } catch (cleanupError) {
      console.error('Appointment slot rollback failed:', cleanupError.message);
      throw new HttpError(
        500,
        'Booking failed and the slot could not be released. Contact an administrator.'
      );
    }
    throw error;
  }
}

async function validateBooking(booking, session = null) {
  const doctorQuery = Doctor.findOne({ _id: booking.doctorId, isActive: true });
  const serviceQuery = Service.findOne({ _id: booking.serviceId, isActive: true });
  const scheduleQuery = Schedule.findOne({
      _id: booking.scheduleId,
      doctorId: booking.doctorId,
      isActive: true
  });

  let doctor;
  let service;
  let schedule;
  if (session) {
    doctor = await doctorQuery.session(session);
    service = await serviceQuery.session(session);
    schedule = await scheduleQuery.session(session);
  } else {
    [doctor, service, schedule] = await Promise.all([
      doctorQuery,
      serviceQuery,
      scheduleQuery
    ]);
  }

  if (!doctor) {
    throw new HttpError(404, 'Active doctor not found.');
  }
  if (!service) {
    throw new HttpError(404, 'Active service not found.');
  }
  if (!schedule) {
    throw new HttpError(404, 'Active schedule not found.');
  }
  if (schedule.date < getClinicToday()) {
    throw new HttpError(400, 'Appointments cannot be booked for a past date.');
  }

  const doctorOffersService = doctor.services.some(
    (serviceId) => serviceId.toString() === service._id.toString()
  );
  if (!doctorOffersService) {
    throw new HttpError(400, 'The selected service is not offered by this doctor.');
  }

  const requestedStartTime = new Date(booking.slotStartTime);
  const slot = schedule.slots.find(
    (candidate) => candidate.startTime.getTime() === requestedStartTime.getTime()
  );
  if (!slot || slot.isBooked || slot.appointmentId) {
    throw new HttpError(409, 'That appointment slot is no longer available.');
  }
  if (slot.startTime <= new Date()) {
    throw new HttpError(400, 'Appointments cannot be booked for a past time slot.');
  }

  const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / 60000;
  if (service.duration > slotDuration) {
    throw new HttpError(400, 'The selected service takes longer than this appointment slot.');
  }

  return {
    doctor,
    service,
    schedule,
    slot,
    appointmentEnd: new Date(slot.startTime.getTime() + service.duration * 60000)
  };
}

async function ensureNoAppointmentOverlap(doctorId, appointmentDate, startTime, endTime, session) {
  const query = Appointment.findOne({
    doctorId,
    appointmentDate,
    status: { $in: activeStatuses },
    'timeSlot.startTime': { $lt: endTime },
    'timeSlot.endTime': { $gt: startTime }
  });
  if (session) {
    query.session(session);
  }

  if (await query) {
    throw new HttpError(409, 'The doctor already has an overlapping appointment.');
  }
}

async function claimScheduleSlot(schedule, slot, appointmentId, session = null) {
  const options = { new: true };
  if (session) {
    options.session = session;
  }

  return Schedule.findOneAndUpdate(
    {
      _id: schedule._id,
      doctorId: schedule.doctorId,
      date: schedule.date,
      isActive: true,
      slots: {
        $elemMatch: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
          appointmentId: null
        }
      }
    },
    {
      $set: {
        'slots.$.isBooked': true,
        'slots.$.appointmentId': appointmentId
      }
    },
    options
  );
}

async function changeAppointmentStatus({
  appointmentId,
  patientId = null,
  nextStatus,
  patientInitiated
}) {
  if (supportsMongoTransactions()) {
    return changeStatusInTransaction({
      appointmentId,
      patientId,
      nextStatus,
      patientInitiated
    });
  }

  return changeStatusWithCompensation({
    appointmentId,
    patientId,
    nextStatus,
    patientInitiated
  });
}

async function changeStatusInTransaction({
  appointmentId,
  patientId,
  nextStatus,
  patientInitiated
}) {
  const session = await mongoose.startSession();
  let updatedAppointment;

  try {
    await session.withTransaction(async () => {
      const filters = { _id: appointmentId };
      if (patientId) {
        filters.patientId = patientId;
      }

      const appointment = await Appointment.findOne(filters).session(session);
      if (!appointment) {
        throw new HttpError(404, 'Appointment not found.');
      }
      validateStatusTransition(appointment, nextStatus, patientInitiated);
      const updated = await Appointment.findOneAndUpdate(
        { ...filters, status: appointment.status },
        { $set: { status: nextStatus } },
        { new: true, session }
      );
      if (!updated) {
        throw new HttpError(409, 'Appointment status changed before this request completed.');
      }

      if (['cancelled', 'rejected'].includes(nextStatus)) {
        const released = await releaseScheduleSlot(appointment, session);
        if (!released) {
          throw new HttpError(409, 'The appointment slot could not be released safely.');
        }
      }

      updatedAppointment = updated;
    });
  } finally {
    await session.endSession();
  }

  return Appointment.findById(updatedAppointment._id).populate(populatedAppointmentFields);
}

async function changeStatusWithCompensation({
  appointmentId,
  patientId,
  nextStatus,
  patientInitiated
}) {
  const filters = { _id: appointmentId };
  if (patientId) {
    filters.patientId = patientId;
  }

  const appointment = await Appointment.findOne(filters);
  if (!appointment) {
    throw new HttpError(404, 'Appointment not found.');
  }
  validateStatusTransition(appointment, nextStatus, patientInitiated);

  const updated = await Appointment.findOneAndUpdate(
    { ...filters, status: appointment.status },
    { $set: { status: nextStatus } },
    { new: true }
  );
  if (!updated) {
    throw new HttpError(409, 'Appointment status changed before this request completed.');
  }

  if (['cancelled', 'rejected'].includes(nextStatus)) {
    try {
      const released = await releaseScheduleSlot(appointment);
      if (!released) {
        throw new Error('Matching booked schedule slot was not found.');
      }
    } catch (error) {
      const restored = await Appointment.updateOne(
        { _id: appointment._id, status: nextStatus },
        { $set: { status: appointment.status } }
      );
      if (restored.modifiedCount !== 1) {
        console.error('Appointment status rollback failed:', error.message);
        throw new HttpError(
          500,
          'Appointment cancellation could not complete safely. Contact an administrator.'
        );
      }
      throw new HttpError(409, 'The appointment slot could not be released safely.');
    }
  }

  return Appointment.findById(updated._id).populate(populatedAppointmentFields);
}

async function releaseScheduleSlot(appointment, session = null) {
  const filters = {
    _id: appointment.scheduleId,
    doctorId: appointment.doctorId,
    date: appointment.appointmentDate,
    slots: {
      $elemMatch: {
        startTime: appointment.timeSlot.startTime,
        isBooked: true,
        appointmentId: appointment._id
      }
    }
  };
  const update = {
    $set: {
      'slots.$.isBooked': false,
      'slots.$.appointmentId': null
    }
  };
  const options = {};
  if (session) {
    options.session = session;
  }

  const result = await Schedule.updateOne(filters, update, options);
  return result.modifiedCount === 1;
}

function validateStatusTransition(appointment, nextStatus, patientInitiated) {
  const allowedTransitions = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['cancelled', 'completed'],
    rejected: [],
    cancelled: [],
    completed: []
  };

  if (!allowedTransitions[appointment.status]?.includes(nextStatus)) {
    throw new HttpError(
      409,
      `An appointment cannot transition from ${appointment.status} to ${nextStatus}.`
    );
  }

  if (patientInitiated) {
    if (new Date(appointment.timeSlot.startTime) <= new Date()) {
      throw new HttpError(400, 'Appointments cannot be cancelled after they have started.');
    }
    return;
  }

  if (
    nextStatus === 'completed'
    && new Date(appointment.timeSlot.endTime) > new Date()
  ) {
    throw new HttpError(400, 'An appointment can only be completed after its scheduled end.');
  }
}

function validateBookingInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const allowedFields = ['doctorId', 'scheduleId', 'serviceId', 'slotStartTime', 'reason'];
  const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unknownField) {
    return { error: `Unsupported appointment field: ${unknownField}.` };
  }

  for (const field of ['doctorId', 'scheduleId', 'serviceId']) {
    if (typeof body[field] !== 'string' || !objectIdPattern.test(body[field])) {
      return { error: `${field} must be a valid ID.` };
    }
  }

  if (typeof body.slotStartTime !== 'string') {
    return { error: 'slotStartTime must be a valid ISO date-time string.' };
  }
  const slotStartTime = new Date(body.slotStartTime);
  if (!Number.isFinite(slotStartTime.getTime())) {
    return { error: 'slotStartTime must be a valid ISO date-time string.' };
  }

  let reason = '';
  if (body.reason !== undefined) {
    if (typeof body.reason !== 'string' || body.reason.trim().length > 500) {
      return { error: 'reason must be text no longer than 500 characters.' };
    }
    reason = body.reason.trim();
  }

  return {
    data: {
      doctorId: body.doctorId,
      scheduleId: body.scheduleId,
      serviceId: body.serviceId,
      slotStartTime: slotStartTime.toISOString(),
      reason
    }
  };
}

function readStatusFilter(value, response) {
  if (value === undefined || value === '') {
    return '';
  }
  if (!['pending', 'confirmed', 'rejected', 'cancelled', 'completed'].includes(value)) {
    response.status(400).json({
      success: false,
      message: 'status must be pending, confirmed, rejected, cancelled, or completed.'
    });
    return null;
  }
  return value;
}

function parsePositiveInteger(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}
