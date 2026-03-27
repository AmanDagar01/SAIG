import React, { useState, useMemo, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

import { fetchEvents } from '../../services/api';
import { getSeverityColor, getSeverityLabel, getVerificationColor } from '../../utils/scoring';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, X, ExternalLink, Loader2 } from 'lucide-react';
import EventDetail from '../EventFeed/EventDetail';

// ---- Icon Fixes ----
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ---- Severity Color Helper ----
const getSeverityDotColor = (score) => {
  if (score >= 9) return '#ff0040';
  if (score >= 7) return '#ff4a00';
  if (score >= 5) return '#ff8c00';
  if (score >= 3) return '#ffd700';
  return '#00cc88';
};

// ---- Custom Marker ----
const createSeverityIcon = (severity) => {
  const color = getSeverityDotColor(severity);
  const size = severity >= 9 ? 16 : severity >= 7 ? 14 : severity >= 5 ? 12 : 10;

  return L.divIcon({
    className: 'custom-severity-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.7);
      box-shadow: 0 0 8px ${color}90, 0 0 16px ${color}50, 0 0 24px ${color}30;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  });
};

// ---- Custom Cluster Icon ----
const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const markers = cluster.getAllChildMarkers();

  let maxSev = 0;
  markers.forEach(m => {
    const sev = m.options.severity || 0;
    if (sev > maxSev) maxSev = sev;
  });

  const color = getSeverityDotColor(maxSev);
  const size = count >= 50 ? 52 : count >= 20 ? 46 : count >= 10 ? 42 : count >= 5 ? 38 : 34;

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: ${size > 44 ? 15 : 13}px;
      font-family: Inter, system-ui, sans-serif;
      box-shadow: 0 0 12px ${color}70, 0 0 24px ${color}40;
      border: 2.5px solid rgba(255,255,255,0.35);
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ---- Map Controller ----
function MapController({ selectedRegion, regionGroups }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);

  useEffect(() => {
    if (selectedRegion && regionGroups[selectedRegion]) {
      const group = regionGroups[selectedRegion];
      if (group.events.length === 1) {
        map.flyTo([group.events[0].lat, group.events[0].lng], 8, { duration: 1 });
      } else {
        const bounds = L.latLngBounds(group.events.map(e => [e.lat, e.lng]));
        map.flyToBounds(bounds.pad(0.4), { duration: 1, maxZoom: 8 });
      }
    }
  }, [selectedRegion, regionGroups, map]);

  return null;
}

