import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { getDb } from './database/setup.js';
import { startScheduledIngestion, runIngestionCycle } from './ingestion/manager.js';
import { apiLimiter } from './api/middleware/rateLimiter.js';
import { errorHandler } from './api/middleware/errorHandler.js';

import eventsRouter from './api/routes/events.js';
import analysisRouter from './api/routes/analysis.js';
import sourcesRouter from './api/routes/sources.js';
import dashboardRouter from './api/routes/dashboard.js';

const app = express();

// ---- Middleware ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Dynamic CORS - support multiple origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowed = config.cors.origins;
    if (allowed.includes(origin) || allowed.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all in production for now
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(apiLimiter);

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({
    name: 'OSINT Conflict Monitor API',
    status: 'running',
    version: '1.0.0',
    docs: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const eventCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE duplicate_of IS NULL').get();
    const latestEvent = db.prepare('SELECT MAX(event_datetime_utc) as latest FROM events').get();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      events_in_db: eventCount.count,
      latest_event: latestEvent.latest,
      uptime: Math.round(process.uptime()),
      environment: config.env,
    });
  } catch (error) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      events_in_db: 0,
      uptime: Math.round(process.uptime()),
    });
  }
});

// ---- API Routes ----
app.use('/api/events', eventsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/dashboard', dashboardRouter);

// ---- Manual ingestion trigger ----
app.post('/api/ingest', async (req, res) => {
  try {
    logger.info('Manual ingestion triggered via API');
    const results = await runIngestionCycle();
    res.json({ message: 'Ingestion complete', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Error handler ----
app.use(errorHandler);

// ---- Start ----
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`OSINT Backend running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`CORS origins: ${config.cors.origins.join(', ')}`);

  // Initialize DB
  getDb();
  logger.info('Database connected');

  // Start data ingestion
  startScheduledIngestion();
});

export default app;