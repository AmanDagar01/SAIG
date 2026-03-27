import { LOCATION_COORDS } from './constants.js';

/**
 * Extract location coordinates from text
 * Checks against known conflict location database
 */
export function geolocateFromText(text) {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Direct match against known locations
  for (const [locationKey, coords] of Object.entries(LOCATION_COORDS)) {
    if (lowerText.includes(locationKey)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        country: coords.country,
        matched_location: locationKey,
        method: 'keyword_match',
      };
    }
  }

  // Country-level fallback
  const countryCoords = {
    'iran': { lat: 32.4279, lng: 53.6880, country: 'Iran' },
    'israel': { lat: 31.0461, lng: 34.8516, country: 'Israel' },
    'lebanon': { lat: 33.8547, lng: 35.8623, country: 'Lebanon' },
    'syria': { lat: 34.8021, lng: 38.9968, country: 'Syria' },
    'iraq': { lat: 33.2232, lng: 43.6793, country: 'Iraq' },
    'yemen': { lat: 15.5527, lng: 48.5164, country: 'Yemen' },
    'saudi arabia': { lat: 23.8859, lng: 45.0792, country: 'Saudi Arabia' },
    'jordan': { lat: 30.5852, lng: 36.2384, country: 'Jordan' },
    'turkey': { lat: 38.9637, lng: 35.2433, country: 'Turkey' },
    'egypt': { lat: 26.8206, lng: 30.8025, country: 'Egypt' },
    'united states': { lat: 38.9072, lng: -77.0369, country: 'United States' },
    'united arab emirates': { lat: 23.4241, lng: 53.8478, country: 'UAE' },
    'uae': { lat: 23.4241, lng: 53.8478, country: 'UAE' },
    'qatar': { lat: 25.3548, lng: 51.1839, country: 'Qatar' },
    'russia': { lat: 55.7558, lng: 37.6173, country: 'Russia' },
    'palestine': { lat: 31.9522, lng: 35.2332, country: 'Palestine' },
  };

  for (const [country, coords] of Object.entries(countryCoords)) {
    if (lowerText.includes(country)) {
      return {
        ...coords,
        matched_location: country,
        method: 'country_fallback',
      };
    }
  }

  return null;
}