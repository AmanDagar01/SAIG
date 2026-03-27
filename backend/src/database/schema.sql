-- Events table - core data
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    event_datetime_utc TEXT NOT NULL,
    ingested_at TEXT NOT NULL DEFAULT (datetime('now')),
    source_name TEXT NOT NULL,
    source_url TEXT,
    source_type TEXT NOT NULL,
    source_reliability_score INTEGER DEFAULT 5,
    claim_text TEXT NOT NULL,
    title TEXT,
    country TEXT,
    location_text TEXT,
    lat REAL,
    lng REAL,
    geo_method TEXT,
    actor_1 TEXT,
    actor_2 TEXT,
    event_type TEXT,
    domain TEXT,
    severity_score INTEGER DEFAULT 5,
    confidence_score INTEGER DEFAULT 5,
    verification_status TEXT DEFAULT 'unverified',
    tags TEXT DEFAULT '[]',
    raw_data TEXT,
    content_hash TEXT UNIQUE,
    duplicate_of TEXT,
    last_updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Source tracking
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    url TEXT,
    type TEXT NOT NULL,
    reliability_score INTEGER DEFAULT 5,
    reliability_tier INTEGER DEFAULT 5,
    last_fetched_at TEXT,
    total_events INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    config TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ingestion log - REMOVED FOREIGN KEY CONSTRAINT
CREATE TABLE IF NOT EXISTS ingestion_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running',
    events_fetched INTEGER DEFAULT 0,
    events_new INTEGER DEFAULT 0,
    events_duplicate INTEGER DEFAULT 0,
    events_error INTEGER DEFAULT 0,
    error_message TEXT
);

-- Analysis snapshots
CREATE TABLE IF NOT EXISTS analysis_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_type TEXT NOT NULL,
    snapshot_data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(event_datetime_utc DESC);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_domain ON events(domain);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_verification ON events(verification_status);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_name);
CREATE INDEX IF NOT EXISTS idx_events_content_hash ON events(content_hash);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_actor1 ON events(actor_1);
CREATE INDEX IF NOT EXISTS idx_events_duplicate ON events(duplicate_of);
CREATE INDEX IF NOT EXISTS idx_ingestion_source ON ingestion_log(source_id);