import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());
app.use('/api/health', healthRoutes);

async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (error) {
      console.error(`MongoDB connection failed: ${error.message}`);
    }
  } else {
    console.warn('MongoDB is not configured. Set MONGODB_URI in backend/.env.');
  }

  app.listen(port, () => {
    console.log(`MediSlot API listening at http://localhost:${port}`);
  });
}

startServer();
