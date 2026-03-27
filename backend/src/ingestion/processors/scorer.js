/**
 * Calculate severity and confidence scores for an event
 */
export function calculateScores({ text, source_reliability, has_geo, entities, fatalities = 0 }) {
    const lowerText = (text || '').toLowerCase();
  
    // ---- SEVERITY SCORE (1-10) ----
    let severity = 3; // base
    const severityTags = [];
  
    // High severity keywords
    const criticalKeywords = ['killed', 'dead', 'casualties', 'strike', 'attack', 'invasion', 'nuclear'];
    const highKeywords = ['missile', 'airstrike', 'bombing', 'deployment', 'intercept', 'explosion'];
    const mediumKeywords = ['warning', 'threat', 'sanction', 'military', 'tensions', 'escalat'];
    const lowKeywords = ['statement', 'called for', 'urged', 'protest', 'meeting', 'discuss'];
  
    if (criticalKeywords.some(kw => lowerText.includes(kw))) {
      severity += 3;
      severityTags.push('critical-event');
    }
    if (highKeywords.some(kw => lowerText.includes(kw))) {
      severity += 2;
      severityTags.push('high-severity');
    }
    if (mediumKeywords.some(kw => lowerText.includes(kw))) {
      severity += 1;
    }
    if (lowKeywords.some(kw => lowerText.includes(kw)) && severity <= 4) {
      severity = Math.max(severity, 3);
    }
  
    // Fatalities boost
    if (fatalities > 0) {
      if (fatalities >= 50) severity += 3;
      else if (fatalities >= 10) severity += 2;
      else severity += 1;
      severityTags.push('casualty');
    }
  
    // Multiple actors = higher severity
    if (entities.actor_1 && entities.actor_2) {
      severity += 1;
    }
  
    // Nuclear domain = higher severity
    if (entities.domain === 'nuclear') {
      severity += 1;
      severityTags.push('nuclear-related');
    }
  
    severity = Math.min(Math.max(severity, 1), 10);
  
    // ---- CONFIDENCE SCORE (1-10) ----
    let confidence = source_reliability || 5;
  
    // Multiple specific details increase confidence
    if (has_geo) confidence += 1;
    if (entities.actor_1) confidence += 0.5;
    if (entities.event_type) confidence += 0.5;
    if (entities.location) confidence += 0.5;
  
    // Hedging language decreases confidence
    const hedgingWords = ['alleged', 'reportedly', 'unconfirmed', 'rumor', 'claimed', 'purported', 'sources say', 'unverified'];
    if (hedgingWords.some(hw => lowerText.includes(hw))) {
      confidence -= 2;
      severityTags.push('unconfirmed-report');
    }
  
    // Strong attribution increases confidence
    const attributionWords = ['confirmed', 'officially', 'announced', 'pentagon stated', 'according to official'];
    if (attributionWords.some(aw => lowerText.includes(aw))) {
      confidence += 1;
    }
  
    confidence = Math.min(Math.max(Math.round(confidence), 1), 10);
  
    return {
      severity,
      confidence,
      tags: severityTags,
    };
  }