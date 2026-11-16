import Doctor from '../models/Doctor.js';
import Schedule from '../models/Schedule.js';
import { HttpError, sendControllerError } from '../utils/httpError.js';
import {
  generateScheduleSlots,
  getClinicTimeZone,
  getClinicToday,
  getDayOfWeek,
  isValidClinicDate,
  parseTimeToMinutes
} from '../utils/scheduleTime.js';

const objectIdPattern = /^[a-f\d]{24}$/i;

export async function getDoctorSchedules(request, response) {
  const { doctorId } = request.params;
  const date = request.query.date;

  if (!objectIdPattern.test(doctorId)) {
    return response.status(400).json({ success: false, message: 'Doctor ID is invalid.' });
  }

  if (date !== undefined && !isValidClinicDate(date)) {
    return response.status(400).json({
      success: false,
      message: 'Date must be a real calendar date in YYYY-MM-DD format.'
    });
  }

  try {
    const doctorExists = await Doctor.exists({ _id: doctorId, isActive: true });
    if (!doctorExists) {
      return response.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const filters = {
      doctorId,
      isActive: true,
      date: date || { $gte: getClinicToday() }
    };
    const schedules = await Schedule.find(filters).sort({ date: 1 }).limit(60).lean();
    const timeZone = getClinicTimeZone();
    const now = new Date();
    const data = schedules.map((schedule) => ({
      ...schedule,
      slots: schedule.slots
        .filter((slot) => !slot.isBooked && slot.startTime > now)
        .map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          startTimeLocal: formatClinicTime(slot.startTime, timeZone),
          endTimeLocal: formatClinicTime(slot.endTime, timeZone)
        }))
    })).filter((schedule) => schedule.slots.length > 0);

    return response.json({ success: true, data });
  } catch (error) {
    return sendControllerError(error, response, 'schedule');
  }
}

export async function getAdminSchedules(request, response) {
  const filters = {};
  const { doctorId, date, isActive } = request.query;

  if (doctorId !== undefined) {
    if (typeof doctorId !== 'string' || !objectIdPattern.test(doctorId)) {
      return response.status(400).json({ success: false, message: 'Doctor ID is invalid.' });
    }
    filters.doctorId = doctorId;
  }

  if (date !== undefined) {
    if (!isValidClinicDate(date)) {
      return response.status(400).json({
        success: false,
        message: 'Date must be a real calendar date in YYYY-MM-DD format.'
      });
    }
    filters.date = date;
  }

  if (isActive !== undefined) {
    if (!['true', 'false'].includes(isActive)) {
      return response.status(400).json({
        success: false,
        message: 'isActive must be true or false.'
      });
    }
    filters.isActive = isActive === 'true';
  }

  try {
    const schedules = await Schedule.find(filters)
      .populate('doctorId', 'name specialization isActive')
      .sort({ date: 1, doctorId: 1 })
      .limit(200)
      .lean();

    return response.json({ success: true, data: schedules });
  } catch (error) {
    return sendControllerError(error, response, 'schedule');
  }
}

export async function createSchedule(request, response) {
  const input = validateScheduleInput(request.body);
  if (input.error) {
    return response.status(400).json({ success: false, message: input.error });
  }

  try {
    const doctor = await Doctor.findOne({ _id: input.data.doctorId, isActive: true });
    if (!doctor) {
      throw new HttpError(404, 'Active doctor not found.');
    }

    const dayOfWeek = getDayOfWeek(input.data.date);
    validateDoctorAvailability(doctor, dayOfWeek);
    const schedule = new Schedule({
      ...input.data,
      dayOfWeek,
      slots: createFutureSlots(input.data)
    });
    await schedule.save();

    return response.status(201).json({
      success: true,
      message: 'Schedule created successfully.',
      data: schedule
    });
  } catch (error) {
    return sendControllerError(error, response, 'schedule');
  }
}

export async function updateSchedule(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({ success: false, message: 'Schedule ID is invalid.' });
  }

  try {
    const schedule = await Schedule.findById(request.params.id);
    if (!schedule) {
      throw new HttpError(404, 'Schedule not found.');
    }

    const input = validateScheduleInput(request.body, schedule);
    if (input.error) {
      return response.status(400).json({ success: false, message: input.error });
    }

    if (schedule.slots.some((slot) => slot.isBooked)) {
      throw new HttpError(409, 'A schedule with booked slots cannot be edited.');
    }

    const doctor = await Doctor.findOne({ _id: input.data.doctorId, isActive: true });
    if (!doctor) {
      throw new HttpError(404, 'Active doctor not found.');
    }

    const dayOfWeek = getDayOfWeek(input.data.date);
    validateDoctorAvailability(doctor, dayOfWeek);
    schedule.set({
      ...input.data,
      dayOfWeek,
      slots: createFutureSlots(input.data)
    });
    await schedule.save();

    return response.json({
      success: true,
      message: 'Schedule updated successfully.',
      data: schedule
    });
  } catch (error) {
    return sendControllerError(error, response, 'schedule');
  }
}

