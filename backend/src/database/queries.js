import { getDb } from './setup.js';

// ---- EVENT QUERIES ----

export function insertEvent(event) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO events (
      id, event_datetime_utc, source_name, source_url, source_type,
      source_reliability_score, claim_text, title, country, location_text,
      lat, lng, geo_method, actor_1, actor_2, event_type, domain,
      severity_score, confidence_score, verification_status, tags,
      raw_data, content_hash, last_updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const result = stmt.run(
    event.id,
    event.event_datetime_utc,
    event.source_name,
    event.source_url,
    event.source_type,
    event.source_reliability_score,
    event.claim_text,
    event.title || null,
    event.country || null,
    event.location_text || null,
    event.lat || null,
    event.lng || null,
    event.geo_method || null,
    event.actor_1 || null,
    event.actor_2 || null,
    event.event_type || null,
    event.domain || null,
    event.severity_score || 5,
    event.confidence_score || 5,
    event.verification_status || 'unverified',
    JSON.stringify(event.tags || []),
    event.raw_data ? JSON.stringify(event.raw_data) : null,
    event.content_hash,
    event.last_updated_at || new Date().toISOString()
  );

  return result.changes > 0;
}

export function insertEventsBatch(events) {
  const db = getDb();
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO events (
      id, event_datetime_utc, source_name, source_url, source_type,
      source_reliability_score, claim_text, title, country, location_text,
      lat, lng, geo_method, actor_1, actor_2, event_type, domain,
      severity_score, confidence_score, verification_status, tags,
      raw_data, content_hash, last_updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  const transaction = db.transaction((evts) => {
    let inserted = 0;
    let duplicates = 0;
    for (const event of evts) {
      const result = insertStmt.run(
        event.id, event.event_datetime_utc, event.source_name,
        event.source_url, event.source_type, event.source_reliability_score,
        event.claim_text, event.title || null, event.country || null,
        event.location_text || null, event.lat || null, event.lng || null,
        event.geo_method || null, event.actor_1 || null, event.actor_2 || null,
        event.event_type || null, event.domain || null,
        event.severity_score || 5, event.confidence_score || 5,
        event.verification_status || 'unverified',
        JSON.stringify(event.tags || []),
        event.raw_data ? JSON.stringify(event.raw_data) : null,
        event.content_hash, event.last_updated_at || new Date().toISOString()
      );
      if (result.changes > 0) inserted++;
      else duplicates++;
    }
    return { inserted, duplicates };
  });

  return transaction(events);
}

export function getEvents({
  limit = 50,
  offset = 0,
  sortBy = 'event_datetime_utc',
  sortOrder = 'DESC',
  country,
  domain,
  eventType,
  verification,
  minSeverity,
  maxSeverity,
  sourceType,
  search,
  startDate,
  endDate,
  actor,
} = {}) {
  const db = getDb();
  const conditions = ['duplicate_of IS NULL'];
  const params = [];

  if (country && country !== 'all') {
    conditions.push('country = ?');
    params.push(country);
  }
  if (domain && domain !== 'all') {
    conditions.push('domain = ?');
    params.push(domain);
  }
  if (eventType && eventType !== 'all') {
    conditions.push('event_type = ?');
    params.push(eventType);
  }
  if (verification && verification !== 'all') {
    conditions.push('verification_status = ?');
    params.push(verification);
  }
  if (minSeverity) {
    conditions.push('severity_score >= ?');
    params.push(parseInt(minSeverity));
  }
  if (maxSeverity) {
    conditions.push('severity_score <= ?');
    params.push(parseInt(maxSeverity));
  }
  if (sourceType && sourceType !== 'all') {
    conditions.push('source_type = ?');
    params.push(sourceType);
  }
  if (startDate) {
    conditions.push('event_datetime_utc >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('event_datetime_utc <= ?');
    params.push(endDate);
  }
  if (actor) {
    conditions.push('(actor_1 LIKE ? OR actor_2 LIKE ?)');
    params.push(`%${actor}%`, `%${actor}%`);
  }
  if (search) {
    conditions.push('(claim_text LIKE ? OR title LIKE ? OR location_text LIKE ? OR actor_1 LIKE ? OR actor_2 LIKE ? OR tags LIKE ?)');
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  // Validate sort column
  const allowedSorts = ['event_datetime_utc', 'severity_score', 'confidence_score', 'ingested_at', 'source_name'];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'event_datetime_utc';
  const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM events ${whereClause}`).get(...params);

  // Get events
  const events = db.prepare(`
    SELECT * FROM events
    ${whereClause}
    ORDER BY ${safeSort} ${safeOrder}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));

  // Parse JSON fields
  const parsed = events.map(e => ({
    ...e,
    tags: JSON.parse(e.tags || '[]'),
    raw_data: e.raw_data ? JSON.parse(e.raw_data) : null,
  }));

  return {
    events: parsed,
    total: countRow.total,
    limit: parseInt(limit),
    offset: parseInt(offset),
    hasMore: parseInt(offset) + parseInt(limit) < countRow.total,
  };
}

export function getEventById(id) {
  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) return null;
  return {
    ...event,
    tags: JSON.parse(event.tags || '[]'),
    raw_data: event.raw_data ? JSON.parse(event.raw_data) : null,
  };
}

