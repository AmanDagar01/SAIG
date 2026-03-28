import {
  TrendingUp,
  Flame,
  Globe,
  Users,
  Layers,
  Hash,
  AlertTriangle,
  Shield,
  Zap,
} from 'lucide-react';

// Icon based on topic type
function getTopicIcon(type) {
  switch (type) {
    case 'country': return <Globe className="w-3.5 h-3.5 text-accent-blue" />;
    case 'actor': return <Users className="w-3.5 h-3.5 text-accent-orange" />;
    case 'domain': return <Layers className="w-3.5 h-3.5 text-accent-green" />;
    default: return <Hash className="w-3.5 h-3.5 text-text-muted" />;
  }
}

// Severity-based border color
function getSeverityBorder(avgSeverity) {
  if (avgSeverity >= 8) return 'border-l-severity-critical';
  if (avgSeverity >= 6) return 'border-l-severity-high';
  if (avgSeverity >= 4) return 'border-l-severity-medium';
  return 'border-l-severity-low';
}

// Severity badge
function SeverityBadge({ severity }) {
  let color = 'text-severity-low bg-severity-low/10';
  if (severity >= 8) color = 'text-severity-critical bg-severity-critical/10';
  else if (severity >= 6) color = 'text-severity-high bg-severity-high/10';
  else if (severity >= 4) color = 'text-severity-medium bg-severity-medium/10';

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {severity}
    </span>
  );
}

export default function HotTopics({ data }) {
  const topics = data || [];

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent-orange" />
          <h2 className="text-base font-semibold text-text-primary">
            Hot Topics
          </h2>
        </div>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">
          72h window
        </span>
      </div>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Zap className="w-6 h-6 text-text-muted mb-3 opacity-30" />
          <p className="text-sm text-text-muted mb-1">
            Analyzing topics...
          </p>
          <p className="text-xs text-text-muted">
            Topics appear after ingestion
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {topics.map((topic, idx) => (
            <div
              key={topic.raw_tag || topic.tag || idx}
              className={`bg-bg-secondary border border-border-primary ${getSeverityBorder(topic.avg_severity || 5)} border-l-[3px] rounded-lg p-3 card-hover-effect cursor-pointer`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Topic name */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-text-muted w-5">
                      #{idx + 1}
                    </span>
                    {getTopicIcon(topic.type)}
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {topic.tag}
                    </h3>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 ml-7">
                    <span className="text-[10px] text-text-muted">
                      {topic.count} report{topic.count !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-accent-red" />
                      <span className="text-[10px] text-text-muted">
                        active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Severity badge */}
                <SeverityBadge severity={topic.avg_severity || 5} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {topics.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-primary">
          <div className="flex items-center justify-between text-[9px] text-text-muted">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Region</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Actor</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>Topic</span>
              </div>
            </div>
            <span>Avg. Severity →</span>
          </div>
        </div>
      )}
    </div>
  );
}