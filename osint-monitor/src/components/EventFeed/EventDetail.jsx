import { format } from 'date-fns';
import {
  X,
  ExternalLink,
  Clock,
  MapPin,
  Users,
  Shield,
  AlertTriangle,
  Globe,
  Crosshair,
  BarChart3,
} from 'lucide-react';
import {
  getSeverityColor,
  getSeverityBg,
  getSeverityLabel,
  getVerificationColor,
  getConfidenceLabel,
  getSourceTypeLabel,
  getSourceReliability,
} from '../../utils/scoring';

// Safe helper - prevents null.replace() errors
function safe(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function formatEventType(type) {
  if (!type) return 'N/A';
  return String(type).replace(/_/g, ' ');
}

function safeParseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default function EventDetail({ event, onClose }) {
  if (!event) return null;

  const reliability = getSourceReliability(safe(event.source_type, 'unknown'));
  const tags = safeParseTags(event.tags);

  const eventDate = safeParseDate(event.event_datetime_utc);
  const updatedDate = safeParseDate(event.last_updated_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-primary rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto glow-border animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-primary p-5 rounded-t-2xl flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded border ${getVerificationColor(safe(event.verification_status, 'unverified'))}`}
            >
              {safe(event.verification_status, 'unverified')}
            </span>
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded border ${getSeverityBg(event.severity_score || 5)}`}
            >
              {getSeverityLabel(event.severity_score || 5)} (
              {event.severity_score || 5}/10)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-card transition-colors text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Title (if available) */}
          {event.title && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Headline
              </h3>
              <p className="text-sm font-semibold text-text-primary leading-relaxed">
                {event.title}
              </p>
            </div>
          )}

          {/* Claim */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Claim / Report
            </h3>
            <p className="text-sm text-text-primary leading-relaxed bg-bg-card rounded-lg p-4 border border-border-primary">
              {safe(event.claim_text, 'No description available.')}
            </p>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={<Clock className="w-4 h-4 text-accent-blue" />}
              label="Date/Time (UTC)"
              value={
                eventDate
                  ? format(eventDate, "dd MMM yyyy, HH:mm 'UTC'")
                  : 'Unknown'
              }
            />
            <DetailItem
              icon={<MapPin className="w-4 h-4 text-accent-red" />}
              label="Location"
              value={safe(event.location_text, 'Not specified')}
            />
            <DetailItem
              icon={<Globe className="w-4 h-4 text-accent-green" />}
              label="Country"
              value={safe(event.country, 'Unknown')}
            />
            <DetailItem
              icon={<Crosshair className="w-4 h-4 text-accent-orange" />}
              label="Event Type"
              value={formatEventType(event.event_type)}
              capitalize
            />
            <DetailItem
              icon={<Users className="w-4 h-4 text-accent-blue" />}
              label="Actor 1"
              value={safe(event.actor_1, 'Not identified')}
            />
            <DetailItem
              icon={<Users className="w-4 h-4 text-severity-high" />}
              label="Actor 2"
              value={safe(event.actor_2, 'Not identified')}
            />
            <DetailItem
              icon={
                <BarChart3 className="w-4 h-4 text-accent-yellow" />
              }
              label="Confidence"
              value={`${getConfidenceLabel(event.confidence_score || 5)} (${event.confidence_score || 5}/10)`}
            />
            <DetailItem
              icon={<Shield className="w-4 h-4 text-accent-blue" />}
              label="Domain"
              value={safe(event.domain, 'Unclassified')}
              capitalize
            />
          </div>

          {/* Coordinates (if available) */}
          {event.lat && event.lng && (
            <div className="bg-bg-card rounded-lg p-3 border border-border-primary">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Coordinates
                </span>
                <span className="text-xs text-text-secondary font-mono">
                  {Number(event.lat).toFixed(4)}°,{' '}
                  {Number(event.lng).toFixed(4)}°
                </span>
              </div>
              {event.geo_method && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-text-muted">
                    Geo Method
                  </span>
                  <span className="text-xs text-text-secondary">
                    {safe(event.geo_method).replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Source info */}
          <div className="bg-bg-card rounded-lg p-4 border border-border-primary">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Source Information
            </h3>
            <div className="space-y-2">
              <SourceRow
                label="Source"
                value={safe(event.source_name, 'Unknown')}
                bold
              />
              <SourceRow
                label="Type"
                value={getSourceTypeLabel(
                  safe(event.source_type, 'unknown')
                )}
              />
              <SourceRow
                label="Reliability"
                value={`${reliability.label} (${reliability.score}/10)`}
              />
              {event.source_url && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Link</span>
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-blue hover:underline flex items-center gap-1"
                  >
                    View Source{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <SourceRow
                label="Last Updated"
                value={
                  updatedDate
                    ? format(updatedDate, "dd MMM yyyy, HH:mm 'UTC'")
                    : 'Unknown'
                }
              />
              {event.source_reliability_score && (
                <SourceRow
                  label="Source Score"
                  value={`${event.source_reliability_score}/10`}
                />
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intelligence Note
          <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-accent-orange" />
              <h3 className="text-xs font-semibold text-accent-orange uppercase tracking-wider">
                Analyst Note
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {event.verification_status === 'verified'
                ? 'This report has been attributed to a credible source (Tier 1-2). Source reliability score indicates high editorial standards. Treat as factual for operational purposes, but cross-reference for additional context.'
                : event.verification_status === 'unverified'
                  ? 'This report has NOT been independently verified. Source reliability is medium or below. Exercise caution. Cross-reference with additional sources before incorporating into assessments.'
                  : 'This report is classified as RUMOR. Source reliability is low (Tier 4-5). Possible disinformation or unsubstantiated claim. Do NOT use for decision-making without independent corroboration from credible sources.'}
            </p>
          </div> */}

          {/* Event ID (for reference)
          <div className="flex items-center justify-between pt-2 border-t border-border-primary">
            <span className="text-[10px] text-text-muted">
              Event ID: {safe(event.id, 'unknown').substring(0, 16)}...
            </span>
            {event.content_hash && (
              <span className="text-[10px] text-text-muted">
                Hash: {event.content_hash.substring(0, 12)}...
              </span>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function DetailItem({ icon, label, value, capitalize }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`text-sm text-text-primary font-medium ${capitalize ? 'capitalize' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function SourceRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">{label}</span>
      <span
        className={`text-sm ${bold ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
      >
        {value}
      </span>
    </div>
  );
}