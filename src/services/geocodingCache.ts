/**
 * Cache de geocodificação usando IndexedDB
 * Evita requisições desnecessárias para endereços já processados
 */

import localforage from 'localforage';
import { GeocodingResult } from '@/types/patient';

// Configuração do cache
const geocodingCache = localforage.createInstance({
    name: 'geosaude-cache',
    storeName: 'geocoding',
    description: 'Cache de resultados de geocodificação'
});

/**
 * Gera hash SHA-256 de um endereço para uso como chave de cache
 */
async function hashAddress(address: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(address.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normaliza endereço para consistência no cache
 */
function normalizeAddress(parts: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
}): string {
    const normalized = [
        parts.rua?.trim(),
        parts.numero?.trim(),
        parts.bairro?.trim(),
        parts.cidade?.trim(),
        parts.uf?.trim(),
        parts.cep?.replace(/\D/g, '')
    ]
        .filter(Boolean)
        .map(s => s!.toLowerCase())
        .join('|');

    return normalized;
}

/**
 * Interface para resultado de cache
 */
interface CachedResult {
    result: GeocodingResult;
    timestamp: number;
    version: string;
}

const CACHE_VERSION = '2.0';
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 dias

/**
 * Busca resultado no cache
 */
export async function getCachedResult(addressParts: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
}): Promise<GeocodingResult | null> {
    try {
        const normalized = normalizeAddress(addressParts);
        const key = await hashAddress(normalized);

        const cached = await geocodingCache.getItem<CachedResult>(key);

        if (!cached) {
            return null;
        }

        // Verifica versão e TTL
        if (cached.version !== CACHE_VERSION) {
            console.log('🗑️ Cache invalidado por mudança de versão');
            await geocodingCache.removeItem(key);
            return null;
        }

        const age = Date.now() - cached.timestamp;
        if (age > CACHE_TTL) {
            console.log('🗑️ Cache expirado');
            await geocodingCache.removeItem(key);
            return null;
        }

        console.log('✅ Cache HIT:', normalized);
        return cached.result;
    } catch (error) {
        console.error('Erro ao buscar cache:', error);
        return null;
    }
}

/**
 * Salva resultado no cache
 */
export async function setCachedResult(
    addressParts: {
        rua?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
        cep?: string;
    },
    result: GeocodingResult
): Promise<void> {
    try {
        // Só cacheia resultados bem-sucedidos
        if (!result.success || result.lat === 0 || result.lon === 0) {
            return;
        }

        const normalized = normalizeAddress(addressParts);
        const key = await hashAddress(normalized);

        const cached: CachedResult = {
            result,
            timestamp: Date.now(),
            version: CACHE_VERSION
        };

        await geocodingCache.setItem(key, cached);
        console.log('💾 Cache SAVE:', normalized);
    } catch (error) {
        console.error('Erro ao salvar cache:', error);
    }
}

/**
 * Limpa todo o cache
 */
export async function clearCache(): Promise<void> {
    try {
        await geocodingCache.clear();
        console.log('🗑️ Cache completamente limpo');
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
    }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(): Promise<{
    totalEntries: number;
    estimatedSize: number;
}> {
    try {
        const keys = await geocodingCache.keys();

        return {
            totalEntries: keys.length,
            estimatedSize: keys.length * 500 // Estimativa: ~500 bytes por entrada
        };
    } catch (error) {
        console.error('Erro ao obter estatísticas do cache:', error);
        return { totalEntries: 0, estimatedSize: 0 };
    }
}

/**
 * Remove entradas antigas do cache (manutenção)
 */
export async function pruneCache(): Promise<number> {
    try {
        const keys = await geocodingCache.keys();
        let removed = 0;

        for (const key of keys) {
            const cached = await geocodingCache.getItem<CachedResult>(key as string);

            if (cached) {
                const age = Date.now() - cached.timestamp;

                if (age > CACHE_TTL || cached.version !== CACHE_VERSION) {
                    await geocodingCache.removeItem(key as string);
                    removed++;
                }
            }
        }

        console.log(`🗑️ ${removed} entradas antigas removidas do cache`);
        return removed;
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        return 0;
    }
}
