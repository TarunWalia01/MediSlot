import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
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
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 72,
    select: false
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number.']
  },
  role: {
    type: String,
    enum: ['patient', 'admin'],
    default: 'patient'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform(document, result) {
      delete result.password;
      delete result.__v;
      return result;
    }
  }
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
