import assert from 'node:assert/strict';
import test from 'node:test';
import Appointment from '../models/Appointment.js';
import Schedule from '../models/Schedule.js';
import Service from '../models/Service.js';
import {
  clinicLocalTimeToUtc,
  generateScheduleSlots,
  getDayOfWeek,
  isValidClinicDate
} from '../utils/scheduleTime.js';

test('clinic-local schedule times convert to the configured timezone instant', () => {
  const start = clinicLocalTimeToUtc('2026-07-20', '09:00', 'Asia/Kolkata');

  assert.equal(start.toISOString(), '2026-07-20T03:30:00.000Z');
  assert.equal(getDayOfWeek('2026-07-20'), 'Monday');
});

test('slot generation skips breaks and does not create partial slots', () => {
  const slots = generateScheduleSlots(
    '2026-07-20',
    { startTime: '09:00', endTime: '12:00' },
    30,
    [{ startTime: '10:00', endTime: '10:30' }],
    'Asia/Kolkata'
  );

  assert.deepEqual(
    slots.map((slot) => slot.startTime.toISOString()),
    [
      '2026-07-20T03:30:00.000Z',
      '2026-07-20T04:00:00.000Z',
      '2026-07-20T05:00:00.000Z',
      '2026-07-20T05:30:00.000Z',
      '2026-07-20T06:00:00.000Z'
    ]
  );
  assert.equal(slots.every((slot) => !slot.isBooked && !slot.appointmentId), true);
});

test('invalid clinic dates and nonexistent timezone times are rejected', () => {
  assert.equal(isValidClinicDate('2026-02-30'), false);
  assert.throws(
    () => clinicLocalTimeToUtc('2026-03-08', '02:30', 'America/New_York'),
    /does not exist/
  );
});

test('schedule validation rejects a break outside working hours', async () => {
  const schedule = new Schedule({
    doctorId: '0123456789abcdef01234567',
    date: '2026-07-20',
    dayOfWeek: 'Monday',
    workingHours: { startTime: '09:00', endTime: '12:00' },
    slotDuration: 30,
    breaks: [{ startTime: '08:30', endTime: '09:00' }],
    slots: [{
      startTime: new Date('2026-07-20T03:30:00.000Z'),
      endTime: new Date('2026-07-20T04:00:00.000Z')
    }]
  });

  await assert.rejects(schedule.validate(), /Breaks must be valid and fall within working hours/);
});

test('schedule validation rejects overlapping stored slots', async () => {
  const schedule = new Schedule({
    doctorId: '0123456789abcdef01234567',
    date: '2026-07-20',
    dayOfWeek: 'Monday',
    workingHours: { startTime: '09:00', endTime: '12:00' },
    slotDuration: 30,
    slots: [
      {
        startTime: new Date('2026-07-20T03:30:00.000Z'),
        endTime: new Date('2026-07-20T04:00:00.000Z')
      },
      {
        startTime: new Date('2026-07-20T03:45:00.000Z'),
        endTime: new Date('2026-07-20T04:15:00.000Z')
      }
    ]
  });

  await assert.rejects(schedule.validate(), /Slots must be non-empty, non-overlapping/);
});

test('service duration must be a whole number of minutes', async () => {
  const service = new Service({
    name: 'Sample service',
    fee: 100,
    duration: 15.5
  });

  await assert.rejects(service.validate(), /Service duration must be a whole number/);
});

test('appointment schema keeps the active exact-slot unique index', () => {
  const slotIndex = Appointment.schema.indexes().find(([keys, options]) => (
    keys.doctorId === 1
      && keys.appointmentDate === 1
      && keys['timeSlot.startTime'] === 1
      && options.unique === true
  ));

  assert.deepEqual(slotIndex?.[1].partialFilterExpression, {
    status: { $in: ['pending', 'confirmed', 'completed'] }
  });
});
