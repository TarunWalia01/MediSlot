import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

function getAdminDetails() {
  const admin = {
    name: process.env.ADMIN_NAME?.trim(),
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    phone: process.env.ADMIN_PHONE?.trim(),
    password: process.env.ADMIN_PASSWORD
  };

  if (!admin.name || !admin.email || !admin.phone || !admin.password) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_PASSWORD in backend/.env.');
  }

  if (admin.password.length < 8 || Buffer.byteLength(admin.password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters and no more than 72 bytes.');
  }

  return admin;
}

async function createAdmin() {
  const adminDetails = getAdminDetails();
  await connectDB();

  const existingUser = await User.findOne({ email: adminDetails.email });

  if (existingUser) {
    if (existingUser.role === 'admin') {
      console.log('An admin account with this email already exists; no changes were made.');
      return;
    }

    throw new Error('This email belongs to a patient account. Use a different admin email.');
  }

  const admin = new User({
    ...adminDetails,
    role: 'admin'
  });

  await admin.save();
  console.log('Admin account created. The password was not displayed.');
}

try {
  await createAdmin();
} catch (error) {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
