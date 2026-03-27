// Actors relevant to Iran-Israel-US conflict
export const CONFLICT_ACTORS = {
    state: [
      'Iran', 'Israel', 'United States', 'Syria', 'Lebanon',
      'Iraq', 'Yemen', 'Saudi Arabia', 'UAE', 'Jordan',
      'Turkey', 'Russia', 'China', 'Qatar', 'Egypt'
    ],
    military: [
      'IDF', 'Israel Defense Forces', 'IRGC', 'Islamic Revolutionary Guard Corps',
      'Quds Force', 'US CENTCOM', 'Pentagon', 'US Navy', 'US Air Force',
      'Iranian Navy', 'IRIN', 'Iranian Air Force', 'IRIAF',
      'SAA', 'Syrian Arab Army', 'LAF', 'Lebanese Armed Forces'
    ],
    nonState: [
      'Hezbollah', 'Hamas', 'Palestinian Islamic Jihad', 'PIJ',
      'Houthis', 'Ansar Allah', 'PMF', 'Popular Mobilization Forces',
      'Kata\'ib Hezbollah', 'Kata\'ib Sayyid al-Shuhada',
      'ISIS', 'ISIL', 'Islamic State', 'Al-Qaeda'
    ],
    organizations: [
      'United Nations', 'IAEA', 'NATO', 'OPCW', 'ICJ',
      'Red Cross', 'ICRC', 'WHO', 'UNRWA', 'EU'
    ],
  };
  
  export const EVENT_TYPES = {
    military: [
      'airstrike', 'missile_attack', 'rocket_attack', 'drone_strike',
      'ground_operation', 'naval_operation', 'military_deployment',
      'military_movement', 'weapons_test', 'interception', 'shelling'
    ],
    diplomatic: [
      'diplomatic_statement', 'diplomatic_action', 'sanctions',
      'treaty', 'negotiation', 'summit', 'recall_ambassador'
    ],
    cyber: [
      'cyber_attack', 'cyber_reconnaissance', 'data_breach',
      'infrastructure_attack', 'disinformation_campaign'
    ],
    economic: [
      'economic_impact', 'oil_price_change', 'trade_restriction',
      'airspace_closure', 'shipping_disruption', 'sanctions_impact'
    ],
    political: [
      'civil_unrest', 'protest', 'election', 'policy_change',
      'assassination', 'arrest', 'political_statement'
    ],
    nuclear: [
      'nuclear_issue', 'enrichment', 'inspection', 'nuclear_test',
      'proliferation'
    ],
    humanitarian: [
      'casualty_report', 'displacement', 'humanitarian_crisis',
      'aid_delivery', 'refugee_movement'
    ],
  };
  
  export const DOMAINS = [
    'military', 'diplomatic', 'cyber', 'economic',
    'political', 'nuclear', 'humanitarian', 'information_warfare'
  ];
  
  // Keywords for filtering relevant content
  export const CONFLICT_KEYWORDS = [
    'iran', 'israel', 'idf', 'irgc', 'hezbollah', 'hamas',
    'tehran', 'tel aviv', 'jerusalem', 'beirut', 'damascus',
    'gaza', 'west bank', 'golan', 'strait of hormuz', 'persian gulf',
    'centcom', 'iron dome', 'nuclear', 'enrichment', 'iaea',
    'houthi', 'red sea', 'proxy', 'missile', 'drone',
    'airstrike', 'strike', 'attack', 'military', 'defense',
    'sanctions', 'pentagon', 'netanyahu', 'khamenei', 'raisi',
    'quds force', 'revolutionary guard', 'mossad', 'shin bet',
    'ballistic', 'cruise missile', 'uranium', 'fordow', 'natanz',
    'dimona', 'negev', 'isfahan', 'parchin',
    'escalation', 'retaliation', 'deterrence', 'ceasefire',
  ];
  
  // Source reliability ratings
  export const SOURCE_RELIABILITY = {
    // Tier 1: Major wire services & verified government
    'Reuters': { score: 9, tier: 1 },
    'Associated Press': { score: 9, tier: 1 },
    'AFP': { score: 9, tier: 1 },
    'CENTCOM': { score: 9, tier: 1 },
    'Pentagon': { score: 8, tier: 1 },
    'White House': { score: 8, tier: 1 },
    'IAEA': { score: 9, tier: 1 },
    'United Nations': { score: 8, tier: 1 },
  
    // Tier 2: Major international outlets
    'BBC': { score: 8, tier: 2 },
    'Al Jazeera': { score: 7, tier: 2 },
    'The Guardian': { score: 7, tier: 2 },
    'CNN': { score: 7, tier: 2 },
    'New York Times': { score: 8, tier: 2 },
  
    // Tier 3: Regional / specialist
    'Haaretz': { score: 7, tier: 3 },
    'Times of Israel': { score: 7, tier: 3 },
    'Al Arabiya': { score: 6, tier: 3 },
    'Al Monitor': { score: 7, tier: 3 },
  
    // Tier 4: State media (bias-adjusted)
    'FARS News': { score: 4, tier: 4 },
    'IRNA': { score: 4, tier: 4 },
    'Press TV': { score: 3, tier: 4 },
    'TASS': { score: 4, tier: 4 },
  
    // Tier 5: OSINT / social media
    'OSINT': { score: 5, tier: 5 },
    'Twitter': { score: 3, tier: 5 },
    'Telegram': { score: 3, tier: 5 },
  
    // Default
    'unknown': { score: 4, tier: 5 },
  };
  
  // Geographic coordinates for known conflict locations
  export const LOCATION_COORDS = {
    'tehran': { lat: 35.6892, lng: 51.3890, country: 'Iran' },
    'isfahan': { lat: 32.6546, lng: 51.6680, country: 'Iran' },
    'shiraz': { lat: 29.5918, lng: 52.5837, country: 'Iran' },
    'tabriz': { lat: 38.0962, lng: 46.2738, country: 'Iran' },
    'fordow': { lat: 34.8800, lng: 51.5900, country: 'Iran' },
    'natanz': { lat: 33.7211, lng: 51.7267, country: 'Iran' },
    'parchin': { lat: 35.5200, lng: 51.7700, country: 'Iran' },
    'bandar abbas': { lat: 27.1865, lng: 56.2808, country: 'Iran' },
    'bushehr': { lat: 28.9234, lng: 50.8203, country: 'Iran' },
    'strait of hormuz': { lat: 26.5900, lng: 56.2500, country: 'Iran' },
    'tel aviv': { lat: 32.0853, lng: 34.7818, country: 'Israel' },
    'jerusalem': { lat: 31.7683, lng: 35.2137, country: 'Israel' },
    'haifa': { lat: 32.7940, lng: 34.9896, country: 'Israel' },
    'dimona': { lat: 31.0700, lng: 35.2100, country: 'Israel' },
    'negev': { lat: 30.8500, lng: 34.7500, country: 'Israel' },
    'golan heights': { lat: 33.0000, lng: 35.7500, country: 'Israel' },
    'gaza': { lat: 31.3547, lng: 34.3088, country: 'Palestine' },
    'west bank': { lat: 31.9500, lng: 35.3000, country: 'Palestine' },
    'beirut': { lat: 33.8938, lng: 35.5018, country: 'Lebanon' },
    'southern lebanon': { lat: 33.2700, lng: 35.2000, country: 'Lebanon' },
    'tyre': { lat: 33.2705, lng: 35.1955, country: 'Lebanon' },
    'damascus': { lat: 33.5138, lng: 36.2765, country: 'Syria' },
    'aleppo': { lat: 36.2021, lng: 37.1343, country: 'Syria' },
    'deir ez-zor': { lat: 35.3360, lng: 40.1408, country: 'Syria' },
    'baghdad': { lat: 33.3128, lng: 44.3615, country: 'Iraq' },
    'erbil': { lat: 36.1911, lng: 44.0094, country: 'Iraq' },
    'sanaa': { lat: 15.3694, lng: 44.1910, country: 'Yemen' },
    'aden': { lat: 12.7855, lng: 45.0187, country: 'Yemen' },
    'red sea': { lat: 20.0000, lng: 38.0000, country: 'International' },
    'riyadh': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
    'washington': { lat: 38.9072, lng: -77.0369, country: 'United States' },
    'new york': { lat: 40.7128, lng: -74.0060, country: 'United States' },
    'eastern mediterranean': { lat: 34.5000, lng: 33.0000, country: 'International' },
  };