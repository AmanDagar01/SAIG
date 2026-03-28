import { getDb } from '../database/setup.js';

export function detectAnomalies() {
  const db = getDb();
  const signals = [];

  function queryOne(sql) {
    const stmt = db.prepare(sql);
    let row = {};
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();
    return row;
  }

  function queryAll(sql) {
    const stmt = db.prepare(sql);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  // 1. Frequency spike
  const recent = queryOne("SELECT COUNT(*) as count FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours')");
  const baseline = queryOne("SELECT COUNT(*) / 7.0 as daily_avg FROM events WHERE event_datetime_utc >= datetime('now', '-7 days')");
  const spikeRatio = baseline.daily_avg > 0 ? recent.count / baseline.daily_avg : 0;

  if (spikeRatio > 2) {
    signals.push({
      type: 'frequency_spike', level: spikeRatio > 3 ? 'critical' : 'high',
      title: 'Event Frequency Spike',
      description: `Event count in last 24h (${recent.count}) is ${Math.round(spikeRatio * 100)}% of 7-day daily average.`,
      value: spikeRatio, detected_at: new Date().toISOString(),
    });
  }

  // 2. Severity escalation
  const recentSev = queryOne("SELECT AVG(severity_score) as avg FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours')");
  const prevSev = queryOne("SELECT AVG(severity_score) as avg FROM events WHERE event_datetime_utc >= datetime('now', '-48 hours') AND event_datetime_utc < datetime('now', '-24 hours')");

  if (recentSev.avg && prevSev.avg) {
    const increase = recentSev.avg - prevSev.avg;
    if (increase > 1.5) {
      signals.push({
        type: 'severity_escalation', level: increase > 2.5 ? 'critical' : 'high',
        title: 'Severity Escalation',
        description: `Average severity increased by ${increase.toFixed(1)} in last 24h.`,
        value: increase, detected_at: new Date().toISOString(),
      });
    }
  }

  // 3. Multi-actor convergence
  const actorCount = queryOne("SELECT COUNT(DISTINCT actor_1) as count FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours') AND actor_1 IS NOT NULL AND actor_1 != ''");
  if (actorCount.count >= 5) {
    signals.push({
      type: 'multi_actor', level: actorCount.count >= 8 ? 'high' : 'medium',
      title: 'Multi-Actor Convergence',
      description: `${actorCount.count} distinct actors active in last 24h.`,
      value: actorCount.count, detected_at: new Date().toISOString(),
    });
  }

  // 4. Info fog
  const unverified = queryOne("SELECT SUM(CASE WHEN verification_status != 'verified' THEN 1 ELSE 0 END) * 1.0 / MAX(COUNT(*), 1) as ratio FROM events WHERE event_datetime_utc >= datetime('now', '-24 hours')");
  if (unverified.ratio > 0.7 && recent.count > 5) {
    signals.push({
      type: 'info_fog', level: 'medium',
      title: 'Information Fog Warning',
      description: `${Math.round((unverified.ratio || 0) * 100)}% of recent reports are unverified.`,
      value: unverified.ratio, detected_at: new Date().toISOString(),
    });
  }

  return {
    signals: signals.sort((a, b) => {
      const levels = { critical: 0, high: 1, medium: 2, low: 3 };
      return (levels[a.level] || 3) - (levels[b.level] || 3);
    }),
    total_signals: signals.length,
    assessed_at: new Date().toISOString(),
  };
}