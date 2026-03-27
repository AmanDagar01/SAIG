import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock, MapPin, Users, Shield } from 'lucide-react';
import {
  getSeverityColor,
  getSeverityBg,
  getSeverityLabel,
  getVerificationColor,
  getConfidenceLabel,
} from '../../utils/scoring';

function safe(value, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
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

function safeDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default function EventCard({ event, onClick, index = 0 }) {
  const tags = safeParseTags(event.tags);
  const eventDate = safeDate(event.event_datetime_utc);
  const displayText = safe(event.title) || safe(event.claim_text, 'No description available.');

  return (
    <div
      onClick={() => onClick?.(event)}
      className="bg-bg-card border border-border-primary rounded-xl p-5 card-hover-effect cursor-pointer animate-slide-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Top row - badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getVerificationColor(safe(event.verification_status, 'unverified'))}`}
          >
            {safe(event.verification_status, 'unverified')}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getSeverityBg(event.severity_score || 5)}`}
          >
            {getSeverityLabel(event.severity_score || 5)}
          </span>
          {event.domain && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-bg-secondary text-text-muted border border-border-primary capitalize">
              {event.domain}
            </span>
          )}
        </div>
        <div
          className={`text-lg font-bold ${getSeverityColor(event.severity_score || 5)} shrink-0`}
        >
          {event.severity_score || 5}
        </div>
      </div>

      {/* Claim text */}
      <p className="text-sm text-text-primary leading-relaxed mb-3">
        {displayText.length > 200
          ? displayText.substring(0, 200) + '...'
          : displayText}
      </p>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-text-muted" />
          <span>
            {eventDate
              ? formatDistanceToNow(eventDate, { addSuffix: true })
              : 'Unknown time'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-text-muted" />
          <span className="truncate">
            {safe(event.location_text) || safe(event.country, 'Unknown')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-text-muted" />
          <span>{safe(event.source_name, 'Unknown source')}</span>
        </div>
        {event.actor_1 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-text-muted" />
            <span className="truncate">{event.actor_1}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-[10px] text-text-muted">
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-border-primary">
        <div className="text-xs text-text-muted">
          Confidence:{' '}
          <span className="text-text-secondary font-medium">
            {getConfidenceLabel(event.confidence_score || 5)} (
            {event.confidence_score || 5}/10)
          </span>
        </div>
        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-accent-blue hover:underline flex items-center gap-1"
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}