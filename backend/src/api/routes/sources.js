import { Router } from 'express';
import { getSources, getIngestionLogs } from '../../database/queries.js';

const router = Router();

// GET /api/sources
router.get('/', (req, res) => {
  try {
    const sources = getSources();
    res.json({ sources });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sources/ingestion-logs
router.get('/ingestion-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = getIngestionLogs(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;