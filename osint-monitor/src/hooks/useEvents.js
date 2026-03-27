import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchDashboard,
  fetchEvents as fetchEventsApi,
  fetchFilterOptions,
} from '../services/api';

export function useEvents() {
  // ---- State ----
  const [dashboardData, setDashboardData] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [filterOptions, setFilterOptions] = useState(null);

  const [filters, setFilters] = useState({
    searchQuery: '',
    verification: 'all',
    domain: 'all',
    minSeverity: 0,
    country: 'all',
    sourceType: 'all',
    eventType: 'all',
  });

  const [sortBy, setSortBy] = useState('datetime_desc');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  // ---- Sort mapping ----
  const sortMap = {
    datetime_desc: { sortBy: 'event_datetime_utc', sortOrder: 'DESC' },
    datetime_asc: { sortBy: 'event_datetime_utc', sortOrder: 'ASC' },
    severity_desc: { sortBy: 'severity_score', sortOrder: 'DESC' },
    severity_asc: { sortBy: 'severity_score', sortOrder: 'ASC' },
    confidence_desc: { sortBy: 'confidence_score', sortOrder: 'DESC' },
  };

  // ---- Load dashboard data ----
  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
      // Use recent events from dashboard for the main event list
      if (data.recentEvents) {
        setAllEvents(
          data.recentEvents.map(e => ({
            ...e,
            tags: typeof e.tags === 'string' ? JSON.parse(e.tags) : e.tags || [],
          }))
        );
      }
      setError(null);
    } catch (err) {
      console.error('Dashboard load failed:', err);
      setError(err.message);
    }
  }, []);

  // ---- Load filtered events from API ----
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const currentSort = sortMap[sortBy] || sortMap.datetime_desc;

      const result = await fetchEventsApi({
        limit,
        offset: page * limit,
        sortBy: currentSort.sortBy,
        sortOrder: currentSort.sortOrder,
        country: filters.country !== 'all' ? filters.country : undefined,
        domain: filters.domain !== 'all' ? filters.domain : undefined,
        eventType: filters.eventType !== 'all' ? filters.eventType : undefined,
        verification:
          filters.verification !== 'all' ? filters.verification : undefined,
        minSeverity: filters.minSeverity > 0 ? filters.minSeverity : undefined,
        sourceType:
          filters.sourceType !== 'all' ? filters.sourceType : undefined,
        search: filters.searchQuery || undefined,
      });

      const parsed = (result.events || []).map(e => ({
        ...e,
        tags: typeof e.tags === 'string' ? JSON.parse(e.tags) : e.tags || [],
      }));

      setFilteredEvents(parsed);
      setTotal(result.total || 0);
      setError(null);
    } catch (err) {
      console.error('Events load failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, page]);

  // ---- Load filter options ----
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await fetchFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Filter options load failed:', err);
    }
  }, []);

  // ---- Initial load ----
  useEffect(() => {
    loadDashboard();
    loadFilterOptions();
  }, [loadDashboard, loadFilterOptions]);

  // ---- Reload events when filters/sort/page change ----
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ---- Filter helpers ----
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      verification: 'all',
      domain: 'all',
      minSeverity: 0,
      country: 'all',
      sourceType: 'all',
      eventType: 'all',
    });
    setPage(0);
  }, []);

  // ---- Build stats from dashboard data ----
  const stats = useMemo(() => {
    if (!dashboardData || !dashboardData.stats) {
      return {
        total: 0,
        last24h: 0,
        verified: 0,
        unverified: 0,
        rumors: 0,
        domainCounts: {},
        countryCounts: {},
        avgSeverity: 0,
        highestSeverityRegion: 'N/A',
        topDomain: 'N/A',
      };
    }

    const d = dashboardData.stats;

    const verMap = {};
    (d.verificationBreakdown || []).forEach(v => {
      verMap[v.verification_status] = v.count;
    });

    return {
      total: d.total || 0,
      last24h: d.last24h || 0,
      verified: verMap['verified'] || 0,
      unverified: verMap['unverified'] || 0,
      rumors: verMap['rumor'] || 0,
      domainCounts: Object.fromEntries(
        (d.domainBreakdown || []).map(x => [x.domain, x.count])
      ),
      countryCounts: Object.fromEntries(
        (d.countryBreakdown || []).map(x => [x.country, x.count])
      ),
      avgSeverity: d.avgSeverity || 0,
      highestSeverityRegion: d.countryBreakdown?.[0]?.country || 'N/A',
      topDomain: d.domainBreakdown?.[0]?.domain || 'N/A',
    };
  }, [dashboardData]);

  // ---- Return ----
  return {
    events: allEvents,
    filteredEvents,
    filters,
    sortBy,
    selectedEvent,
    stats,
    total,
    loading,
    error,
    page,
    limit,
    dashboardData,
    filterOptions,
    updateFilter,
    resetFilters,
    setSortBy,
    setSelectedEvent,
    setPage,
    refresh: () => {
      loadDashboard();
      loadEvents();
    },
  };
}