import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { mockEvents } from '../../data/mockEvents';
import { getSeverityColor, getVerificationColor, getSeverityLabel } from '../../utils/scoring';
import { useNavigate } from 'react-router-dom';

export default function HeadlinesFeed({ onSelectEvent }) {
  const navigate = useNavigate();
  const sortedEvents = [...mockEvents]
    .sort((a, b) => new Date(b.event_datetime_utc) - new Date(a.event_datetime_utc))
    .slice(0, 6);

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">
          Most Read Headlines
        </h2>
        <button
          onClick={() => navigate('/events')}
          className="text-xs text-accent-blue hover:text-accent-blue/80 flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {sortedEvents.map((event, idx) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent?.(event)}
            className="bg-bg-secondary border border-border-primary rounded-lg p-4 card-hover-effect cursor-pointer animate-slide-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-muted">
                  {event.source_name}
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(event.event_datetime_utc), { addSuffix: true })}
                </span>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getVerificationColor(event.verification_status)}`}>
                {event.verification_status}
              </span>
            </div>

            {/* Claim text */}
            <p className="text-sm text-text-primary leading-relaxed mb-3">
              {event.claim_text.length > 160
                ? event.claim_text.substring(0, 160) + "..."
                : event.claim_text
              }
            </p>

            {/* Footer metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.country}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.actor_1.length > 20 ? event.actor_1.substring(0, 20) + "..." : event.actor_1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${getSeverityColor(event.severity_score)}`}>
                  SEV {event.severity_score}/10
                </span>
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-text-muted hover:text-accent-blue transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}