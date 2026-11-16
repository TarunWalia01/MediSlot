import mongoose from 'mongoose';

let transactionSupportAvailable = false;

export async function connectDB() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in the backend environment.');
  }

  await mongoose.connect(MONGODB_URI);
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  transactionSupportAvailable = Boolean(hello.setName) || hello.msg === 'isdbgrid';
  console.log('MongoDB connected.');
  console.log(
    `MongoDB transactions ${transactionSupportAvailable ? 'are available' : 'are unavailable'}.`
  );
}

export function supportsMongoTransactions() {
  return transactionSupportAvailable;
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
