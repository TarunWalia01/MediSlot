import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
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
      message: 'An appointment must end after it starts.'
    }
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

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  appointmentDate: {
    type: String,
    required: true,
    validate: {
      validator: isValidClinicDate,
      message: 'Appointment date must be a real calendar date in YYYY-MM-DD format.'
    }
  },
  timeSlot: {
    type: timeSlotSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true,
  autoIndex: false
});

appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ scheduleId: 1, status: 1 });
appointmentSchema.index({
  doctorId: 1,
  appointmentDate: 1,
  status: 1,
  'timeSlot.startTime': 1,
  'timeSlot.endTime': 1
});
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, 'timeSlot.startTime': 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
