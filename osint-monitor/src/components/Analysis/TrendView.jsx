import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
  } from 'recharts';
  import { timelineData, domainDistribution, mockEvents } from '../../data/mockEvents';
  import { calculateEscalationIndex } from '../../utils/scoring';
  import { TrendingUp, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
  
  function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs text-text-secondary">
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  }
  
  export default function TrendView() {
    const escalationIndex = calculateEscalationIndex(mockEvents);
  
    // Actor frequency data
    const actorCounts = {};
    mockEvents.forEach(e => {
      actorCounts[e.actor_1] = (actorCounts[e.actor_1] || 0) + 1;
    });
    const actorData = Object.entries(actorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "..." : name,
        count
      }));
  
    // Event type data
    const typeCounts = {};
    mockEvents.forEach(e => {
      const type = e.event_type.replace(/_/g, ' ');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));
  
    return (
      <div className="animate-fade-in space-y-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1">Trend Analysis</h1>
          <p className="text-sm text-text-muted">Patterns, escalation signals, and distribution analysis</p>
        </div>
  
        {/* Escalation banner */}
        <div className={`rounded-xl border p-5 ${
          escalationIndex >= 7
            ? 'bg-severity-critical/5 border-severity-critical/30'
            : escalationIndex >= 5
            ? 'bg-severity-high/5 border-severity-high/30'
            : 'bg-severity-medium/5 border-severity-medium/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-severity-high" />
                <h2 className="text-sm font-semibold text-text-primary">Current Escalation Index</h2>
              </div>
              <p className="text-xs text-text-muted">
                Composite score based on event frequency, severity, and high-severity ratio in last 24 hours
              </p>
            </div>
            <div className={`text-4xl font-bold ${
              escalationIndex >= 7 ? 'text-severity-critical' :
              escalationIndex >= 5 ? 'text-severity-high' :
              'text-severity-medium'
            }`}>
              {escalationIndex}
              <span className="text-lg text-text-muted">/10</span>
            </div>
          </div>
        </div>
  
        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Timeline chart */}
          <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">Event Timeline (7 days)</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                  <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={{ stroke: '#2a2a4a' }} />
                  <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={{ stroke: '#2a2a4a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="events" name="Events" stroke="#4a9eff" fill="url(#areaGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="severity_avg" name="Avg Severity" stroke="#ff4a00" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          {/* Domain distribution */}
          <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">Domain Distribution</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={domainDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {domainDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12121a',
                      border: '1px solid #2a2a4a',
                      borderRadius: '8px',
                      color: '#e0e0ff'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#8888aa' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          {/* Actor frequency */}
          <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">Top Actors</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                  <XAxis type="number" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={{ stroke: '#2a2a4a' }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} width={150} axisLine={{ stroke: '#2a2a4a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Events" fill="#4a9eff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          {/* Event types */}
          <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent-orange" />
              <h3 className="text-sm font-semibold text-text-primary">Event Type Breakdown</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                  <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 9 }} axisLine={{ stroke: '#2a2a4a' }} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={{ stroke: '#2a2a4a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" fill="#ff8c00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
  
        {/* Anomaly signals */}
        <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Escalation Signals Detected</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SignalCard
              level="high"
              title="Event Frequency Spike"
              description="Event count increased 200% over 48-hour baseline. Unusual clustering of military events."
            />
            <SignalCard
              level="medium"
              title="New Domain Activity"
              description="Cyber domain events appearing for first time this cycle. Potential pre-kinetic indicator."
            />
            <SignalCard
              level="high"
              title="Multi-Actor Convergence"
              description="Simultaneous activity from 5+ state actors in overlapping geographic zones."
            />
          </div>
        </div>
      </div>
    );
  }
  
  function SignalCard({ level, title, description }) {
    const colors = {
      high: "border-l-severity-high bg-severity-high/5",
      medium: "border-l-severity-medium bg-severity-medium/5",
      low: "border-l-severity-low bg-severity-low/5"
    };
  
    return (
      <div className={`rounded-lg border border-border-primary border-l-[3px] ${colors[level]} p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold uppercase ${
            level === 'high' ? 'text-severity-high' : level === 'medium' ? 'text-severity-medium' : 'text-severity-low'
          }`}>
            {level} signal
          </span>
        </div>
        <h4 className="text-sm font-medium text-text-primary mb-1">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      </div>
    );
  }