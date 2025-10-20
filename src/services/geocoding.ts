import { GeocodingResult } from '@/types/patient';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// Rate limiting: Nominatim allows 1 request per second
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodeAddress = async (
  rua: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
  cep: string
): Promise<GeocodingResult | null> => {
  try {
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
    
    // Make request to Nominatim
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'br'
    });

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      headers: {
        'User-Agent': 'HealthGeocoder/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
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
  onProgress?: (current: number, total: number) => void
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
      addr.cep
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