export function getEventByHash(hash) {
  const db = getDb();
  return db.prepare('SELECT id FROM events WHERE content_hash = ?').get(hash);
}

export function getDistinctValues(field) {
  const db = getDb();
  const allowed = ['country', 'domain', 'event_type', 'source_name', 'source_type', 'actor_1', 'verification_status'];
  if (!allowed.includes(field)) return [];
  return db.prepare(`SELECT DISTINCT ${field} as value, COUNT(*) as count FROM events WHERE ${field} IS NOT NULL AND duplicate_of IS NULL GROUP BY ${field} ORDER BY count DESC`).all();
}

// ---- STATS QUERIES ----

export function getDashboardStats() {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM events WHERE duplicate_of IS NULL').get();

  const last24h = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE event_datetime_utc >= datetime('now', '-24 hours')
    AND duplicate_of IS NULL
  `).get();

  const last48h = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE event_datetime_utc >= datetime('now', '-48 hours')
    AND duplicate_of IS NULL
  `).get();

  const verificationBreakdown = db.prepare(`
    SELECT verification_status, COUNT(*) as count
    FROM events WHERE duplicate_of IS NULL
    GROUP BY verification_status
  `).all();

  const domainBreakdown = db.prepare(`
    SELECT domain, COUNT(*) as count
    FROM events WHERE duplicate_of IS NULL AND domain IS NOT NULL
    GROUP BY domain ORDER BY count DESC
  `).all();

  const countryBreakdown = db.prepare(`
    SELECT country, COUNT(*) as count
    FROM events WHERE duplicate_of IS NULL AND country IS NOT NULL
    GROUP BY country ORDER BY count DESC
  `).all();

  const avgSeverity = db.prepare(`
    SELECT AVG(severity_score) as avg_severity
    FROM events WHERE duplicate_of IS NULL
  `).get();

  const highSeverityCount = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE severity_score >= 7 AND duplicate_of IS NULL
  `).get();

  const recentHighSeverity = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE severity_score >= 7
    AND event_datetime_utc >= datetime('now', '-24 hours')
    AND duplicate_of IS NULL
  `).get();

  const topActors = db.prepare(`
    SELECT actor_1 as actor, COUNT(*) as count
    FROM events WHERE actor_1 IS NOT NULL AND duplicate_of IS NULL
    GROUP BY actor_1 ORDER BY count DESC LIMIT 10
  `).all();

  return {
    total: total.count,
    last24h: last24h.count,
    last48h: last48h.count,
    verificationBreakdown,
    domainBreakdown,
    countryBreakdown,
    avgSeverity: Math.round((avgSeverity.avg_severity || 0) * 10) / 10,
    highSeverityCount: highSeverityCount.count,
    recentHighSeverity: recentHighSeverity.count,
    topActors,
  };
}

