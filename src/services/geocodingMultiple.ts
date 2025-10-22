import { GeocodingResult } from '@/types/patient';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Nominatim (OpenStreetMap) - Sem API key necessária
const geocodeWithNominatim = async (address: string): Promise<GeocodingResult | null> => {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'br'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'GeoSaude/2.0 (UFAL - Universidade Federal de Alagoas; contato: github.com/christiandrades/geosaude)' }
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
  } catch (error) {
    console.error('Nominatim error:', error);
  }
  return null;
};

// LocationIQ - API key opcional (5000 req/dia grátis com key)
const geocodeWithLocationIQ = async (address: string, apiKey?: string): Promise<GeocodingResult | null> => {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'br',
      ...(apiKey && { key: apiKey })
    });

    const response = await fetch(`https://us1.locationiq.com/v1/search?${params}`);

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
  } catch (error) {
    console.error('LocationIQ error:', error);
  }
  return null;
};

// Positionstack - Requer API key (25000 req/mês grátis)
const geocodeWithPositionstack = async (address: string, apiKey?: string): Promise<GeocodingResult | null> => {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      access_key: apiKey,
      query: address,
      country: 'BR',
      limit: '1'
    });

    const response = await fetch(`http://api.positionstack.com/v1/forward?${params}`);

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.data && data.data.length > 0) {
      const result = data.data[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        display_name: result.label || address
      };
    }
  } catch (error) {
    console.error('Positionstack error:', error);
  }
  return null;
};

// OpenCage - Requer API key (2500 req/dia grátis)
const geocodeWithOpenCage = async (address: string, apiKey?: string): Promise<GeocodingResult | null> => {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: address,
      countrycode: 'br',
      limit: '1'
    });

    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params}`);

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.lat,
        lon: result.geometry.lng,
        display_name: result.formatted
      };
    }
  } catch (error) {
    console.error('OpenCage error:', error);
  }
  return null;
};

// Google Maps Geocoding API - 40.000 req/dia grátis, depois $0.005/req
const geocodeWithGoogle = async (address: string, apiKey?: string): Promise<GeocodingResult | null> => {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      address: address,
      key: apiKey,
      region: 'br'
    });

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

    if (!response.ok) return null;
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lon: result.geometry.location.lng,
        display_name: result.formatted_address
      };
    }
  } catch (error) {
    console.error('Google Maps error:', error);
  }
  return null;
};

// Mapbox Geocoding API - 100.000 req/mês grátis
const geocodeWithMapbox = async (address: string, apiKey?: string): Promise<GeocodingResult | null> => {
  if (!apiKey) return null;

  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${apiKey}&country=br&limit=1`);

    if (!response.ok) return null;
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const result = data.features[0];
      return {
        lat: result.center[1],
        lon: result.center[0],
        display_name: result.place_name
      };
    }
  } catch (error) {
    console.error('Mapbox error:', error);
  }
  return null;
};

// Here Maps Geocoding API - 250.000 req/mês grátis
const geocodeWithHere = async (address: string, apiKey?: string): Promise<GeocodingResult | null> => {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      q: address,
      apiKey: apiKey,
      in: 'countryCode:BRA'
    });

    const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);

    if (!response.ok) return null;
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const result = data.items[0];
      return {
        lat: result.position.lat,
        lon: result.position.lng,
        display_name: result.title
      };
    }
  } catch (error) {
    console.error('Here Maps error:', error);
  }
  return null;
};

// Geocodificação com múltiplos serviços (fallback em cascata)
export const geocodeAddress = async (
  rua: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
  cep: string,
  apiKeys?: {
    locationiq?: string;
    positionstack?: string;
    opencage?: string;
    google?: string;
    mapbox?: string;
    here?: string;
  }
): Promise<GeocodingResult | null> => {
  // Build address string
  const addressParts = [
    numero && rua ? `${numero} ${rua}` : rua,
    bairro,
    cidade,
    uf,
    'Brasil',
    cep
  ].filter(Boolean);

  const address = addressParts.join(', ');

  // Try each service in order until one succeeds
  const services = [
    { name: 'Google Maps', fn: () => geocodeWithGoogle(address, apiKeys?.google) },
    { name: 'Mapbox', fn: () => geocodeWithMapbox(address, apiKeys?.mapbox) },
    { name: 'Here Maps', fn: () => geocodeWithHere(address, apiKeys?.here) },
    { name: 'Nominatim', fn: () => geocodeWithNominatim(address) },
    { name: 'LocationIQ', fn: () => geocodeWithLocationIQ(address, apiKeys?.locationiq) },
    { name: 'OpenCage', fn: () => geocodeWithOpenCage(address, apiKeys?.opencage) },
    { name: 'Positionstack', fn: () => geocodeWithPositionstack(address, apiKeys?.positionstack) }
  ];

  for (const service of services) {
    try {
      console.log(`Tentando geocodificar com ${service.name}:`, address);
      const result = await service.fn();
      if (result) {
        console.log(`✓ Sucesso com ${service.name}`);
        return result;
      }
    } catch (error) {
      console.log(`✗ Falha com ${service.name}`);
    }
  }

  console.error('Todos os serviços falharam para:', address);
  return null;
};

export const geocodeBatch = async (
  addresses: Array<{
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  }>,
  onProgress?: (current: number, total: number) => void,
  apiKeys?: {
    locationiq?: string;
    positionstack?: string;
    opencage?: string;
    google?: string;
    mapbox?: string;
    here?: string;
  }
): Promise<Array<GeocodingResult | null>> => {
  const results: Array<GeocodingResult | null> = [];

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    const result = await geocodeAddress(
      addr.rua,
      addr.numero,
      addr.bairro,
      addr.cidade,
      addr.uf,
      addr.cep,
      apiKeys
    );

    results.push(result);

    if (onProgress) {
      onProgress(i + 1, addresses.length);
    }

    // Rate limiting: wait 1.1 seconds between requests
    if (i < addresses.length - 1) {
      await delay(1100);
    }
  }

  return results;
};
