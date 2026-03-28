# OSINT Conflict Monitor

A real-time intelligence monitoring system for tracking Iran-Israel geopolitical conflict events with automated data ingestion, analysis, and visualization.

## 🎯 Project Overview

**OSINT Conflict Monitor** is a sophisticated open-source intelligence (OSINT) platform designed to:
- **Aggregate** conflict event data from multiple trusted sources (RSS feeds, GDELT, ACLED, news agencies)
- **Analyze** events for patterns, escalation signals, and anomalies
- **Visualize** geopolitical events on interactive maps
- **Track** source reliability and verification status
- **Forecast** escalation risks through data-driven analysis

### Key Use Cases
- Real-time situational awareness for conflict zones
- Intelligence analysis and pattern detection
- Media monitoring and disinformation tracking
- Risk assessment and escalation forecasting
- Source reliability assessment

---

## 📁 Project Structure

```
SAIG/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── server.js          # Main server entry point
│   │   ├── config/            # Configuration management
│   │   ├── database/          # SQLite database layer (sql.js)
│   │   │   ├── setup.js       # Schema and initialization
│   │   │   └── queries.js     # Query builders and helpers
│   │   ├── api/
│   │   │   ├── routes/        # Express route handlers
│   │   │   │   ├── events.js
│   │   │   │   ├── dashboard.js
│   │   │   │   ├── analysis.js
│   │   │   │   └── sources.js
│   │   │   └── middleware/    # CORS, rate limiting, error handling
│   │   ├── ingestion/         # Data collection pipeline
│   │   │   ├── manager.js     # Orchestration and scheduling
│   │   │   ├── processors/    # Event normalization
│   │   │   │   ├── normalizer.js
│   │   │   │   ├── deduplicator.js
│   │   │   │   ├── scorer.js
│   │   │   │   └── entityExtractor.js
│   │   │   └── sources/       # Data source connectors
│   │   │       ├── rssFeeds.js      # RSS parser
│   │   │       ├── gdeltCollector.js # GDELT API
│   │   │       └── acledCollector.js # ACLED API
│   │   ├── analysis/          # Intelligence analysis
│   │   │   ├── escalation.js  # Escalation index calculation
│   │   │   ├── trends.js      # Temporal trend analysis
│   │   │   └── patterns.js    # Anomaly detection
│   │   └── utils/
│   │       ├── constants.js   # Actor/location/source definitions
│   │       ├── logger.js      # Winston logging
│   │       └── keepalive.js   # Keep-alive for serverless
│   ├── data/                  # SQLite database files
│   ├── logs/                  # Application logs
│   └── package.json
│
└── osint-monitor/             # React/Vite frontend
    ├── src/
    │   ├── main.jsx           # React entry point
    │   ├── App.jsx            # Main router
    │   ├── index.css          # Tailwind + custom styles
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   ├── Header.jsx # Navigation
    │   │   │   └── Layout.jsx # Main layout wrapper
    │   │   ├── Dashboard/     # Dashboard page
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── StatsPanel.jsx
    │   │   │   ├── HotTopics.jsx
    │   │   │   ├── HeadlinesFeed.jsx
    │   │   │   └── TrendChart.jsx
    │   │   ├── EventFeed/     # Event listing and details
    │   │   │   ├── EventFeed.jsx
    │   │   │   ├── EventCard.jsx
    │   │   │   ├── EventDetail.jsx
    │   │   │   └── EventFilters.jsx
    │   │   ├── MapView/       # Leaflet map visualization
    │   │   │   └── ConflictMap.jsx
    │   │   ├── Analysis/      # Trend analysis page
    │   │   │   └── TrendView.jsx
    │   │   └── Sources/       # Source reliability tracker
    │   │       └── SourceTracker.jsx
    │   ├── services/
    │   │   └── api.js         # API client
    │   ├── hooks/
    │   │   └── useEvents.js   # Events data hook
    │   ├── utils/
    │   │   ├── scoring.js     # Severity/confidence calculations
    │   │   └── filters.js     # Event filtering utilities
    │   └── data/
    │       └── mockEvents.js  # Sample event data
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Git**

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "NODE_ENV=development" > .env
echo "PORT=3001" >> .env
echo "LOG_LEVEL=info" >> .env
echo "GDELT_FETCH_INTERVAL_MINUTES=30" >> .env
echo "RSS_FETCH_INTERVAL_MINUTES=15" >> .env

# Start development server with auto-reload
npm run dev

# Or run in production mode
npm start
```

**Backend runs on:** `http://localhost:3001`

### Frontend Setup

```bash
cd osint-monitor

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Frontend runs on:** `http://localhost:5173`

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Database
DB_PATH=./data/osint.db

# GDELT Project (free, no API key required)
GDELT_API_URL=https://api.gdeltproject.org/api/v2/doc/doc
GDELT_FETCH_INTERVAL_MINUTES=30

# ACLED (requires registration: https://acleddata.com/)
ACLED_API_URL=https://api.acleddata.com/acled/read
ACLED_API_KEY=your_key_here
ACLED_EMAIL=your_email_here

