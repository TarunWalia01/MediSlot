import mongoose from 'mongoose';

export async function connectDB() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in the backend environment.');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected.');
}

export function getDatabaseStatus() {
  if (mongoose.connection.readyState === 1) {
    return 'connected';
  }

  if (mongoose.connection.readyState === 2) {
    return 'connecting';
  }

  return 'disconnected';
}
