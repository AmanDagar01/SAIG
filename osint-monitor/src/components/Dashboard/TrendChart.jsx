import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs text-text-secondary">
            {entry.name}:{' '}
            <span className="font-semibold text-text-primary">
              {entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function TrendChart({ data }) {
  // Format the data from API
  const chartData = (data || []).map(d => ({
    date: d.date
      ? new Date(d.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '',
    events: d.event_count || d.events || 0,
    severity_avg: d.severity_avg || d.avg_severity || 0,
  }));

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-accent-blue" />
        <h2 className="text-base font-semibold text-text-primary">
          7-Day Trend
        </h2>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-text-muted">
          Collecting trend data...
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4a00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff4a00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#8888aa', fontSize: 11 }}
                axisLine={{ stroke: '#2a2a4a' }}
              />
              <YAxis
                tick={{ fill: '#8888aa', fontSize: 11 }}
                axisLine={{ stroke: '#2a2a4a' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="events"
                name="Events"
                stroke="#4a9eff"
                fill="url(#eventGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="severity_avg"
                name="Avg Severity"
                stroke="#ff4a00"
                fill="url(#severityGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}