# RSS Feeds
RSS_FETCH_INTERVAL_MINUTES=15
```

---

## 📊 Core Features

### 1. **Data Ingestion Pipeline**
- **Multi-source ingestion** from RSS feeds, GDELT, ACLED
- **Automated scheduling** with node-cron (every 15-30 minutes)
- **Deduplication** using content hashing
- **Normalization** to standard event schema
- **Reliability scoring** based on source type

**Supported Sources:**
- Major news agencies (Reuters, AP, BBC, CNN)
- Regional outlets (Al Arabiya, Haaretz, Times of Israel)
- Specialist sources (GDELT, ACLED, Defense One)
- Government releases (White House, CENTCOM)

### 2. **Event Model**
```javascript
{
  id: string,                          // Unique identifier
  event_datetime_utc: string,          // ISO 8601 timestamp
  source_name: string,                 // Source name
  source_url: string,                  // Original URL
  source_type: string,                 // news_agency, government, etc.
  claim_text: string,                  // Full event description
  country: string,                     // Primary country
  location_text: string,               // Human-readable location
  lat: number,                         // Latitude
  lng: number,                         // Longitude
  actor_1: string,                     // Primary actor
  actor_2: string,                     // Secondary actor
  event_type: string,                  // airstrike, missile_attack, etc.
  domain: string,                      // military, diplomatic, cyber, etc.
  severity_score: 1-10,                // Calculated severity
  confidence_score: 1-10,              // Source reliability
  verification_status: string,         // verified, unverified, rumor
  tags: string[],                      // Categorization tags
  raw_data: object,                    // Original source data
  content_hash: string,                // SHA-256 for deduplication
  last_updated_at: string              // Last modification time
}
```

### 3. **Analysis Engines**

#### Escalation Index
- Calculates real-time escalation risk (0-100)
- Considers:
  - Event frequency trends (24h vs 7-day baseline)
  - High-severity event concentration
  - Multi-domain activity
  - Actor count and type
- **Output:** Risk level (minimal, low, medium, high, critical)

#### Trend Analysis
- Event distribution by actor, type, country, domain
- Temporal patterns over configurable period (7-90 days)
- Geographic hotspot identification
- Topic clustering and trending

#### Anomaly Detection
- **Frequency spikes:** Unusual event clustering
- **Multi-actor convergence:** 5+ actors in 24 hours
- **New domain activity:** First-time cyber/diplomatic events
- **Information fog:** High ratio of unverified reports

### 4. **Interactive Visualization**

#### Dashboard
- Real-time stats (total events, 24h/48h counts)
- Verification breakdown (verified/unverified/rumor)
- Hot topics trending in 72h window
- Escalation index gauge
- 7-day event trend chart

#### Event Feed
- Filterable event list
- Advanced filtering by country, domain, actor, severity, verification
- Full-text search
- Detailed event inspector
- Related events linking

#### Conflict Map
- Leaflet-based interactive map
- Cluster markers by severity
- Regional grouping and filtering
- Event detail popups
- Geolocated event list panel

#### Trend Analysis
- Actor activity timelines
- Event type distribution
- Domain breakdown (pie chart)
- Escalation signals (high/medium/low)
- Anomaly detection panel

#### Source Tracker
- Source reliability scoring methodology
- Type breakdown (news agencies, state media, OSINT)
- Individual source profiles
- Event contribution tracking
- Ingestion logs

### 5. **Severity & Verification Scoring**

**Severity Levels:**
- 9-10: Critical (active combat, casualties)
- 7-8: High (attacks, interceptions)
- 5-6: Medium (deployments, statements)
- 3-4: Low (warnings, tensions)
- 1-2: Minimal (diplomatic activity)

**Verification Status:**
- **Verified:** Tier 1-2 sources, independent confirmation
- **Unverified:** Medium reliability sources
- **Rumor:** Low reliability, social media, requires corroboration

**Confidence Score:**
- Based on source reliability tier (1-10)
- Adjusted for reporting consistency
- Considers geographic data availability

---

## 🔌 API Endpoints

### Dashboard
```
GET /api/dashboard
  Returns: stats, timeline, hotTopics, escalation, anomalies, recentEvents
```

### Events
```
GET /api/events
  Query params: limit, offset, sortBy, sortOrder, country, domain, eventType, 
                verification, minSeverity, sourceType, search, actor
  Returns: paginated events with total count

GET /api/events/:id
  Returns: detailed event with related events

GET /api/events/filters
  Returns: available filter options
```

### Analysis
```
GET /api/analysis/escalation
  Returns: escalationIndex, level, signals, reasoning

GET /api/analysis/trends?days=14
  Returns: byActor, byEventType, byCountry, temporal patterns

GET /api/analysis/anomalies
  Returns: detected signals with level and description
```

### Sources
```
GET /api/sources
  Returns: active sources with reliability scores and event counts

GET /api/sources/ingestion-logs
  Query params: limit
  Returns: ingestion history and statistics
