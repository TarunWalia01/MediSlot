import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { Appointment } from './models/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
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
      'Duplicate active appointment slots exist. Resolve them before creating the unique index.'
    );
  }
}

async function initializeAppointmentIndexes() {
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
    throw new Error('The active appointment slot index was not found after initialization.');
  }

  console.log('Appointment indexes initialized and verified.');
}

function listenForHealthChecks() {
  app.listen(port, () => {
    console.log(`MediSlot health endpoint listening at http://localhost:${port}`);
  });
}

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB is not configured. Starting the health endpoint only.');
    listenForHealthChecks();
    return;
  }

  try {
    await connectDB();
    await initializeAppointmentIndexes();
  } catch (error) {
    console.error(`MediSlot startup failed before listening: ${error.message}`);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error(`MongoDB cleanup failed: ${disconnectError.message}`);
    }

    process.exitCode = 1;
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not configured. Login cannot issue tokens yet.');
  }

  app.listen(port, () => {
    console.log(`MediSlot API ready at http://localhost:${port}`);
  });
}

startServer();