export function getTimelineData(days = 7) {
  const db = getDb();
  return db.prepare(`
    SELECT
      DATE(event_datetime_utc) as date,
      COUNT(*) as events,
      ROUND(AVG(severity_score), 1) as severity_avg,
      SUM(CASE WHEN severity_score >= 7 THEN 1 ELSE 0 END) as high_severity_count
    FROM events
    WHERE event_datetime_utc >= datetime('now', ? || ' days')
    AND duplicate_of IS NULL
    GROUP BY DATE(event_datetime_utc)
    ORDER BY date ASC
  `).all(`-${days}`);
}

export function getHotTopics(limit = 10) {
  const db = getDb();

  // Tags to EXCLUDE (system/internal tags, not useful for analysts)
  const excludedTags = [
    'news_aggregator', 'news_agency', 'news_outlet', 'specialist',
    'gdelt', 'conflict_database', 'state_media', 'social_media',
    'telegram', 'government', 'cyber_intelligence', 'monitoring_org',
    'open_data', 'international_org',
    'critical-event', 'high-severity', 'unconfirmed-report',
    'nuclear-related', 'casualty',
  ];

  // Get recent events (last 72 hours)
  const recentEvents = db.prepare(`
    SELECT tags, severity_score, event_datetime_utc, country, actor_1, event_type, domain
    FROM events
    WHERE event_datetime_utc >= datetime('now', '-72 hours')
    AND duplicate_of IS NULL
  `).all();

  // Count meaningful tags
  const tagData = {};
  recentEvents.forEach(row => {
    let tags;
    try {
      tags = JSON.parse(row.tags || '[]');
    } catch {
      tags = [];
    }

    tags.forEach(tag => {
      // Skip system/internal tags
      if (excludedTags.includes(tag)) return;
      // Skip very short tags
      if (tag.length < 3) return;

      if (!tagData[tag]) {
        tagData[tag] = {
          count: 0,
          total_severity: 0,
          latest: row.event_datetime_utc,
        };
      }
      tagData[tag].count += 1;
      tagData[tag].total_severity += (row.severity_score || 5);
      // Track latest event with this tag
      if (row.event_datetime_utc > tagData[tag].latest) {
        tagData[tag].latest = row.event_datetime_utc;
      }
    });
  });

  // Also extract topics from countries, actors, and event types
  const topicSources = {};

  recentEvents.forEach(row => {
    // Country-based topics
    if (row.country && row.country !== 'Unknown' && row.country !== 'International') {
      const key = `${row.country} activity`;
      if (!topicSources[key]) {
        topicSources[key] = { count: 0, total_severity: 0, type: 'country' };
      }
      topicSources[key].count += 1;
      topicSources[key].total_severity += (row.severity_score || 5);
    }

    // Actor-based topics (only known significant actors)
    if (row.actor_1) {
      const actor = row.actor_1;
      // Only include if mentioned enough times
      if (!topicSources[actor]) {
        topicSources[actor] = { count: 0, total_severity: 0, type: 'actor' };
      }
      topicSources[actor].count += 1;
      topicSources[actor].total_severity += (row.severity_score || 5);
    }

    // Domain-based topics when significant
    if (row.domain && row.domain !== 'military') {
      const domainTopic = `${row.domain} operations`;
      if (!topicSources[domainTopic]) {
        topicSources[domainTopic] = { count: 0, total_severity: 0, type: 'domain' };
      }
      topicSources[domainTopic].count += 1;
      topicSources[domainTopic].total_severity += (row.severity_score || 5);
    }
  });

  // Merge tag-based and topic-based, score them
  const allTopics = {};

  // Add tag-based topics
  Object.entries(tagData).forEach(([tag, data]) => {
    if (data.count >= 2) { // At least 2 mentions
      const avgSeverity = data.total_severity / data.count;
      // Score = count * avg_severity (weighted relevance)
      const score = data.count * avgSeverity;
      allTopics[tag] = {
        tag: formatTopicName(tag),
        raw_tag: tag,
        count: data.count,
        avg_severity: Math.round(avgSeverity * 10) / 10,
        score,
        type: 'tag',
      };
    }
  });

  // Add topic-based entries (only if significant)
  Object.entries(topicSources).forEach(([topic, data]) => {
    if (data.count >= 3 && !allTopics[topic.toLowerCase()]) { // At least 3 mentions
      const avgSeverity = data.total_severity / data.count;
      const score = data.count * avgSeverity;
      allTopics[topic] = {
        tag: topic,
        raw_tag: topic,
        count: data.count,
        avg_severity: Math.round(avgSeverity * 10) / 10,
        score,
        type: data.type,
      };
    }
  });

  // Sort by score (count * severity) and take top N
  const sorted = Object.values(allTopics)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return sorted;
}

