export interface GlobalCityItem {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export const GLOBAL_CITIES: GlobalCityItem[] = [
  // Vietnam
  { id: "hcmc-vn", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", latitude: 10.7769, longitude: 106.7009, displayName: "Ho Chi Minh City, Vietnam" },
  { id: "hanoi-vn", city: "Hanoi", country: "Vietnam", countryCode: "VN", latitude: 21.0285, longitude: 105.8542, displayName: "Hanoi, Vietnam" },
  { id: "danang-vn", city: "Da Nang", country: "Vietnam", countryCode: "VN", latitude: 16.0544, longitude: 108.2022, displayName: "Da Nang, Vietnam" },
  { id: "haiphong-vn", city: "Hai Phong", country: "Vietnam", countryCode: "VN", latitude: 20.8449, longitude: 106.6881, displayName: "Hai Phong, Vietnam" },
  { id: "cantho-vn", city: "Can Tho", country: "Vietnam", countryCode: "VN", latitude: 10.0452, longitude: 105.7469, displayName: "Can Tho, Vietnam" },
  { id: "nhatrang-vn", city: "Nha Trang", country: "Vietnam", countryCode: "VN", latitude: 12.2388, longitude: 109.1967, displayName: "Nha Trang, Vietnam" },
  { id: "hue-vn", city: "Hue", country: "Vietnam", countryCode: "VN", latitude: 16.4637, longitude: 107.5909, displayName: "Hue, Vietnam" },
  { id: "vungtau-vn", city: "Vung Tau", country: "Vietnam", countryCode: "VN", latitude: 10.346, longitude: 107.0843, displayName: "Vung Tau, Vietnam" },
  { id: "dalat-vn", city: "Da Lat", country: "Vietnam", countryCode: "VN", latitude: 11.9404, longitude: 108.4583, displayName: "Da Lat, Vietnam" },
  { id: "quynhon-vn", city: "Quy Nhon", country: "Vietnam", countryCode: "VN", latitude: 13.782, longitude: 109.2194, displayName: "Quy Nhon, Vietnam" },

  // East & Southeast Asia
  { id: "tokyo-jp", city: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.6762, longitude: 139.6503, displayName: "Tokyo, Japan" },
  { id: "osaka-jp", city: "Osaka", country: "Japan", countryCode: "JP", latitude: 34.6937, longitude: 135.5023, displayName: "Osaka, Japan" },
  { id: "kyoto-jp", city: "Kyoto", country: "Japan", countryCode: "JP", latitude: 35.0116, longitude: 135.7681, displayName: "Kyoto, Japan" },
  { id: "seoul-kr", city: "Seoul", country: "South Korea", countryCode: "KR", latitude: 37.5665, longitude: 126.978, displayName: "Seoul, South Korea" },
  { id: "busan-kr", city: "Busan", country: "South Korea", countryCode: "KR", latitude: 35.1796, longitude: 129.0756, displayName: "Busan, South Korea" },
  { id: "singapore-sg", city: "Singapore", country: "Singapore", countryCode: "SG", latitude: 1.3521, longitude: 103.8198, displayName: "Singapore, Singapore" },
  { id: "bangkok-th", city: "Bangkok", country: "Thailand", countryCode: "TH", latitude: 13.7563, longitude: 100.5018, displayName: "Bangkok, Thailand" },
  { id: "jakarta-id", city: "Jakarta", country: "Indonesia", countryCode: "ID", latitude: -6.2088, longitude: 106.8456, displayName: "Jakarta, Indonesia" },
  { id: "bali-id", city: "Bali (Denpasar)", country: "Indonesia", countryCode: "ID", latitude: -8.6705, longitude: 115.2126, displayName: "Bali, Indonesia" },
  { id: "manila-ph", city: "Manila", country: "Philippines", countryCode: "PH", latitude: 14.5995, longitude: 120.9842, displayName: "Manila, Philippines" },
  { id: "taipei-tw", city: "Taipei", country: "Taiwan", countryCode: "TW", latitude: 25.033, longitude: 121.5654, displayName: "Taipei, Taiwan" },
  { id: "kualalumpur-my", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", latitude: 3.139, longitude: 101.6869, displayName: "Kuala Lumpur, Malaysia" },
  { id: "beijing-cn", city: "Beijing", country: "China", countryCode: "CN", latitude: 39.9042, longitude: 116.4074, displayName: "Beijing, China" },
  { id: "shanghai-cn", city: "Shanghai", country: "China", countryCode: "CN", latitude: 31.2304, longitude: 121.4737, displayName: "Shanghai, China" },
  { id: "hongkong-hk", city: "Hong Kong", country: "Hong Kong", countryCode: "HK", latitude: 22.3193, longitude: 114.1694, displayName: "Hong Kong, Hong Kong" },

  // Europe
  { id: "london-gb", city: "London", country: "United Kingdom", countryCode: "GB", latitude: 51.5074, longitude: -0.1278, displayName: "London, United Kingdom" },
  { id: "paris-fr", city: "Paris", country: "France", countryCode: "FR", latitude: 48.8566, longitude: 2.3522, displayName: "Paris, France" },
  { id: "berlin-de", city: "Berlin", country: "Germany", countryCode: "DE", latitude: 52.52, longitude: 13.405, displayName: "Berlin, Germany" },
  { id: "munich-de", city: "Munich", country: "Germany", countryCode: "DE", latitude: 48.1351, longitude: 11.582, displayName: "Munich, Germany" },
  { id: "amsterdam-nl", city: "Amsterdam", country: "Netherlands", countryCode: "NL", latitude: 52.3676, longitude: 4.9041, displayName: "Amsterdam, Netherlands" },
  { id: "madrid-es", city: "Madrid", country: "Spain", countryCode: "ES", latitude: 40.4168, longitude: -3.7038, displayName: "Madrid, Spain" },
  { id: "barcelona-es", city: "Barcelona", country: "Spain", countryCode: "ES", latitude: 41.3851, longitude: 2.1734, displayName: "Barcelona, Spain" },
  { id: "rome-it", city: "Rome", country: "Italy", countryCode: "IT", latitude: 41.9028, longitude: 12.4964, displayName: "Rome, Italy" },
  { id: "vienna-at", city: "Vienna", country: "Austria", countryCode: "AT", latitude: 48.2082, longitude: 16.3738, displayName: "Vienna, Austria" },
  { id: "zurich-ch", city: "Zurich", country: "Switzerland", countryCode: "CH", latitude: 47.3769, longitude: 8.5417, displayName: "Zurich, Switzerland" },
  { id: "stockholm-se", city: "Stockholm", country: "Sweden", countryCode: "SE", latitude: 59.3293, longitude: 18.0686, displayName: "Stockholm, Sweden" },

  // Americas
  { id: "newyork-us", city: "New York", country: "United States", countryCode: "US", latitude: 40.7128, longitude: -74.006, displayName: "New York, United States" },
  { id: "losangeles-us", city: "Los Angeles", country: "United States", countryCode: "US", latitude: 34.0522, longitude: -118.2437, displayName: "Los Angeles, United States" },
  { id: "chicago-us", city: "Chicago", country: "United States", countryCode: "US", latitude: 41.8781, longitude: -87.6298, displayName: "Chicago, United States" },
  { id: "sanfrancisco-us", city: "San Francisco", country: "United States", countryCode: "US", latitude: 37.7749, longitude: -122.4194, displayName: "San Francisco, United States" },
  { id: "toronto-ca", city: "Toronto", country: "Canada", countryCode: "CA", latitude: 43.6532, longitude: -79.3832, displayName: "Toronto, Canada" },
  { id: "vancouver-ca", city: "Vancouver", country: "Canada", countryCode: "CA", latitude: 49.2827, longitude: -123.1207, displayName: "Vancouver, Canada" },
  { id: "mexicocity-mx", city: "Mexico City", country: "Mexico", countryCode: "MX", latitude: 19.4326, longitude: -99.1332, displayName: "Mexico City, Mexico" },
  { id: "saopaulo-br", city: "Sao Paulo", country: "Brazil", countryCode: "BR", latitude: -23.5505, longitude: -46.6333, displayName: "Sao Paulo, Brazil" },

  // Oceania & Middle East & Africa
  { id: "sydney-au", city: "Sydney", country: "Australia", countryCode: "AU", latitude: -33.8688, longitude: 151.2093, displayName: "Sydney, Australia" },
  { id: "melbourne-au", city: "Melbourne", country: "Australia", countryCode: "AU", latitude: -37.8136, longitude: 144.9631, displayName: "Melbourne, Australia" },
  { id: "auckland-nz", city: "Auckland", country: "New Zealand", countryCode: "NZ", latitude: -36.8485, longitude: 174.7633, displayName: "Auckland, New Zealand" },
  { id: "dubai-ae", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", latitude: 25.2048, longitude: 55.2708, displayName: "Dubai, United Arab Emirates" },
  { id: "cairo-eg", city: "Cairo", country: "Egypt", countryCode: "EG", latitude: 30.0444, longitude: 31.2357, displayName: "Cairo, Egypt" },
];

export function searchGlobalCities(query: string): GlobalCityItem[] {
  if (!query || query.trim().length === 0) {
    return GLOBAL_CITIES.slice(0, 10);
  }
  const q = query.trim().toLowerCase();
  return GLOBAL_CITIES.filter(
    (item) =>
      item.city.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.displayName.toLowerCase().includes(q),
  ).slice(0, 15);
}

export function findGlobalCityByName(cityName?: string | null): GlobalCityItem {
  if (!cityName) return GLOBAL_CITIES[0]!;
  const matched = GLOBAL_CITIES.find(
    (c) => c.city.toLowerCase() === cityName.trim().toLowerCase() || c.displayName.toLowerCase() === cityName.trim().toLowerCase(),
  );
  return matched || {
    id: `custom-${cityName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    city: cityName,
    country: "Vietnam",
    countryCode: "VN",
    latitude: 10.7769,
    longitude: 106.7009,
    displayName: `${cityName}, Vietnam`,
  };
}
