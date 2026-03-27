import { mockEvents } from '../../data/mockEvents';
import { getSourceTypeLabel, getSourceReliability } from '../../utils/scoring';
import { Database, ExternalLink, Shield, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

export default function SourceTracker() {
  const sourceAnalysis = useMemo(() => {
    const sources = {};
    mockEvents.forEach(event => {
      const key = event.source_name;
      if (!sources[key]) {
        sources[key] = {
          name: event.source_name,
          type: event.source_type,
          url: event.source_url,
          events: [],
          reliability: getSourceReliability(event.source_type)
        };
      }
      sources[key].events.push(event);
    });

    return Object.values(sources).sort((a, b) => b.events.length - a.events.length);
  }, []);

  const typeBreakdown = useMemo(() => {
    const types = {};
    mockEvents.forEach(event => {
      types[event.source_type] = (types[event.source_type] || 0) + 1;
    });
    return Object.entries(types)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        label: getSourceTypeLabel(type),
        count,
        reliability: getSourceReliability(type)
      }));
  }, []);

  const getReliabilityColor = (score) => {
    if (score >= 8) return "text-verified";
    if (score >= 6) return "text-accent-blue";
    if (score >= 4) return "text-unverified";
    return "text-rumor";
  };

  const getReliabilityBg = (score) => {
    if (score >= 8) return "bg-verified/10 border-verified/30";
    if (score >= 6) return "bg-accent-blue/10 border-accent-blue/30";
    if (score >= 4) return "bg-unverified/10 border-unverified/30";
    return "bg-rumor/10 border-rumor/30";
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary mb-1">Source Provenance</h1>
        <p className="text-sm text-text-muted">Source tracking, reliability assessment, and provenance chain</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Sources"
          value={sourceAnalysis.length}
          icon={<Database className="w-5 h-5 text-accent-blue" />}
        />
        <SummaryCard
          label="Source Types"
          value={typeBreakdown.length}
          icon={<BarChart3 className="w-5 h-5 text-accent-orange" />}
        />
        <SummaryCard
          label="High Reliability"
          value={sourceAnalysis.filter(s => s.reliability.score >= 7).length}
          icon={<Shield className="w-5 h-5 text-verified" />}
        />
        <SummaryCard
          label="Low Reliability"
          value={sourceAnalysis.filter(s => s.reliability.score < 5).length}
          icon={<Shield className="w-5 h-5 text-rumor" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Source type breakdown */}
        <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Source Type Breakdown</h3>
          <div className="space-y-3">
            {typeBreakdown.map(item => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.reliability.score >= 8 ? 'bg-verified' :
                    item.reliability.score >= 6 ? 'bg-accent-blue' :
                    item.reliability.score >= 4 ? 'bg-unverified' :
                    'bg-rumor'
                  }`} />
                  <span className="text-xs text-text-secondary">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">
                    Rel: <span className={`font-semibold ${getReliabilityColor(item.reliability.score)}`}>{item.reliability.score}/10</span>
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual sources */}
        <div className="lg:col-span-2 bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4">All Sources</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {sourceAnalysis.map(source => (
              <div
                key={source.name}
                className={`bg-bg-secondary border rounded-lg p-4 ${getReliabilityBg(source.reliability.score)}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{source.name}</h4>
                    <p className="text-xs text-text-muted">{getSourceTypeLabel(source.type)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getReliabilityBg(source.reliability.score)} ${getReliabilityColor(source.reliability.score)}`}>
                      {source.reliability.label}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-accent-blue transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>{source.events.length} events contributed</span>
                  <span>
                    Reliability: <span className={`font-semibold ${getReliabilityColor(source.reliability.score)}`}>
                      {source.reliability.score}/10
                    </span>
                  </span>
                </div>

                {/* Recent event from this source */}
                <div className="mt-2 pt-2 border-t border-border-primary">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Latest report:</p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {source.events
                      .sort((a, b) => new Date(b.event_datetime_utc) - new Date(a.event_datetime_utc))[0]
                      .claim_text.substring(0, 120)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-accent-blue mb-2">Source Reliability Methodology</h3>
        <div className="text-xs text-text-secondary leading-relaxed space-y-1">
          <p><strong>Score 8-10 (High):</strong> Established news agencies, government releases, international organizations. Multiple editorial layers, strong track record.</p>
          <p><strong>Score 5-7 (Medium):</strong> Regional news outlets, cyber intelligence firms, state media (with bias consideration). Generally reliable but may have perspective limitations.</p>
          <p><strong>Score 1-4 (Low):</strong> Social media, unverified Telegram channels, anonymous sources. Useful for early signals but require corroboration before operational use.</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-4 glow-border">
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}