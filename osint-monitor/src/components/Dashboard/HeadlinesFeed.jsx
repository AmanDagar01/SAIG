import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock, MapPin, Users, ChevronRight, Loader2 } from 'lucide-react';
import { getSeverityColor, getVerificationColor } from '../../utils/scoring';
import { useNavigate } from 'react-router-dom';

export default function HeadlinesFeed({ events, onSelectEvent }) {
  const navigate = useNavigate();

  const parsedEvents = (events || []).map(e => ({
    ...e,
    tags: typeof e.tags === 'string' ? JSON.parse(e.tags) : e.tags || [],
  }));

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">
          Latest Events
        </h2>
        <button
          onClick={() => navigate('/events')}
          className="text-xs text-accent-blue hover:text-accent-blue/80 flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {parsedEvents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-6 h-6 text-accent-blue animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">
              Loading events...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {parsedEvents.map((event, idx) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent?.(event)}
              className="bg-bg-secondary border border-border-primary rounded-lg p-4 card-hover-effect cursor-pointer animate-slide-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted">
                    {event.source_name}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(
                      new Date(event.event_datetime_utc),
                      { addSuffix: true }
                    )}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getVerificationColor(event.verification_status)}`}
                >
                  {event.verification_status}
                </span>
              </div>

              {/* Text */}
              <p className="text-sm text-text-primary leading-relaxed mb-3">
                {(event.title || event.claim_text || '').length > 160
                  ? (event.title || event.claim_text || '').substring(0, 160) + '...'
                  : event.title || event.claim_text || ''
                }
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {event.country && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.country}
                    </span>
                  )}
                  {event.actor_1 && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.actor_1.length > 20
                        ? event.actor_1.substring(0, 20) + '...'
                        : event.actor_1}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${getSeverityColor(event.severity_score)}`}
                  >
                    SEV {event.severity_score}/10
                  </span>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-text-muted hover:text-accent-blue transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}