// ---- Main Component ----
export default function ConflictMap() {
  const [allEvents, setAllEvents] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load events from API
  useEffect(() => {
    async function loadMapEvents() {
      try {
        setLoading(true);
        const result = await fetchEvents({
          limit: 500,
          sortBy: 'severity_score',
          sortOrder: 'DESC',
        });
        const parsed = (result.events || []).map(e => ({
          ...e,
          tags: typeof e.tags === 'string' ? JSON.parse(e.tags) : e.tags || [],
        }));
        setAllEvents(parsed);
        setError(null);
      } catch (err) {
        console.error('Map events load failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMapEvents();
  }, []);

  // Filter events that have valid coordinates
  const eventsWithCoords = useMemo(() =>
    allEvents.filter(e =>
      typeof e.lat === 'number' &&
      typeof e.lng === 'number' &&
      e.lat !== 0 &&
      e.lng !== 0
    ),
    [allEvents]
  );

  // Group events by country
  const regionGroups = useMemo(() => {
    const groups = {};
    eventsWithCoords.forEach(event => {
      const key = event.country;
      if (!key) return;
      if (!groups[key]) {
        groups[key] = { country: key, events: [], maxSeverity: 0 };
      }
      groups[key].events.push(event);
      groups[key].maxSeverity = Math.max(groups[key].maxSeverity, event.severity_score);
    });
    return groups;
  }, [eventsWithCoords]);

  // Loading state
  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin mb-4" />
        <p className="text-sm text-text-muted">Loading map data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <p className="text-sm text-accent-red mb-2">Failed to load map data</p>
        <p className="text-xs text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary mb-1">Conflict Map</h1>
        <p className="text-sm text-text-muted">
          {eventsWithCoords.length} geolocated events · Scroll to zoom · Drag to pan · Click markers for details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ---- MAP ---- */}
        <div className="lg:col-span-2 bg-bg-card border border-border-primary rounded-xl overflow-hidden glow-border relative">
          <div style={{ height: '620px', width: '100%', background: '#070710' }}>
            <MapContainer
              center={[30, 46]}
              zoom={4}
              minZoom={2}
              maxZoom={18}
              scrollWheelZoom={true}
              dragging={true}
              zoomControl={true}
              attributionControl={true}
              style={{
                height: '100%',
                width: '100%',
                background: '#070710',
              }}
            >
              <MapController selectedRegion={selectedRegion} regionGroups={regionGroups} />

              <TileLayer
                url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                subdomains="abcd"
                maxZoom={20}
              />

              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterIcon}
                maxClusterRadius={50}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
                disableClusteringAtZoom={12}
                animate={true}
              >
                {eventsWithCoords.map((event) => (
                  <Marker
                    key={event.id}
                    position={[event.lat, event.lng]}
                    icon={createSeverityIcon(event.severity_score)}
                    severity={event.severity_score}
                  >
                    <Popup maxWidth={300} minWidth={240}>
                      <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {/* Status + Severity */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                          paddingBottom: 8,
                          borderBottom: '1px solid #2a2a4a'
                        }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: 4,
                            color: event.verification_status === 'verified' ? '#00cc88'
                              : event.verification_status === 'unverified' ? '#ff8c00' : '#ff4a4a',
                            background: event.verification_status === 'verified' ? 'rgba(0,204,136,0.12)'
                              : event.verification_status === 'unverified' ? 'rgba(255,140,0,0.12)' : 'rgba(255,74,74,0.12)',
                            border: `1px solid ${event.verification_status === 'verified' ? 'rgba(0,204,136,0.25)'
                              : event.verification_status === 'unverified' ? 'rgba(255,140,0,0.25)' : 'rgba(255,74,74,0.25)'}`,
                          }}>
                            {event.verification_status}
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: getSeverityDotColor(event.severity_score) }}>
                            {event.severity_score}/10
                          </span>
                        </div>

                        {/* Claim */}
                        <p style={{ fontSize: 12, lineHeight: 1.5, color: '#e0e0ff', marginBottom: 10 }}>
                          {(event.title || event.claim_text || '').length > 140
                            ? (event.title || event.claim_text || '').substring(0, 140) + '...'
                            : event.title || event.claim_text || ''
                          }
                        </p>

                        {/* Meta */}
                        <div style={{ fontSize: 10, color: '#8888aa', marginBottom: 10, lineHeight: 1.8 }}>
                          <div>📍 {event.location_text || event.country || 'Unknown'}</div>
                          {event.actor_1 && <div>👤 {event.actor_1}</div>}
                          <div>📰 {event.source_name} · {(event.event_type || 'unknown').replace(/_/g, ' ')}</div>
                        </div>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                            {event.tags.slice(0, 4).map(tag => (
                              <span key={tag} style={{
                                fontSize: 9, padding: '1px 6px', borderRadius: 10,
                                background: 'rgba(74,158,255,0.1)', color: '#4a9eff',
                                border: '1px solid rgba(74,158,255,0.2)',
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #2a2a4a', paddingTop: 8 }}>
                          <button
                            onClick={() => setDetailEvent(event)}
                            style={{
                              flex: 1, padding: '6px 0', background: '#4a9eff', color: '#fff',
                              border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            Full Details
                          </button>
                          {event.source_url && (
                            <a
                              href={event.source_url} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: '6px 12px', background: 'rgba(74,158,255,0.08)', color: '#4a9eff',
                                border: '1px solid rgba(74,158,255,0.2)', borderRadius: 6, fontSize: 11,
                                fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                              }}
                            >
                              Source ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 bg-bg-secondary/95 backdrop-blur-sm rounded-lg p-3 border border-border-primary" style={{ zIndex: 1000 }}>
            <p className="text-[10px] font-semibold text-text-muted mb-2 uppercase tracking-wider">Severity</p>
            <div className="flex items-center gap-3">
              {[
                { label: 'Critical', color: '#ff0040' },
                { label: 'High', color: '#ff4a00' },
                { label: 'Medium', color: '#ff8c00' },
                { label: 'Low', color: '#ffd700' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
                  <span className="text-[9px] text-text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active events badge */}
          <div className="absolute top-3 right-3 bg-bg-secondary/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-border-primary" style={{ zIndex: 1000 }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-red rounded-full pulse-dot" />
              <span className="text-[10px] text-text-muted font-medium">{eventsWithCoords.length} geolocated events</span>
            </div>
          </div>
        </div>

        {/* ---- SIDE PANEL ---- */}
        <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border max-h-[660px] overflow-hidden flex flex-col">
          {selectedRegion && regionGroups[selectedRegion] ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-red" />
                  {selectedRegion}
                </h3>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Region stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
                <div className="bg-bg-secondary rounded-lg p-3 border border-border-primary">
                  <p className="text-[10px] text-text-muted uppercase">Events</p>
                  <p className="text-xl font-bold text-text-primary">
                    {regionGroups[selectedRegion].events.length}
                  </p>
                </div>
                <div className="bg-bg-secondary rounded-lg p-3 border border-border-primary">
                  <p className="text-[10px] text-text-muted uppercase">Max Severity</p>
                  <p className={`text-xl font-bold ${getSeverityColor(regionGroups[selectedRegion].maxSeverity)}`}>
                    {regionGroups[selectedRegion].maxSeverity}/10
                  </p>
                </div>
              </div>

              {/* Events list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {regionGroups[selectedRegion].events
                  .sort((a, b) => new Date(b.event_datetime_utc) - new Date(a.event_datetime_utc))
                  .map(event => (
                    <div
                      key={event.id}
                      onClick={() => setDetailEvent(event)}
                      className="bg-bg-secondary border border-border-primary rounded-lg p-3 cursor-pointer card-hover-effect"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getVerificationColor(event.verification_status)}`}>
                          {event.verification_status}
                        </span>
                        <span className={`text-xs font-bold ${getSeverityColor(event.severity_score)}`}>
                          {event.severity_score}/10
                        </span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed mb-2">
                        {(event.title || event.claim_text || '').substring(0, 110)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">
                          {formatDistanceToNow(new Date(event.event_datetime_utc), { addSuffix: true })}
                        </span>
                        <span className="text-[10px] text-text-muted">{event.source_name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted py-8">
              <div className="p-4 rounded-full bg-bg-secondary mb-4">
                <MapPin className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium mb-1">Select a Region</p>
              <p className="text-xs text-center mb-6">Click a marker on the map or pick below</p>

              <div className="space-y-2 w-full">
                <p className="text-[10px] text-text-muted uppercase tracking-wider text-center mb-2">Regions by Severity</p>
                {Object.entries(regionGroups)
                  .sort(([, a], [, b]) => b.maxSeverity - a.maxSeverity)
                  .map(([country, group]) => (
                    <button
                      key={country}
                      onClick={() => setSelectedRegion(country)}
                      className="w-full flex items-center justify-between bg-bg-secondary border border-border-primary rounded-lg px-3 py-2.5 hover:bg-bg-card-hover transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getSeverityDotColor(group.maxSeverity) }}
                        />
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                          {country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">
                          {group.events.length} event{group.events.length > 1 ? 's' : ''}
                        </span>
                        <span className={`text-[10px] font-bold ${getSeverityColor(group.maxSeverity)}`}>
                          {getSeverityLabel(group.maxSeverity)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>

              {eventsWithCoords.length === 0 && !loading && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-text-muted">
                    No geolocated events found.
                  </p>
                  <p className="text-xs text-text-muted">
                    Events without coordinates won't appear on the map.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {detailEvent && (
        <EventDetail
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
        />
      )}
    </div>
  );
}