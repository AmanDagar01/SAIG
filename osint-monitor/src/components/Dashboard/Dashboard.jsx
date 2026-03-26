import { useState } from 'react';
import HotTopics from './HotTopics';
import HeadlinesFeed from './HeadlinesFeed';
import StatsPanel from './StatsPanel';
import HeatMapButton from './HeatMapButton';
import TrendChart from './TrendChart';
import EventDetail from '../EventFeed/EventDetail';
import { useEvents } from '../../hooks/useEvents';

export default function Dashboard() {
  const { stats } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="animate-fade-in">
      

      {/* Main grid layout matching wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column - Hot Topics */}
        <div className="lg:col-span-3">
          <HotTopics />
        </div>

        {/* Center column - Headlines Feed */}
        <div className="lg:col-span-6">
          <HeadlinesFeed onSelectEvent={setSelectedEvent} />
        </div>

        {/* Right column - Stats */}
        <div className="lg:col-span-3">
          <StatsPanel stats={stats} />
        </div>
      </div>

      {/* Trend chart below */}
      <div className="mt-5">
        <TrendChart />
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}