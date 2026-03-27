import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { getDb } from './database/setup.js';
import { startScheduledIngestion, runIngestionCycle } from './ingestion/manager.js';
import { apiLimiter } from './api/middleware/rateLimiter.js';
import { errorHandler } from './api/middleware/errorHandler.js';

// Import routes
import eventsRouter from './api/routes/events.js';
import analysisRouter from './api/routes/analysis.js';
import sourcesRouter from './api/routes/sources.js';
import dashboardRouter from './api/routes/dashboard.js';

const app = express();

// ---- Middleware ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(apiLimiter);

// ---- Health check ----
app.get('/api/health', (req, res) => {
  const db = getDb();
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    events_in_db: eventCount.count,
    uptime: process.uptime(),
  });
});

// ---- API Routes ----
app.use('/api/events', eventsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/dashboard', dashboardRouter);

// ---- Manual ingestion trigger (dev only) ----
if (config.env === 'development') {
  app.post('/api/ingest', async (req, res) => {
    try {
      logger.info('Manual ingestion triggered via API');
      const results = await runIngestionCycle();
      res.json({ message: 'Ingestion complete', results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// ---- Error handler ----
app.use(errorHandler);

// ---- Start ----
app.listen(config.port, () => {
  logger.info(`OSINT Backend running on port ${config.port}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`CORS origin: ${config.cors.origin}`);

  // Initialize DB
  getDb();
  logger.info('Database connected');

  // Start data ingestion
  startScheduledIngestion();
});

export default app;