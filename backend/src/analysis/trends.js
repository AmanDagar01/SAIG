import { getDb } from '../database/setup.js';

export function getEventTrends(days = 14) {
  const db = getDb();

  function query(sql) {
    const stmt = db.prepare(sql);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  const daily = query(`
    SELECT DATE(event_datetime_utc) as date, COUNT(*) as event_count,
    ROUND(AVG(severity_score), 1) as severity_avg, MAX(severity_score) as max_severity,
    SUM(CASE WHEN severity_score >= 7 THEN 1 ELSE 0 END) as high_severity_count
    FROM events WHERE event_datetime_utc >= datetime('now', '-${parseInt(days)} days')
    GROUP BY DATE(event_datetime_utc) ORDER BY date ASC
  `);

  const byDomain = query(`
    SELECT domain, DATE(event_datetime_utc) as date, COUNT(*) as count
    FROM events WHERE event_datetime_utc >= datetime('now', '-${parseInt(days)} days')
    AND domain IS NOT NULL AND domain != ''
    GROUP BY domain, DATE(event_datetime_utc) ORDER BY date ASC
  `);

  const byActor = query(`
    SELECT actor_1 as actor, COUNT(*) as event_count, ROUND(AVG(severity_score), 1) as avg_severity
    FROM events WHERE event_datetime_utc >= datetime('now', '-${parseInt(days)} days')
    AND actor_1 IS NOT NULL AND actor_1 != ''
    GROUP BY actor_1 ORDER BY event_count DESC LIMIT 15
  `);

  const byEventType = query(`
    SELECT event_type, COUNT(*) as count, ROUND(AVG(severity_score), 1) as avg_severity
    FROM events WHERE event_datetime_utc >= datetime('now', '-${parseInt(days)} days')
    AND event_type IS NOT NULL AND event_type != ''
    GROUP BY event_type ORDER BY count DESC
  `);

  const byCountry = query(`
    SELECT country, COUNT(*) as event_count, ROUND(AVG(severity_score), 1) as avg_severity,
    AVG(lat) as avg_lat, AVG(lng) as avg_lng
    FROM events WHERE event_datetime_utc >= datetime('now', '-${parseInt(days)} days')
    AND country IS NOT NULL AND country != ''
    GROUP BY country ORDER BY event_count DESC
  `);

  return { daily, byDomain, byActor, byEventType, byCountry, period_days: days, generated_at: new Date().toISOString() };
}