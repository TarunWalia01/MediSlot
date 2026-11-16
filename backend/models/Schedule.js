import mongoose from 'mongoose';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const workingHoursSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: timePattern
  },
  endTime: {
    type: String,
    required: true,
    match: timePattern
  }
}, {
  _id: false
});

const breakSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: timePattern
  },
  endTime: {
    type: String,
    required: true,
    match: timePattern
  }
}, {
  _id: false
});

const slotSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator(endTime) {
        return !this.startTime || endTime > this.startTime;
      },
      message: 'A slot must end after it starts.'
    }
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  }
}, {
  _id: false
});

function isValidClinicDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === date;
}

const scheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: isValidClinicDate,
      message: 'Schedule date must be a real calendar date in YYYY-MM-DD format.'
    }
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  workingHours: {
    type: workingHoursSchema,
    required: true
  },
  slotDuration: {
    type: Number,
    required: true,
    min: 5,
    max: 480,
    validate: {
      validator(duration) {
        return Number.isInteger(duration);
      },
      message: 'Slot duration must be a whole number of minutes.'
    }
  },
  breaks: {
    type: [breakSchema],
    default: []
  },
  slots: {
    type: [slotSchema],
    required: true,
    validate: {
      validator(slots) {
        if (!Array.isArray(slots) || slots.length === 0) {
          return false;
        }

        const sortedSlots = [...slots].sort(
          (first, second) => first.startTime - second.startTime
        );

        for (let index = 0; index < sortedSlots.length; index += 1) {
          const slot = sortedSlots[index];

          if (slot.isBooked !== Boolean(slot.appointmentId)) {
            return false;
          }

          if (
            index > 0
            && sortedSlots[index - 1].endTime > slot.startTime
          ) {
            return false;
          }
        }

        return true;
      },
      message: 'Slots must be non-empty, non-overlapping, and have a matching booking reference.'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

scheduleSchema.pre('validate', function validateScheduleConfiguration() {
  if (this.date && this.dayOfWeek) {
    const weekday = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: 'UTC'
    }).format(new Date(`${this.date}T00:00:00.000Z`));

    if (weekday !== this.dayOfWeek) {
      this.invalidate('dayOfWeek', 'dayOfWeek must match the clinic date.');
    }
  }

  if (!this.workingHours) {
    return;
  }

  const openingTime = timeToMinutes(this.workingHours.startTime);
  const closingTime = timeToMinutes(this.workingHours.endTime);
  if (openingTime < 0 || closingTime < 0 || openingTime >= closingTime) {
    this.invalidate('workingHours', 'Working hours must have a valid start before the end.');
    return;
  }

  const sortedBreaks = [...this.breaks].sort(
    (first, second) => timeToMinutes(first.startTime) - timeToMinutes(second.startTime)
  );
  for (let index = 0; index < sortedBreaks.length; index += 1) {
    const currentBreak = sortedBreaks[index];
    const breakStart = timeToMinutes(currentBreak.startTime);
    const breakEnd = timeToMinutes(currentBreak.endTime);

    if (breakStart < openingTime || breakEnd > closingTime || breakStart >= breakEnd) {
      this.invalidate('breaks', 'Breaks must be valid and fall within working hours.');
      return;
    }

    if (index > 0 && timeToMinutes(sortedBreaks[index - 1].endTime) > breakStart) {
      this.invalidate('breaks', 'Break periods cannot overlap.');
      return;
    }
  }
});

scheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });

function timeToMinutes(time) {
  if (typeof time !== 'string' || !timePattern.test(time)) {
    return -1;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
