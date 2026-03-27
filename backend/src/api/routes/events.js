import { Router } from 'express';
import { getEvents, getEventById, getDistinctValues } from '../../database/queries.js';

const router = Router();

// GET /api/events
router.get('/', (req, res) => {
  try {
    const result = getEvents({
      limit: req.query.limit || 50,
      offset: req.query.offset || 0,
      sortBy: req.query.sortBy || 'event_datetime_utc',
      sortOrder: req.query.sortOrder || 'DESC',
      country: req.query.country,
      domain: req.query.domain,
      eventType: req.query.eventType,
      verification: req.query.verification,
      minSeverity: req.query.minSeverity,
      maxSeverity: req.query.maxSeverity,
      sourceType: req.query.sourceType,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      actor: req.query.actor,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/filters - available filter values
router.get('/filters', (req, res) => {
  try {
    const filters = {
      countries: getDistinctValues('country'),
      domains: getDistinctValues('domain'),
      eventTypes: getDistinctValues('event_type'),
      sources: getDistinctValues('source_name'),
      sourceTypes: getDistinctValues('source_type'),
      verificationStatuses: getDistinctValues('verification_status'),
    };
    res.json(filters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  try {
    const event = getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;