import { formatDistanceToNow, format } from 'date-fns';
import { ExternalLink, Clock, MapPin, Users, Shield, Tag } from 'lucide-react';
import {
  getSeverityColor,
  getSeverityBg,
  getSeverityLabel,
  getVerificationColor,
  getConfidenceLabel,
  getSourceTypeLabel
} from '../../utils/scoring';

export default function EventCard({ event, onClick, index = 0 }) {
  return (
    <div
      onClick={() => onClick?.(event)}
      className="bg-bg-card border border-border-primary rounded-xl p-5 card-hover-effect cursor-pointer animate-slide-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getVerificationColor(event.verification_status)}`}>
            {event.verification_status}
          </span>
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getSeverityBg(event.severity_score)}`}>
            {getSeverityLabel(event.severity_score)}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-bg-secondary text-text-muted border border-border-primary capitalize">
            {event.domain}
          </span>
        </div>
        <div className={`text-lg font-bold ${getSeverityColor(event.severity_score)} shrink-0`}>
          {event.severity_score}
        </div>
      </div>

      {/* Claim text */}
      <p className="text-sm text-text-primary leading-relaxed mb-3">
        {event.claim_text}
      </p>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-text-muted" />
          <span>{formatDistanceToNow(new Date(event.event_datetime_utc), { addSuffix: true })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-text-muted" />
          <span className="truncate">{event.location_text}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-text-muted" />
          <span>{event.source_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-text-muted" />
          <span className="truncate">{event.actor_1}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {event.tags.slice(0, 4).map(tag => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
          >
            {tag}
          </span>
        ))}
        {event.tags.length > 4 && (
          <span className="text-[10px] text-text-muted">+{event.tags.length - 4}</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-primary">
        <div className="text-xs text-text-muted">
          Confidence: <span className="text-text-secondary font-medium">{getConfidenceLabel(event.confidence_score)} ({event.confidence_score}/10)</span>
        </div>
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-xs text-accent-blue hover:underline flex items-center gap-1"
        >
          Source <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}