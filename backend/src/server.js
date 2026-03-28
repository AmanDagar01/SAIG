import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { initDatabase } from './database/setup.js';
import { startScheduledIngestion } from './ingestion/manager.js';
import { apiLimiter } from './api/middleware/rateLimiter.js';
import { errorHandler } from './api/middleware/errorHandler.js';

import eventsRouter from './api/routes/events.js';
import analysisRouter from './api/routes/analysis.js';
import sourcesRouter from './api/routes/sources.js';
import dashboardRouter from './api/routes/dashboard.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: ['https://osint-monitor-sand.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
   methods: ['GET', 'POST'],
   credentials: true }));
app.use(express.json());
app.use(apiLimiter);

app.get('/', (req, res) => {
  res.json({ name: 'OSINT Conflict Monitor API', status: 'running', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: Math.round(process.uptime()) });
});

app.use('/api/events', eventsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/dashboard', dashboardRouter);

app.post('/api/ingest', async (req, res) => {
  try {
    const { runIngestionCycle } = await import('./ingestion/manager.js');
    const results = await runIngestionCycle();
    res.json({ message: 'Ingestion complete', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(errorHandler);

async function start() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    const PORT = config.port || 3001;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);

      setTimeout(() => {
        try {
          startScheduledIngestion();
          logger.info('Ingestion scheduler started');
        } catch (err) {
          logger.error(`Ingestion start failed: ${err.message}`);
        }
      }, 3000);
    });
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

import { startKeepAlive } from './utils/keepalive.js';

// Inside app.listen callback, add:
if (config.env === 'production' && 'https://osint-backend-ai8q.onrender.com') {
  startKeepAlive(`https://osint-backend-ai8q.onrender.com/api/health`);
}

start();