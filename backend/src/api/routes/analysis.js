import { Router } from 'express';
import { calculateEscalationIndex } from '../../analysis/escalation.js';
import { getEventTrends } from '../../analysis/trends.js';
import { detectAnomalies } from '../../analysis/patterns.js';

const router = Router();

// GET /api/analysis/escalation
router.get('/escalation', (req, res) => {
  try {
    const result = calculateEscalationIndex();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analysis/trends
router.get('/trends', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const result = getEventTrends(Math.min(days, 90));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analysis/anomalies
router.get('/anomalies', (req, res) => {
  try {
    const result = detectAnomalies();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;