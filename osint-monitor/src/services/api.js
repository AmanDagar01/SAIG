// Auto-detect API URL based on environment
const API_BASE = 'https://osint-backend-ai8q.onrender.com/api' || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchApi(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'all' &&
      value !== 0
    ) {
      url.searchParams.append(key, value);
    }
  });

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new ApiError(
        `API Error: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`Network error fetching ${endpoint}:`, error);
    throw new Error(`Failed to connect to backend: ${error.message}`);
  }
}

// ---- Dashboard ----
export async function fetchDashboard() {
  return fetchApi('/dashboard');
}

// ---- Events ----
export async function fetchEvents({
  limit = 50,
  offset = 0,
  sortBy = 'event_datetime_utc',
  sortOrder = 'DESC',
  country,
  domain,
  eventType,
  verification,
  minSeverity,
  sourceType,
  search,
  actor,
} = {}) {
  return fetchApi('/events', {
    limit, offset, sortBy, sortOrder,
    country, domain, eventType, verification,
    minSeverity, sourceType, search, actor,
  });
}

export async function fetchEventById(id) {
  return fetchApi(`/events/${id}`);
}

export async function fetchFilterOptions() {
  return fetchApi('/events/filters');
}

// ---- Analysis ----
export async function fetchEscalation() {
  return fetchApi('/analysis/escalation');
}

export async function fetchTrends(days = 14) {
  return fetchApi('/analysis/trends', { days });
}

export async function fetchAnomalies() {
  return fetchApi('/analysis/anomalies');
}

// ---- Sources ----
export async function fetchSources() {
  return fetchApi('/sources');
}

export async function fetchIngestionLogs(limit = 30) {
  return fetchApi('/sources/ingestion-logs', { limit });
}

// ---- Health ----
export async function fetchHealth() {
  return fetchApi('/health');
}

// ---- Manual ingestion (dev) ----
export async function triggerIngestion() {
  const response = await fetch(`${API_BASE}/ingest`, { method: 'POST' });
  return response.json();
}