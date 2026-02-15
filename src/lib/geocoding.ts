/**
 * Geocoding utility for FilmVault
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

export interface Location {
  lat?: number;
  lon?: number;
  city: string;
  country: string;
  displayName: string;
}

export interface CitySuggestion {
  lat: number;
  lon: number;
  displayName: string;
  city: string;
  country: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const SEARCH_TIMEOUT = 10000; // 10 seconds

/**
 * Search for cities by name (forward geocoding)
 * @param query - City name to search
 * @returns Array of city suggestions
 */
export async function searchCities(query: string): Promise<CitySuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', query.trim());
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FilmVault/0.4.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
      city: extractCity(item.address),
      country: extractCountry(item.address),
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('搜索超时，请重试');
    }
    throw error;
  }
}

/**
 * Reverse geocode - get location name from coordinates
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Location info or null if not found
 */
export async function reverseGeocode(lat: number, lon: number): Promise<Location | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FilmVault/0.4.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No location found
      }
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      return null;
    }

    return {
      lat,
      lon,
      displayName: data.display_name,
      city: extractCity(data.address),
      country: extractCountry(data.address),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('反向地理编码超时，请重试');
    }
    throw error;
  }
}

/**
 * Extract city name from Nominatim address object
 */
function extractCity(address: any): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.county ||
    ''
  );
}

/**
 * Extract country name from Nominatim address object
 */
function extractCountry(address: any): string {
  return address.country || '';
}
