import mongoose from 'mongoose';

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
  }
}, {
  timestamps: true
});

scheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
