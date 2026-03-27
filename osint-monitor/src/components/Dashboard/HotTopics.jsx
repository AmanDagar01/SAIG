import { TrendingUp, Flame, Hash } from 'lucide-react';

export default function HotTopics({ data }) {
  const topics = data || [];

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-accent-orange" />
        <h2 className="text-base font-semibold text-text-primary">
          Hot Topics
        </h2>
      </div>

      {topics.length === 0 ? (
        <div className="text-sm text-text-muted text-center py-8">
          Collecting topic data...
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, idx) => (
            <div
              key={topic.tag || idx}
              className="bg-bg-secondary border border-border-primary border-l-[3px] border-l-accent-orange rounded-lg p-3 card-hover-effect cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted">
                      #{idx + 1}
                    </span>
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {topic.tag}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-text-muted">
                      {topic.count} mentions
                    </span>
                    <TrendingUp className="w-3 h-3 text-accent-red" />
                  </div>
                </div>
                <Hash className="w-4 h-4 text-text-muted shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}