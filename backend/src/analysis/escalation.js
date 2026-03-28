import { getDb } from '../database/setup.js';

export function calculateEscalationIndex() {
  const db = getDb();

  function query(sql) {
    const stmt = db.prepare(sql);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  function queryOne(sql) {
    const rows = query(sql);
    return rows[0] || {};
  }

  const last24h = queryOne("SELECT COUNT(*) as count, AVG(severity_score) as avg_sev FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours')");
  const baseline = queryOne("SELECT COUNT(*) / 6.0 as daily_avg FROM events WHERE event_datetime_utc >= datetime('now', '-7 days') AND event_datetime_utc < datetime('now', '-24 hours')");
  const highSev = queryOne("SELECT COUNT(*) as count FROM events WHERE severity_score >= 7 AND event_datetime_utc >= datetime('now', '-24 hours')");
  const domains = queryOne("SELECT COUNT(DISTINCT domain) as count FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours') AND domain IS NOT NULL AND domain != ''");
  const actors = queryOne("SELECT COUNT(DISTINCT actor_1) as count FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours') AND actor_1 IS NOT NULL AND actor_1 != ''");

  const eventCount = last24h.count || 0;
  const avgSeverity = last24h.avg_sev || 0;
  const baselineDaily = baseline.daily_avg || 1;
  const highSevCount = highSev.count || 0;
  const domainCount = domains.count || 0;
  const actorCount = actors.count || 0;

  const frequencyScore = Math.min(eventCount / (baselineDaily * 2), 1);
  const severityScore = avgSeverity / 10;
  const highSevRatio = eventCount > 0 ? highSevCount / eventCount : 0;
  const diversityScore = Math.min(domainCount / 5, 1);
  const actorScore = Math.min(actorCount / 8, 1);

  const index = (
    frequencyScore * 0.25 +
    severityScore * 0.30 +
    highSevRatio * 0.20 +
    diversityScore * 0.15 +
    actorScore * 0.10
  ) * 10;

  return {
    index: Math.round(index * 10) / 10,
    components: {
      frequency: { score: Math.round(frequencyScore * 100) / 100, events_24h: eventCount, baseline_daily: Math.round(baselineDaily * 10) / 10 },
      severity: { score: Math.round(severityScore * 100) / 100, average: Math.round(avgSeverity * 10) / 10 },
      high_severity: { score: Math.round(highSevRatio * 100) / 100, count: highSevCount },
      domain_diversity: { score: Math.round(diversityScore * 100) / 100, domains: domainCount },
      actor_diversity: { score: Math.round(actorScore * 100) / 100, actors: actorCount },
    },
    level: index >= 8 ? 'CRITICAL' : index >= 6 ? 'HIGH' : index >= 4 ? 'ELEVATED' : index >= 2 ? 'GUARDED' : 'LOW',
    assessed_at: new Date().toISOString(),
  };
}