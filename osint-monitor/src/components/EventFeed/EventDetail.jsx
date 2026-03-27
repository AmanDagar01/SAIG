import { format } from 'date-fns';
import {
  X,
  ExternalLink,
  Clock,
  MapPin,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Tag,
  Globe,
  Crosshair,
  BarChart3
} from 'lucide-react';
import {
  getSeverityColor,
  getSeverityBg,
  getSeverityLabel,
  getVerificationColor,
  getConfidenceLabel,
  getSourceTypeLabel,
  getSourceReliability
} from '../../utils/scoring';

export default function EventDetail({ event, onClose }) {
  if (!event) return null;

  const reliability = getSourceReliability(event.source_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-primary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto glow-border animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-primary p-5 rounded-t-2xl flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded border ${getVerificationColor(event.verification_status)}`}>
              {event.verification_status}
            </span>
            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded border ${getSeverityBg(event.severity_score)}`}>
              {getSeverityLabel(event.severity_score)} ({event.severity_score}/10)
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
          {/* Claim */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Claim / Report
            </h3>
            <p className="text-sm text-text-primary leading-relaxed bg-bg-card rounded-lg p-4 border border-border-primary">
              {event.claim_text}
            </p>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={<Clock className="w-4 h-4 text-accent-blue" />}
              label="Date/Time (UTC)"
              value={format(new Date(event.event_datetime_utc), "dd MMM yyyy, HH:mm 'UTC'")}
            />
            <DetailItem
              icon={<MapPin className="w-4 h-4 text-accent-red" />}
              label="Location"
              value={event.location_text}
            />
            <DetailItem
              icon={<Globe className="w-4 h-4 text-accent-green" />}
              label="Country"
              value={event.country}
            />
            <DetailItem
              icon={<Crosshair className="w-4 h-4 text-accent-orange" />}
              label="Event Type"
              value={event.event_type.replace(/_/g, ' ')}
              capitalize
            />
            <DetailItem
              icon={<Users className="w-4 h-4 text-accent-blue" />}
              label="Actor 1"
              value={event.actor_1}
            />
            <DetailItem
              icon={<Users className="w-4 h-4 text-severity-high" />}
              label="Actor 2"
              value={event.actor_2}
            />
            <DetailItem
              icon={<BarChart3 className="w-4 h-4 text-accent-yellow" />}
              label="Confidence"
              value={`${getConfidenceLabel(event.confidence_score)} (${event.confidence_score}/10)`}
            />
            <DetailItem
              icon={<Shield className="w-4 h-4 text-accent-blue" />}
              label="Domain"
              value={event.domain}
              capitalize
            />
          </div>

          {/* Source info */}
          <div className="bg-bg-card rounded-lg p-4 border border-border-primary">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Source Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Source</span>
                <span className="text-sm text-text-primary font-medium">{event.source_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Type</span>
                <span className="text-sm text-text-secondary">{getSourceTypeLabel(event.source_type)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Reliability</span>
                <span className="text-sm text-text-secondary">{reliability.label} ({reliability.score}/10)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Link</span>
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-blue hover:underline flex items-center gap-1"
                >
                  View Source <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Last Updated</span>
                <span className="text-sm text-text-secondary">
                  {format(new Date(event.last_updated_at), "dd MMM yyyy, HH:mm 'UTC'")}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Intelligence Note */}
          <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-accent-orange" />
              <h3 className="text-xs font-semibold text-accent-orange uppercase tracking-wider">
                Analyst Note
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {event.verification_status === "verified"
                ? "This report has been corroborated by multiple credible sources. Treat as factual for operational purposes."
                : event.verification_status === "unverified"
                ? "This report has NOT been independently verified. Exercise caution. Cross-reference with additional sources before acting."
                : "This report is classified as RUMOR. Low confidence. Possible disinformation. Do NOT use for decision-making without further corroboration."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, capitalize }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-text-primary font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  );
}