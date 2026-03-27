import { useState, useEffect } from 'react';
import HotTopics from './HotTopics';
import HeadlinesFeed from './HeadlinesFeed';
import StatsPanel from './StatsPanel';
import HeatMapButton from './HeatMapButton';
import TrendChart from './TrendChart';
import EventDetail from '../EventFeed/EventDetail';
import { useEvents } from '../../hooks/useEvents';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { stats, dashboardData, loading, error, refresh } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <AlertCircle className="w-12 h-12 text-accent-red mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Connection Error
        </h2>
        <p className="text-sm text-text-muted mb-4 text-center max-w-md">
          {error}
        </p>
        <p className="text-xs text-text-muted mb-4">
          Make sure backend is running on{' '}
          <code className="bg-bg-card px-2 py-1 rounded">
            http://localhost:3001
          </code>
        </p>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue rounded-lg text-white text-sm hover:bg-accent-blue/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin mb-4" />
        <p className="text-sm text-text-muted">Loading intelligence data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">
            Intelligence Dashboard
          </h1>
          <p className="text-xs text-text-muted">
            {stats.total} events tracked ·{' '}
            {dashboardData?.generated_at
              ? `Updated ${new Date(dashboardData.generated_at).toLocaleTimeString()}`
              : ''}
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-bg-card border border-border-primary text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <HeatMapButton />
        </div> */}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-3">
          <HotTopics data={dashboardData?.hotTopics} />
        </div>
        <div className="lg:col-span-6">
          <HeadlinesFeed
            events={dashboardData?.recentEvents}
            onSelectEvent={setSelectedEvent}
          />
        </div>
        <div className="lg:col-span-3">
          <StatsPanel
            stats={stats}
            escalation={dashboardData?.escalation}
          />
        </div>
      </div>

      {/* Trend chart
      <div className="mt-5">
        <TrendChart data={dashboardData?.timeline} />
      </div> */}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetail
          event={{
            ...selectedEvent,
            tags:
              typeof selectedEvent.tags === 'string'
                ? JSON.parse(selectedEvent.tags)
                : selectedEvent.tags || [],
          }}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}