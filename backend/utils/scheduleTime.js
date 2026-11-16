const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidClinicDate(date) {
  if (typeof date !== 'string' || !datePattern.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === date;
}

export function parseTimeToMinutes(time) {
  if (typeof time !== 'string' || !timePattern.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getClinicTimeZone() {
  const timeZone = process.env.CLINIC_TIME_ZONE || 'Asia/Kolkata';
  new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
  return timeZone;
}

export function getClinicToday(timeZone = getClinicTimeZone()) {
  const parts = getZonedParts(new Date(), timeZone);
  return formatDateParts(parts);
}

export function getDayOfWeek(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function clinicLocalTimeToUtc(date, time, timeZone = getClinicTimeZone()) {
  if (!isValidClinicDate(date) || parseTimeToMinutes(time) === null) {
    throw new Error('A valid clinic date and time are required.');
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const targetUtcValue = Date.UTC(year, month - 1, day, hours, minutes);
  let candidateUtcValue = targetUtcValue;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const localParts = getZonedParts(new Date(candidateUtcValue), timeZone);
    const representedUtcValue = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute
    );
    const adjustment = targetUtcValue - representedUtcValue;
    candidateUtcValue += adjustment;
    if (adjustment === 0) {
      break;
    }
  }

  const resolvedParts = getZonedParts(new Date(candidateUtcValue), timeZone);
  if (
    resolvedParts.year !== year
    || resolvedParts.month !== month
    || resolvedParts.day !== day
    || resolvedParts.hour !== hours
    || resolvedParts.minute !== minutes
  ) {
    throw new Error('The selected local time does not exist in the clinic time zone.');
  }

  return new Date(candidateUtcValue);
}

export function generateScheduleSlots(date, workingHours, slotDuration, breaks, timeZone) {
  const openingTime = parseTimeToMinutes(workingHours.startTime);
  const closingTime = parseTimeToMinutes(workingHours.endTime);

  if (openingTime === null || closingTime === null || openingTime >= closingTime) {
    throw new Error('Working hours must have a valid start before the end.');
  }

  const breakIntervals = breaks.map((breakPeriod) => ({
    start: parseTimeToMinutes(breakPeriod.startTime),
    end: parseTimeToMinutes(breakPeriod.endTime)
  }));
  const slots = [];

  for (
    let slotStart = openingTime;
    slotStart + slotDuration <= closingTime;
    slotStart += slotDuration
  ) {
    const slotEnd = slotStart + slotDuration;
    const overlapsBreak = breakIntervals.some(
      (breakInterval) => slotStart < breakInterval.end && slotEnd > breakInterval.start
    );

    if (overlapsBreak) {
      continue;
    }

    slots.push({
      startTime: clinicLocalTimeToUtc(date, minutesToTime(slotStart), timeZone),
      endTime: clinicLocalTimeToUtc(date, minutesToTime(slotEnd), timeZone),
      isBooked: false,
      appointmentId: null
    });
  }

  if (slots.length === 0) {
    throw new Error('The working hours do not contain any complete appointment slots.');
  }

  return slots;
}

function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute
  };
}

function formatDateParts(parts) {
  return [
    String(parts.year).padStart(4, '0'),
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0')
  ].join('-');
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}
