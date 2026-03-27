import { Router } from 'express';
import { getDashboardStats, getTimelineData, getHotTopics, getEvents } from '../../database/queries.js';
import { calculateEscalationIndex } from '../../analysis/escalation.js';
import { detectAnomalies } from '../../analysis/patterns.js';

const router = Router();

// GET /api/dashboard - all dashboard data in one call
router.get('/', (req, res) => {
  try {
    const stats = getDashboardStats();
    const timeline = getTimelineData(7);
    const hotTopics = getHotTopics(5);
    const escalation = calculateEscalationIndex();
    const anomalies = detectAnomalies();
    const recentEvents = getEvents({ limit: 10, sortBy: 'event_datetime_utc', sortOrder: 'DESC' });

    res.json({
      stats,
      timeline,
      hotTopics,
      escalation,
      anomalies,
      recentEvents: recentEvents.events,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;