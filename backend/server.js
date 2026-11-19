
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import { Appointment, Schedule } from './models/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

async function checkForDuplicateActiveAppointments() {
  const duplicateSlots = await Appointment.aggregate([
    {
      $match: {
        status: { $in: ['pending', 'confirmed', 'completed'] }
      }
    },
    {
      $group: {
        _id: {
          doctorId: '$doctorId',
          appointmentDate: '$appointmentDate',
          startTime: '$timeSlot.startTime'
        },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    },
    { $limit: 1 }
  ]);

  if (duplicateSlots.length > 0) {
    throw new Error(
      'Some appointment slots are already booked more than once. Please fix them before creating the unique index.'
    );
  }
}

async function initializeAppointmentIndexes() {
  await Schedule.createIndexes();
  const scheduleIndexes = await Schedule.collection.indexes();
  const uniqueDoctorDateIndexExists = scheduleIndexes.some((index) => (
    index.unique === true
    && index.key.doctorId === 1
    && index.key.date === 1
  ));

  if (!uniqueDoctorDateIndexExists) {
    throw new Error('Could not find the unique doctor/date index for schedules.');
  }

  await checkForDuplicateActiveAppointments();
  await Appointment.createIndexes();

  const indexes = await Appointment.collection.indexes();
  const expectedStatuses = ['pending', 'confirmed', 'completed'];
  const slotIndexExists = indexes.some((index) => {
    const indexedStatuses = index.partialFilterExpression?.status?.$in;

    return index.unique === true
      && index.key.doctorId === 1
      && index.key.appointmentDate === 1
      && index.key['timeSlot.startTime'] === 1
      && Array.isArray(indexedStatuses)
      && expectedStatuses.length === indexedStatuses.length
      && expectedStatuses.every((status) => indexedStatuses.includes(status));
  });

  if (!slotIndexExists) {
    throw new Error('Could not find the unique index for active appointment slots.');
  }

  console.log('Schedule and appointment indexes are ready.');
}

function listenForHealthChecks() {
  app.listen(port, () => {
    console.log(`Health check server is running at http://localhost:${port}`);
  });
}

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB connection details are missing. Starting the health check server only.');
    listenForHealthChecks();
    return;
  }

  try {
    await connectDB();
    await initializeAppointmentIndexes();
  } catch (error) {
    console.error(`Failed to start the server: ${error.message}`);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error(`Error while closing the database connection: ${disconnectError.message}`);
    }

    process.exitCode = 1;
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is missing. Login will not work until it is configured.');
  }

  app.listen(port, () => {
    console.log(`MediSlot API is running at http://localhost:${port}`);
  });
}

startServer();