export async function deactivateSchedule(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({ success: false, message: 'Schedule ID is invalid.' });
  }

  try {
    const schedule = await Schedule.findById(request.params.id);
    if (!schedule) {
      throw new HttpError(404, 'Schedule not found.');
    }

    schedule.isActive = false;
    await schedule.save();

    return response.json({
      success: true,
      message: 'Schedule deactivated successfully.',
      data: schedule
    });
  } catch (error) {
    return sendControllerError(error, response, 'schedule');
  }
}

function validateScheduleInput(body, existingSchedule = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const allowedFields = [
    'doctorId',
    'date',
    'workingHours',
    'slotDuration',
    'breaks',
    'isActive'
  ];
  const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unknownField) {
    return { error: `Unsupported schedule field: ${unknownField}.` };
  }
  if (Object.values(body).some((value) => value === null)) {
    return { error: 'Schedule fields cannot be null.' };
  }
  if (existingSchedule && Object.keys(body).length === 0) {
    return { error: 'Provide at least one schedule field to update.' };
  }

  const data = {
    doctorId: body.doctorId ?? existingSchedule?.doctorId?.toString(),
    date: body.date ?? existingSchedule?.date,
    workingHours: body.workingHours ?? existingSchedule?.workingHours?.toObject(),
    slotDuration: body.slotDuration ?? existingSchedule?.slotDuration,
    breaks: body.breaks ?? existingSchedule?.breaks?.map((period) => period.toObject()) ?? [],
    isActive: body.isActive ?? existingSchedule?.isActive ?? true
  };

  if (typeof data.doctorId !== 'string' || !objectIdPattern.test(data.doctorId)) {
    return { error: 'doctorId must be a valid ID.' };
  }

  if (!isValidClinicDate(data.date)) {
    return { error: 'Date must be a real calendar date in YYYY-MM-DD format.' };
  }

  if (data.date < getClinicToday()) {
    return { error: 'Schedules cannot be created or moved to a past date.' };
  }

  if (
    !data.workingHours
    || typeof data.workingHours !== 'object'
    || Array.isArray(data.workingHours)
    || Object.keys(data.workingHours).some(
      (field) => !['startTime', 'endTime'].includes(field)
    )
  ) {
    return { error: 'workingHours must include startTime and endTime.' };
  }

  const openingTime = parseTimeToMinutes(data.workingHours.startTime);
  const closingTime = parseTimeToMinutes(data.workingHours.endTime);
  if (openingTime === null || closingTime === null || openingTime >= closingTime) {
    return { error: 'Working hours must use HH:mm and end after they start.' };
  }

  if (
    typeof data.slotDuration !== 'number'
    || !Number.isInteger(data.slotDuration)
    || data.slotDuration < 5
    || data.slotDuration > 480
  ) {
    return { error: 'slotDuration must be a whole number between 5 and 480 minutes.' };
  }

  if (!Array.isArray(data.breaks)) {
    return { error: 'breaks must be an array of start and end times.' };
  }

  const normalizedBreaks = [];
  for (const breakPeriod of data.breaks) {
    if (
      !breakPeriod
      || typeof breakPeriod !== 'object'
      || Array.isArray(breakPeriod)
      || Object.keys(breakPeriod).some(
        (field) => !['startTime', 'endTime'].includes(field)
      )
    ) {
      return { error: 'Each break must contain only startTime and endTime.' };
    }

    const startTime = parseTimeToMinutes(breakPeriod.startTime);
    const endTime = parseTimeToMinutes(breakPeriod.endTime);
    if (
      startTime === null
      || endTime === null
      || startTime >= endTime
      || startTime < openingTime
      || endTime > closingTime
    ) {
      return { error: 'Breaks must be valid and fall within working hours.' };
    }

    normalizedBreaks.push({
      startTime: breakPeriod.startTime,
      endTime: breakPeriod.endTime,
      startMinute: startTime,
      endMinute: endTime
    });
  }

  normalizedBreaks.sort((first, second) => first.startMinute - second.startMinute);
  for (let index = 1; index < normalizedBreaks.length; index += 1) {
    if (normalizedBreaks[index - 1].endMinute > normalizedBreaks[index].startMinute) {
      return { error: 'Break periods cannot overlap.' };
    }
  }

  if (typeof data.isActive !== 'boolean') {
    return { error: 'isActive must be true or false.' };
  }

  return {
    data: {
      doctorId: data.doctorId,
      date: data.date,
      workingHours: data.workingHours,
      slotDuration: data.slotDuration,
      breaks: normalizedBreaks.map(({ startTime, endTime }) => ({ startTime, endTime })),
      isActive: data.isActive
    }
  };
}

function createFutureSlots(scheduleData) {
  try {
    const allSlots = generateScheduleSlots(
      scheduleData.date,
      scheduleData.workingHours,
      scheduleData.slotDuration,
      scheduleData.breaks,
      getClinicTimeZone()
    );
    const futureSlots = allSlots.filter((slot) => slot.startTime > new Date());
    if (futureSlots.length === 0) {
      throw new HttpError(400, 'This schedule has no future appointment slots.');
    }
    return futureSlots;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(400, error.message);
  }
}

function validateDoctorAvailability(doctor, dayOfWeek) {
  if (doctor.availableDays.length > 0 && !doctor.availableDays.includes(dayOfWeek)) {
    throw new HttpError(400, `The doctor is not available on ${dayOfWeek}.`);
  }
}

function formatClinicTime(date, timeZone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date);
}
