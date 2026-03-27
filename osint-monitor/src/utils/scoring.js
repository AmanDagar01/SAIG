export function getSeverityLabel(score) {
    if (score >= 9) return "Critical";
    if (score >= 7) return "High";
    if (score >= 5) return "Medium";
    if (score >= 3) return "Low";
    return "Minimal";
  }
  
  export function getSeverityColor(score) {
    if (score >= 9) return "text-severity-critical";
    if (score >= 7) return "text-severity-high";
    if (score >= 5) return "text-severity-medium";
    if (score >= 3) return "text-severity-low";
    return "text-severity-minimal";
  }
  
  export function getSeverityBg(score) {
    if (score >= 9) return "bg-severity-critical/20 border-severity-critical/50";
    if (score >= 7) return "bg-severity-high/20 border-severity-high/50";
    if (score >= 5) return "bg-severity-medium/20 border-severity-medium/50";
    if (score >= 3) return "bg-severity-low/20 border-severity-low/50";
    return "bg-severity-minimal/20 border-severity-minimal/50";
  }
  
  export function getVerificationColor(status) {
    switch (status) {
      case "verified": return "bg-verified/20 text-verified border-verified/50";
      case "unverified": return "bg-unverified/20 text-unverified border-unverified/50";
      case "rumor": return "bg-rumor/20 text-rumor border-rumor/50";
      default: return "bg-text-muted/20 text-text-muted border-text-muted/50";
    }
  }
  
  export function getConfidenceLabel(score) {
    if (score >= 9) return "Very High";
    if (score >= 7) return "High";
    if (score >= 5) return "Medium";
    if (score >= 3) return "Low";
    return "Very Low";
  }
  
  export function calculateEscalationIndex(events) {
    if (!events || events.length === 0) return 0;
  
    const now = new Date();
    const last24h = events.filter(e => {
      const eventDate = new Date(e.event_datetime_utc);
      return (now - eventDate) < 24 * 60 * 60 * 1000;
    });
  
    const avgSeverity = last24h.reduce((sum, e) => sum + e.severity_score, 0) / (last24h.length || 1);
    const eventDensity = Math.min(last24h.length / 10, 1);
    const highSevRatio = last24h.filter(e => e.severity_score >= 7).length / (last24h.length || 1);
  
    const index = ((avgSeverity / 10) * 0.4 + eventDensity * 0.3 + highSevRatio * 0.3) * 10;
    return Math.round(index * 10) / 10;
  }
  
  export function getSourceTypeLabel(type) {
    const labels = {
      news_agency: "News Agency",
      news_outlet: "News Outlet",
      social_media: "Social Media",
      telegram: "Telegram",
      government: "Government",
      state_media: "State Media",
      cyber_intelligence: "Cyber Intel",
      international_org: "Intl. Org",
      monitoring_org: "Monitoring Org",
      open_data: "Open Data"
    };
    return labels[type] || type;
  }
  
  export function getSourceReliability(type) {
    const reliability = {
      news_agency: { score: 9, label: "High" },
      government: { score: 8, label: "High" },
      international_org: { score: 9, label: "High" },
      news_outlet: { score: 7, label: "Medium-High" },
      monitoring_org: { score: 7, label: "Medium-High" },
      cyber_intelligence: { score: 7, label: "Medium-High" },
      open_data: { score: 8, label: "High" },
      state_media: { score: 5, label: "Medium" },
      social_media: { score: 4, label: "Low-Medium" },
      telegram: { score: 3, label: "Low" }
    };
    return reliability[type] || { score: 5, label: "Unknown" };
  }