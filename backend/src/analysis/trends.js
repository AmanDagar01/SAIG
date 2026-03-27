import { getDb } from '../database/setup.js';

export function getEventTrends(days = 14) {
  const db = getDb();

  // Daily event counts and severity
  const dailyTrend = db.prepare(`
    SELECT
      DATE(event_datetime_utc) as date,
      COUNT(*) as event_count,
      ROUND(AVG(severity_score), 1) as avg_severity,
      MAX(severity_score) as max_severity,
      SUM(CASE WHEN severity_score >= 7 THEN 1 ELSE 0 END) as high_severity_count,
      SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count
    FROM events
    WHERE event_datetime_utc >= datetime('now', ? || ' days')
    AND duplicate_of IS NULL
    GROUP BY DATE(event_datetime_utc)
    ORDER BY date ASC
  `).all(`-${days}`);

  // Domain trends
  const domainTrend = db.prepare(`
    SELECT
      domain,
      DATE(event_datetime_utc) as date,
      COUNT(*) as count
    FROM events
    WHERE event_datetime_utc >= datetime('now', ? || ' days')
    AND domain IS NOT NULL AND duplicate_of IS NULL
    GROUP BY domain, DATE(event_datetime_utc)
    ORDER BY date ASC
  `).all(`-${days}`);

  // Actor activity trends
  const actorTrend = db.prepare(`
    SELECT
      actor_1 as actor,
      COUNT(*) as event_count,
      ROUND(AVG(severity_score), 1) as avg_severity,
      MAX(severity_score) as max_severity
    FROM events
    WHERE event_datetime_utc >= datetime('now', ? || ' days')
    AND actor_1 IS NOT NULL AND duplicate_of IS NULL
    GROUP BY actor_1
    ORDER BY event_count DESC
    LIMIT 15
  `).all(`-${days}`);

  // Event type distribution
  const eventTypeDist = db.prepare(`
    SELECT
      event_type,
      COUNT(*) as count,
      ROUND(AVG(severity_score), 1) as avg_severity
    FROM events
    WHERE event_datetime_utc >= datetime('now', ? || ' days')
    AND event_type IS NOT NULL AND duplicate_of IS NULL
    GROUP BY event_type
    ORDER BY count DESC
  `).all(`-${days}`);

  // Country heatmap data
  const countryHeat = db.prepare(`
    SELECT
      country,
      COUNT(*) as event_count,
      ROUND(AVG(severity_score), 1) as avg_severity,
      MAX(severity_score) as max_severity,
      AVG(lat) as avg_lat,
      AVG(lng) as avg_lng
    FROM events
    WHERE event_datetime_utc >= datetime('now', ? || ' days')
    AND country IS NOT NULL AND duplicate_of IS NULL
    GROUP BY country
    ORDER BY event_count DESC
  `).all(`-${days}`);

  return {
    daily: dailyTrend,
    byDomain: domainTrend,
    byActor: actorTrend,
    byEventType: eventTypeDist,
    byCountry: countryHeat,
    period_days: days,
    generated_at: new Date().toISOString(),
  };
}