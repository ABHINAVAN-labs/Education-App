import express, { Request, Response } from 'express';
import cors from 'cors';

import { envPath } from './env';
import { pool, supabaseAuthClient } from './database';
import { classroomRouter } from './modules/classroom';
import { studentAnalyticsRouter } from './modules/student-analytics';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api', classroomRouter);
app.use('/student-analytics', studentAnalyticsRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});



app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);

  try {
    // Prefer a short-lived connection check instead of holding one open
    const client = await pool.connect();
    client.release();

    console.log('Connected to Supabase PostgreSQL');

    // sanity check for Supabase auth client
    await supabaseAuthClient.auth.getUser('test');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('JWT verification failed')
    ) {
      console.log('Supabase auth client initialized');
    } else {
      console.error('Startup error:', error);
      console.error(`Loaded backend environment from ${envPath}`);
    }
  }
});

export default app;
