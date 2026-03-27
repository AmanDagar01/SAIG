import { getDb } from '../database/setup.js';

export function detectAnomalies() {
  const db = getDb();
  const signals = [];

  // 1. Event frequency spike (24h vs 7-day average)
  const recent = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE event_datetime_utc >= datetime('now', '-24 hours')
    AND duplicate_of IS NULL
  `).get();

  const baseline = db.prepare(`
    SELECT COUNT(*) / 7.0 as daily_avg FROM events
    WHERE event_datetime_utc >= datetime('now', '-7 days')
    AND duplicate_of IS NULL
  `).get();

  const spikeRatio = baseline.daily_avg > 0 ? recent.count / baseline.daily_avg : 0;
  if (spikeRatio > 2) {
    signals.push({
      type: 'frequency_spike',
      level: spikeRatio > 3 ? 'critical' : 'high',
      title: 'Event Frequency Spike',
      description: `Event count in last 24h (${recent.count}) is ${Math.round(spikeRatio * 100)}% of 7-day daily average (${Math.round(baseline.daily_avg)}).`,
      value: spikeRatio,
      detected_at: new Date().toISOString(),
    });
  }

  // 2. New domain activity
  const recentDomains = db.prepare(`
    SELECT DISTINCT domain FROM events
    WHERE event_datetime_utc >= datetime('now', '-24 hours')
    AND domain IS NOT NULL AND duplicate_of IS NULL
  `).all().map(r => r.domain);

  const previousDomains = db.prepare(`
    SELECT DISTINCT domain FROM events
    WHERE event_datetime_utc >= datetime('now', '-7 days')
    AND event_datetime_utc < datetime('now', '-24 hours')
    AND domain IS NOT NULL AND duplicate_of IS NULL
  `).all().map(r => r.domain);

  const newDomains = recentDomains.filter(d => !previousDomains.includes(d));
  if (newDomains.length > 0) {
    signals.push({
      type: 'new_domain',
      level: 'medium',
      title: 'New Domain Activity Detected',
      description: `New conflict domain(s) appeared in last 24h: ${newDomains.join(', ')}. May indicate conflict expansion.`,
      value: newDomains,
      detected_at: new Date().toISOString(),
    });
  }

  // 3. Severity escalation
  const recentAvgSev = db.prepare(`
    SELECT AVG(severity_score) as avg FROM events
    WHERE event_datetime_utc >= datetime('now', '-24 hours') AND duplicate_of IS NULL
  `).get();

  const prevAvgSev = db.prepare(`
    SELECT AVG(severity_score) as avg FROM events
    WHERE event_datetime_utc >= datetime('now', '-48 hours')
    AND event_datetime_utc < datetime('now', '-24 hours')
    AND duplicate_of IS NULL
  `).get();

  if (recentAvgSev.avg && prevAvgSev.avg) {
    const sevIncrease = recentAvgSev.avg - prevAvgSev.avg;
    if (sevIncrease > 1.5) {
      signals.push({
        type: 'severity_escalation',
        level: sevIncrease > 2.5 ? 'critical' : 'high',
        title: 'Severity Escalation',
        description: `Average severity increased by ${sevIncrease.toFixed(1)} points in last 24h (${prevAvgSev.avg.toFixed(1)} → ${recentAvgSev.avg.toFixed(1)}).`,
        value: sevIncrease,
        detected_at: new Date().toISOString(),
      });
    }
  }

  // 4. Multi-actor convergence
  const actorCount = db.prepare(`
    SELECT COUNT(DISTINCT actor_1) as count FROM events
    WHERE event_datetime_utc >= datetime('now', '-24 hours')
    AND actor_1 IS NOT NULL AND duplicate_of IS NULL
  `).get();

  if (actorCount.count >= 5) {
    signals.push({
      type: 'multi_actor',
      level: actorCount.count >= 8 ? 'high' : 'medium',
      title: 'Multi-Actor Convergence',
      description: `${actorCount.count} distinct actors active in last 24h, indicating broad-based conflict activity.`,
      value: actorCount.count,
      detected_at: new Date().toISOString(),
    });
  }

  // 5. Unverified reports surge
  const unverifiedRatio = db.prepare(`
    SELECT
      SUM(CASE WHEN verification_status != 'verified' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as ratio
    FROM events
    WHERE event_datetime_utc >= datetime('now', '-24 hours')
    AND duplicate_of IS NULL
  `).get();

  if (unverifiedRatio.ratio > 0.7 && recent.count > 5) {
    signals.push({
      type: 'info_fog',
      level: 'medium',
      title: 'Information Fog Warning',
      description: `${Math.round(unverifiedRatio.ratio * 100)}% of recent reports are unverified. High uncertainty environment - exercise caution.`,
      value: unverifiedRatio.ratio,
      detected_at: new Date().toISOString(),
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