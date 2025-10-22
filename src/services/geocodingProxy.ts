/**
 * Serviço de Geocodificação com Backend Proxy
 * 
 * Usa o backend Vercel para proteger a API key
 * Em vez de chamar HERE diretamente, chama nosso proxy
 */

import { GeocodingResult } from '@/types/patient';
import { withBackoff, TokenBucket } from '@/lib/resilience';
import { getCachedResult, setCachedResult } from './geocodingCache';

// URL do backend (será configurada no Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'https://geosaude.vercel.app/api';

// Rate limiter (5 req/s)
const rateLimiter = new TokenBucket(5, 5);

/**
 * Geocodifica um endereço usando o backend proxy
 */
export const geocodeWithProxy = async (
    addressParts: {
        rua?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
        cep?: string;
    }
): Promise<GeocodingResult | null> => {
    try {
        // Verifica cache primeiro
        const cached = await getCachedResult(addressParts);
        if (cached) {
            console.log('✅ Cache HIT:', addressParts.rua);
            return cached;
        }

        // Aguarda rate limiter
        await rateLimiter.consume();

        // Monta endereço completo
        const addressString = [
            addressParts.numero && addressParts.rua
                ? `${addressParts.rua}, ${addressParts.numero}`
                : addressParts.rua,
            addressParts.bairro,
            addressParts.cidade,
            addressParts.uf,
            'Brasil',
            addressParts.cep
        ].filter(Boolean).join(', ');

        // Chama o backend proxy com retry
        const response = await withBackoff(
            async () => {
                const res = await fetch(`${API_URL}/geocode`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ address: addressString })
                });

                if (!res.ok) {
                    throw new Error(`Backend error: ${res.status}`);
                }

                return res;
            },
            {
                maxRetries: 3,
                initialDelay: 500,
                retryableStatuses: [429, 500, 502, 503, 504]
            }
        );

        const data = await response.json();

        if (data.success) {
            const result: GeocodingResult = {
                lat: data.lat,
                lon: data.lon,
                display_name: data.display_name,
                matchLevel: data.matchLevel,
                fullAddress: data.fullAddress,
                success: true,
                originalData: addressParts
            };

            // Salva no cache
            await setCachedResult(addressParts, result);

            return result;
        }

        // Sem resultado
        return {
            lat: 0,
            lon: 0,
            display_name: addressString,
            matchLevel: 'no_match',
            success: false,
            originalData: addressParts
        };

    } catch (error) {
        console.error('❌ Proxy geocoding error:', error);
        return {
            lat: 0,
            lon: 0,
            display_name: '',
            matchLevel: 'error',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            originalData: addressParts
        };
    }
};

/**
 * Geocodifica múltiplos endereços usando batch endpoint
 */
export const geocodeBatchWithProxy = async (
    addresses: Array<{
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
        [key: string]: any;
    }>,
    onProgress?: (current: number, total: number, result?: GeocodingResult) => void,
    shouldCancel?: () => boolean
): Promise<Array<GeocodingResult>> => {
    const results: Array<GeocodingResult> = [];
    const total = addresses.length;

    console.log(`🚀 Iniciando geocodificação de ${total} endereços via backend proxy...`);

    // Processa em chunks de 10 para não sobrecarregar o backend
    const CHUNK_SIZE = 10;

    for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
        if (shouldCancel && shouldCancel()) {
            console.log(`⚠️ Cancelado em ${i}/${total}`);
            break;
        }

        const chunk = addresses.slice(i, Math.min(i + CHUNK_SIZE, addresses.length));

        // Processa chunk individualmente (para ter controle de cache e progresso)
        for (const addr of chunk) {
            if (shouldCancel && shouldCancel()) break;

            const result = await geocodeWithProxy(addr);

            if (result) {
                results.push(result);
            }

            if (onProgress) {
                onProgress(results.length, total, result);
            }
        }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Concluído: ${successCount}/${results.length} sucessos`);

    return results;
};

/**
 * Testa se o backend está acessível
 */
export const testBackendConnection = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: 'Maceió, AL' })
        });

        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Retorna URL do backend configurado
 */
export const getBackendURL = (): string => {
    return API_URL;
};
