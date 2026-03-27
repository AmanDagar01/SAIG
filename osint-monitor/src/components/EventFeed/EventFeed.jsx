import { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import EventCard from './EventCard';
import EventDetail from './EventDetail';
import EventFilters from './EventFilters';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EventFeed() {
  const {
    filteredEvents,
    filters,
    sortBy,
    total,
    loading,
    page,
    limit,
    updateFilter,
    resetFilters,
    setSortBy,
    setPage,
  } = useEvents();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary mb-1">
          Event Feed
        </h1>
        <p className="text-sm text-text-muted">
          {total} total events · Filtered from live OSINT sources
        </p>
      </div>

      <EventFilters
        filters={filters}
        sortBy={sortBy}
        updateFilter={updateFilter}
        setSortBy={setSortBy}
        resetFilters={resetFilters}
        resultCount={total}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
          <span className="text-sm text-text-muted ml-3">
            Loading events...
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvents.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={setSelectedEvent}
                index={idx}
              />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <p className="text-lg mb-2">No events match your filters</p>
              <button
                onClick={resetFilters}
                className="text-accent-blue hover:underline text-sm"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-secondary disabled:opacity-30 hover:bg-bg-card-hover transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage(p => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-secondary disabled:opacity-30 hover:bg-bg-card-hover transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}