```

---

## 🗄️ Database Schema

**SQLite Database** (sql.js in-memory with disk persistence)

### Tables
- **events:** Core event data (indexed by datetime, country, domain, severity)
- **sources:** Data source registry with reliability scores
- **ingestion_log:** Ingestion cycle history and statistics

### Indexes
- `idx_events_datetime` - Fast temporal queries
- `idx_events_country` - Geographic filtering
- `idx_events_domain` - Domain classification
- `idx_events_severity` - Risk analysis
- `idx_events_content_hash` - Deduplication

---

## 🎨 Frontend Architecture

### Tech Stack
- **React 19** - Component framework
- **Vite 8** - Build tool
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization
- **Leaflet** - Map rendering
- **Lucide React** - Icons
- **date-fns** - Date utilities
- **React Router** - Navigation

### Design System
- **Dark theme** with blue accent colors
- **Responsive grid layouts** (mobile-first)
- **Glow effects** for emphasis
- **Severity-based color coding**
- **Real-time animations**

### Custom Hooks
```javascript
useEvents() - Fetches dashboard data, manages stats, handles refresh
```

### Custom Utilities
```javascript
getSeverityLabel(score) - Returns "Critical", "High", etc.
getSeverityColor(score) - Returns Tailwind color classes
getVerificationColor(status) - Returns color for verification status
calculateEscalationIndex(events) - Calculates risk level
```

---

## 📈 Data Flow

```
RSS Feeds / GDELT / ACLED
    ↓
[Ingestion Manager] (scheduled every 15-30 min)
    ↓
[Normalizer] (standardize schema)
    ↓
[Deduplicator] (SHA-256 content hash)
    ↓
[Scorer] (calculate severity, confidence)
    ↓
[Entity Extractor] (identify actors, locations)
    ↓
SQLite Database
    ↓
[Analysis Engines]
├─ Escalation Index
├─ Trend Analysis
└─ Anomaly Detection
    ↓
REST API (/api/*)
    ↓
React Frontend
├─ Dashboard
├─ Event Feed
├─ Map View
├─ Trends
└─ Sources
```

---

## 🔐 Security Features

- **CORS protection** - Configurable allowed origins
- **Helmet.js** - HTTP security headers
- **Rate limiting** - API request throttling
- **Input validation** - SQL injection prevention via parameterized queries
- **Error handling** - Centralized error middleware
- **Logging** - Winston with sensitive data masking

---

## 📝 Development Guidelines

### Code Style
- **ES6 modules** throughout
- **Arrow functions** preferred
- **Consistent naming:** camelCase for variables, PascalCase for components
- **Comments** for complex logic
- **No console.log** - use logger instead

### Backend Development
```bash
# Watch mode
npm run dev

# Check logs
tail -f logs/combined.log

# Manual ingestion (testing)
curl -X POST http://localhost:3001/api/ingest
```

### Frontend Development
```bash
# Hot reload
npm run dev

# Lint
npm run lint

# Build
npm run build
```

### Adding a New Data Source

1. Create connector in `backend/src/ingestion/sources/yourSource.js`
2. Implement `async function fetch...Data()` returning normalized events
3. Register in `backend/src/ingestion/manager.js` registerSources()
4. Add source to `backend/src/utils/constants.js` SOURCE_RELIABILITY

### Adding a New Analysis
1. Create analyzer in `backend/src/analysis/yourAnalysis.js`
2. Export function receiving database queries
3. Register in `backend/src/api/routes/analysis.js`
4. Call from frontend via `/api/analysis/yourEndpoint`

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check port 3001 is free
netstat -tuln | grep 3001

# Check Node version
node --version  # Should be >= 18

# Check logs
tail -f logs/error.log
```

### Database issues
```bash
# Database file is corrupted
rm backend/data/osint.db*

# Restart backend - will reinitialize
npm run dev
```

### No events showing
```bash
# Check ingestion is running
curl http://localhost:3001/api/health

# Manual ingestion trigger
curl -X POST http://localhost:3001/api/ingest

# Check ingestion logs
curl http://localhost:3001/api/sources/ingestion-logs
```

### Frontend connectivity errors
- Verify backend is running: `curl http://localhost:3001`
- Check CORS origin in `.env`
- Check browser console for exact errors

---

## 📦 Deployment

### Vercel (Frontend)
```bash
cd osint-monitor
npm install
npm run build

# Connect to Vercel via CLI or GitHub
```

### Render.com (Backend)
```bash
# Create new Web Service
# Connect GitHub repository
# Set NODE_ENV=production
# Set PORT (Render assigns automatically)
# Database persists in ./data directory
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 📚 Key Resources

- **GDELT Project:** https://www.gdeltproject.org/
- **ACLED Data:** https://acleddata.com/
- **Leaflet Maps:** https://leafletjs.com/
- **Recharts:** https://recharts.org/
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/

---

## 👥 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code guidelines
3. Test thoroughly (backend + frontend)
4. Commit with clear messages: `git commit -m "feat: add feature"`
5. Push and create pull request

---



## 📞 Support

For issues, questions, or suggestions:
- Check existing GitHub issues
- Review logs in `backend/logs/`
- Inspect browser console for frontend errors

---

**Last Updated:** March 2026
**Version:** 1.0.0
**Status:** Active Development
