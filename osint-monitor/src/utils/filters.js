export function filterEvents(events, filters) {
    return events.filter(event => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          event.claim_text.toLowerCase().includes(query) ||
          event.actor_1.toLowerCase().includes(query) ||
          event.actor_2.toLowerCase().includes(query) ||
          event.location_text.toLowerCase().includes(query) ||
          event.country.toLowerCase().includes(query) ||
          event.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
  
      if (filters.verification && filters.verification !== "all") {
        if (event.verification_status !== filters.verification) return false;
      }
  
      if (filters.domain && filters.domain !== "all") {
        if (event.domain !== filters.domain) return false;
      }
  
      if (filters.minSeverity) {
        if (event.severity_score < filters.minSeverity) return false;
      }
  
      if (filters.country && filters.country !== "all") {
        if (event.country !== filters.country) return false;
      }
  
      if (filters.sourceType && filters.sourceType !== "all") {
        if (event.source_type !== filters.sourceType) return false;
      }
  
      if (filters.eventType && filters.eventType !== "all") {
        if (event.event_type !== filters.eventType) return false;
      }
  
      return true;
    });
  }
  
  export function sortEvents(events, sortBy = "datetime_desc") {
    const sorted = [...events];
    switch (sortBy) {
      case "datetime_desc":
        return sorted.sort((a, b) => new Date(b.event_datetime_utc) - new Date(a.event_datetime_utc));
      case "datetime_asc":
        return sorted.sort((a, b) => new Date(a.event_datetime_utc) - new Date(b.event_datetime_utc));
      case "severity_desc":
        return sorted.sort((a, b) => b.severity_score - a.severity_score);
      case "severity_asc":
        return sorted.sort((a, b) => a.severity_score - b.severity_score);
      case "confidence_desc":
        return sorted.sort((a, b) => b.confidence_score - a.confidence_score);
      default:
        return sorted;
    }
  }
  
  export function getUniqueValues(events, field) {
    const values = events.map(e => e[field]).filter(Boolean);
    return [...new Set(values)].sort();
  }