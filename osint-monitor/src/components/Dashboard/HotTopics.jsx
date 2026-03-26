import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { hotTopics } from '../../data/mockEvents';

const trendIcons = {
  rising: <TrendingUp className="w-3.5 h-3.5 text-accent-red" />,
  falling: <TrendingDown className="w-3.5 h-3.5 text-accent-green" />,
  stable: <Minus className="w-3.5 h-3.5 text-text-muted" />
};

const severityColors = {
  critical: "border-l-severity-critical",
  high: "border-l-severity-high",
  medium: "border-l-severity-medium",
  low: "border-l-severity-low"
};

export default function HotTopics() {
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-accent-orange" />
        <h2 className="text-base font-semibold text-text-primary">Hot Topics</h2>
      </div>

      <div className="space-y-3">
        {hotTopics.map((topic, idx) => (
          <div
            key={topic.id}
            className={`bg-bg-secondary border border-border-primary ${severityColors[topic.severity]} border-l-[3px] rounded-lg p-3 card-hover-effect cursor-pointer`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted">
                    #{idx + 1}
                  </span>
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {topic.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-text-muted">
                    {topic.count} reports
                  </span>
                  <div className="flex items-center gap-1">
                    {trendIcons[topic.trend]}
                    <span className="text-xs text-text-muted capitalize">
                      {topic.trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}