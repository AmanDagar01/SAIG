import {
  Activity,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Globe,
  Crosshair,
  Thermometer,
} from 'lucide-react';

export default function StatsPanel({ stats, escalation }) {
  const escalationIndex = escalation?.index || 0;
  const escalationLevel = escalation?.level || 'LOW';

  const getEscalationColor = (index) => {
    if (index >= 8) return 'text-severity-critical';
    if (index >= 6) return 'text-severity-high';
    if (index >= 4) return 'text-severity-medium';
    return 'text-severity-low';
  };

  const getEscalationBg = (index) => {
    if (index >= 8) return 'bg-severity-critical/10 border-severity-critical/30';
    if (index >= 6) return 'bg-severity-high/10 border-severity-high/30';
    if (index >= 4) return 'bg-severity-medium/10 border-severity-medium/30';
    return 'bg-severity-low/10 border-severity-low/30';
  };

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-accent-blue" />
        <h2 className="text-base font-semibold text-text-primary">
          Intel Summary
        </h2>
      </div>

      {/* Escalation Index */}
      <div
        className={`rounded-lg border p-4 mb-4 ${getEscalationBg(escalationIndex)}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Escalation Index
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getEscalationColor(escalationIndex)}`}
          >
            {escalationLevel}
          </span>
        </div>
        <div
          className={`text-3xl font-bold ${getEscalationColor(escalationIndex)}`}
        >
          {escalationIndex}
          <span className="text-sm font-normal text-text-muted">/10</span>
        </div>
        <div className="w-full bg-bg-primary rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              escalationIndex >= 8
                ? 'bg-severity-critical'
                : escalationIndex >= 6
                  ? 'bg-severity-high'
                  : escalationIndex >= 4
                    ? 'bg-severity-medium'
                    : 'bg-severity-low'
            }`}
            style={{ width: `${escalationIndex * 10}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <StatRow
          icon={<AlertTriangle className="w-4 h-4 text-accent-orange" />}
          label="Events in 24hr"
          value={stats.last24h}
          highlight
        />
        <StatRow
          icon={<Crosshair className="w-4 h-4 text-accent-red" />}
          label="Top Category"
          value={stats.topDomain}
          capitalize
        />
        <StatRow
          icon={<Globe className="w-4 h-4 text-accent-blue" />}
          label="Highest Activity"
          value={stats.highestSeverityRegion}
        />
        <StatRow
          icon={<Activity className="w-4 h-4 text-accent-yellow" />}
          label="Total Events"
          value={stats.total}
        />

        <div className="border-t border-border-primary pt-3 mt-3">
          <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
            Verification
          </div>
          <div className="space-y-2">
            <VerificationBar
              icon={<CheckCircle className="w-3.5 h-3.5 text-verified" />}
              label="Verified"
              count={stats.verified}
              total={stats.total}
              color="bg-verified"
            />
            <VerificationBar
              icon={<HelpCircle className="w-3.5 h-3.5 text-unverified" />}
              label="Unverified"
              count={stats.unverified}
              total={stats.total}
              color="bg-unverified"
            />
            <VerificationBar
              icon={<AlertTriangle className="w-3.5 h-3.5 text-rumor" />}
              label="Rumor"
              count={stats.rumors}
              total={stats.total}
              color="bg-rumor"
            />
          </div>
        </div>

        <div className="border-t border-border-primary pt-3 mt-3">
          <div className="text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">
            Avg. Severity
          </div>
          <div className="text-2xl font-bold text-severity-high">
            {stats.avgSeverity}
            <span className="text-sm font-normal text-text-muted">/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, highlight, capitalize }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span
        className={`text-sm font-semibold ${highlight ? 'text-accent-orange' : 'text-text-primary'} ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function VerificationBar({ icon, label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-text-muted w-16">{label}</span>
      <div className="flex-1 bg-bg-primary rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-text-secondary w-8 text-right">
        {count}
      </span>
    </div>
  );
}