import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number.']
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  qualification: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  experience: {
    type: Number,
    required: true,
    min: 0,
    max: 80
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  profileImage: {
    type: String,
    trim: true,
    default: ''
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

doctorSchema.index({ specialization: 1, isActive: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
