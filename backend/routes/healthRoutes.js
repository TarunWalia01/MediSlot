import { Router } from 'express';
import { getDatabaseStatus } from '../config/db.js';

const router = Router();

router.get('/', (request, response) => {
  const databaseStatus = getDatabaseStatus();
  const databaseConfigured = Boolean(process.env.MONGODB_URI);

  response.json({
    success: true,
    backend: {
      status: 'ok'
    },
    database: {
      status: databaseStatus
    },
    message: databaseConfigured
      ? 'Backend is running. Check the database status before using database features.'
      : 'Backend is running, but MongoDB is not configured yet.'
  });
});

export default router;
