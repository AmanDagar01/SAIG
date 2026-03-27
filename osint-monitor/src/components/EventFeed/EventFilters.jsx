import { Search, SlidersHorizontal, RotateCcw, ArrowUpDown } from 'lucide-react';
import { getUniqueValues } from '../../utils/filters';
import { mockEvents } from '../../data/mockEvents';

export default function EventFilters({
  filters,
  sortBy,
  updateFilter,
  setSortBy,
  resetFilters,
  resultCount
}) {
  const countries = getUniqueValues(mockEvents, 'country');
  const domains = getUniqueValues(mockEvents, 'domain');
  const eventTypes = getUniqueValues(mockEvents, 'event_type');

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-5 glow-border space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search events, actors, locations..."
          value={filters.searchQuery}
          onChange={e => updateFilter('searchQuery', e.target.value)}
          className="w-full bg-bg-secondary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 transition-colors"
        />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-text-muted">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-xs font-medium">Filters:</span>
        </div>

        <FilterSelect
          value={filters.verification}
          onChange={v => updateFilter('verification', v)}
          options={[
            { value: "all", label: "All Status" },
            { value: "verified", label: "Verified" },
            { value: "unverified", label: "Unverified" },
            { value: "rumor", label: "Rumor" },
          ]}
        />

        <FilterSelect
          value={filters.domain}
          onChange={v => updateFilter('domain', v)}
          options={[
            { value: "all", label: "All Domains" },
            ...domains.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))
          ]}
        />

        <FilterSelect
          value={filters.country}
          onChange={v => updateFilter('country', v)}
          options={[
            { value: "all", label: "All Countries" },
            ...countries.map(c => ({ value: c, label: c }))
          ]}
        />

        <FilterSelect
          value={filters.minSeverity.toString()}
          onChange={v => updateFilter('minSeverity', parseInt(v))}
          options={[
            { value: "0", label: "Any Severity" },
            { value: "3", label: "Sev 3+" },
            { value: "5", label: "Sev 5+" },
            { value: "7", label: "Sev 7+" },
            { value: "9", label: "Sev 9+" },
          ]}
        />

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
          <FilterSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "datetime_desc", label: "Newest" },
              { value: "datetime_asc", label: "Oldest" },
              { value: "severity_desc", label: "Severity ↓" },
              { value: "severity_asc", label: "Severity ↑" },
              { value: "confidence_desc", label: "Confidence ↓" },
            ]}
          />
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-blue transition-colors px-2 py-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Results count */}
      <div className="text-xs text-text-muted">
        Showing <span className="text-text-primary font-semibold">{resultCount}</span> events
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-bg-secondary border border-border-primary rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-blue/50 cursor-pointer appearance-none"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}