// Helper: Format tag names to be human-readable
function formatTopicName(tag) {
  // Common tag formatting
  const specialNames = {
    'escalation': 'Escalation Signals',
    'de-escalation': 'De-escalation Efforts',
    'civilian-impact': 'Civilian Impact',
    'cross-border': 'Cross-Border Operations',
    'proxy-warfare': 'Proxy Warfare',
    'maritime': 'Maritime Operations',
    'aerial': 'Aerial Operations',
    'cyber': 'Cyber Operations',
    'economic': 'Economic Impact',
    'diplomatic': 'Diplomatic Activity',
    'intelligence': 'Intelligence Operations',
    'weapons-test': 'Weapons Testing',
    'breaking': 'Breaking Developments',
    'nuclear': 'Nuclear Concerns',
    'casualty': 'Casualties Reported',
    'strait-of-hormuz': 'Strait of Hormuz',
    'red-sea': 'Red Sea Shipping',
    'iron-dome': 'Iron Dome Activations',
    'airstrike': 'Airstrikes',
    'missile': 'Missile Activity',
    'drone': 'Drone Operations',
    'sanctions': 'Sanctions',
    'ceasefire': 'Ceasefire Talks',
    'deployment': 'Military Deployments',
    'interception': 'Interceptions',
    'info-warfare': 'Information Warfare',
  };

  if (specialNames[tag]) return specialNames[tag];

  // Generic formatting: replace hyphens/underscores with spaces, capitalize
  return tag
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ---- SOURCE QUERIES ----

export function upsertSource(source) {
  const db = getDb();
  db.prepare(`
    INSERT INTO sources (id, name, url, type, reliability_score, reliability_tier, config)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      url = excluded.url,
      reliability_score = excluded.reliability_score,
      reliability_tier = excluded.reliability_tier,
      config = excluded.config
  `).run(
    source.id, source.name, source.url, source.type,
    source.reliability_score, source.reliability_tier,
    JSON.stringify(source.config || {})
  );
}

export function updateSourceFetchTime(name) {
  const db = getDb();
  db.prepare(`
    UPDATE sources SET last_fetched_at = datetime('now'),
    total_events = (SELECT COUNT(*) FROM events WHERE source_name = ?)
    WHERE name = ?
  `).run(name, name);
}

export function getSources() {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM events WHERE source_name = s.name AND duplicate_of IS NULL) as event_count,
      (SELECT MAX(event_datetime_utc) FROM events WHERE source_name = s.name) as latest_event
    FROM sources s
    WHERE s.active = 1
    ORDER BY s.reliability_score DESC
  `).all();
}

// ---- INGESTION LOG ----

export function logIngestion(logEntry) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO ingestion_log (source_id, started_at, completed_at, status, events_fetched, events_new, events_duplicate, events_error, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logEntry.source_id,
    logEntry.started_at,
    logEntry.completed_at || null,
    logEntry.status,
    logEntry.events_fetched || 0,
    logEntry.events_new || 0,
    logEntry.events_duplicate || 0,
    logEntry.events_error || 0,
    logEntry.error_message || null
  );
}

export function getIngestionLogs(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT il.*, s.name as source_name
    FROM ingestion_log il
    LEFT JOIN sources s ON il.source_id = s.id
    ORDER BY il.started_at DESC
    LIMIT ?
  `).all(limit);
}