import { GeocodingResult } from '@/types/patient';
import { fetchWithRetry, TokenBucket } from '@/lib/resilience';

// HERE API Key - DEVE ser definida no .env como VITE_HERE_API_KEY
const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

// Validação crítica da chave API
if (!HERE_API_KEY) {
    throw new Error(
        '🔒 ERRO CRÍTICO: HERE API key não encontrada!\n' +
        'Defina VITE_HERE_API_KEY no arquivo .env\n' +
        'Copie .env.example para .env e adicione sua chave.'
    );
}

// Rate limit: 5 requisições por segundo com Token Bucket
const rateLimiter = new TokenBucket(5, 5); // 5 tokens, recarrega 5/segundo

// Geocodificação com HERE API (com retry inteligente e rate limiting)
export const geocodeWithHere = async (address: string): Promise<GeocodingResult | null> => {
    try {
        // Aguarda token do rate limiter antes de fazer requisição
        await rateLimiter.consume();

        const params = new URLSearchParams({
            q: address,
            apiKey: HERE_API_KEY,
            in: 'countryCode:BRA',
            limit: '1'
        });

        // Usa fetchWithRetry para retry automático com backoff exponencial
        const response = await fetchWithRetry(
            `https://geocode.search.hereapi.com/v1/geocode?${params}`,
            undefined,
            {
                maxRetries: 3,
                initialDelay: 500,
                retryableStatuses: [429, 500, 502, 503, 504]
            }
        );

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const result = data.items[0];

            return {
                lat: result.position.lat,
                lon: result.position.lng,
                display_name: result.title || result.address?.label || address,
                matchLevel: result.resultType || 'unknown',
                fullAddress: result.address,
                success: true
            };
        }

        console.log('HERE API: Nenhum resultado para', address);
        return {
            lat: 0,
            lon: 0,
            display_name: address,
            matchLevel: 'no_match',
            success: false
        };

    } catch (error) {
        console.error('HERE API exception:', error);
        return {
            lat: 0,
            lon: 0,
            display_name: address,
            matchLevel: 'error',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Geocodificação em lote com controle de rate limit
export const geocodeBatchHere = async (
    addresses: Array<{
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
        [key: string]: any; // Permite campos adicionais
    }>,
    onProgress?: (current: number, total: number, currentResult?: GeocodingResult) => void,
    shouldCancel?: () => boolean
): Promise<Array<GeocodingResult>> => {
    const results: Array<GeocodingResult> = [];
    const total = addresses.length;

    console.log(`Iniciando geocodificação de ${total} endereços...`);

    for (let i = 0; i < addresses.length; i++) {
        // Verifica se foi cancelado
        if (shouldCancel && shouldCancel()) {
            console.log(`⚠️ Geocodificação cancelada pelo usuário em ${i}/${total}`);
            break;
        }

        const addr = addresses[i];

        // Monta endereço completo
        const addressParts = [
            addr.numero && addr.rua ? `${addr.rua}, ${addr.numero}` : addr.rua,
            addr.bairro,
            addr.cidade,
            addr.uf,
            'Brasil',
            addr.cep
        ].filter(Boolean);

        const fullAddress = addressParts.join(', ');

        // Geocodifica
        const result = await geocodeWithHere(fullAddress);

        if (result) {
            // Adiciona dados originais ao resultado
            result.originalData = addr;
            results.push(result);
        } else {
            // Caso falhe, adiciona resultado vazio
            results.push({
                lat: 0,
                lon: 0,
                display_name: fullAddress,
                matchLevel: 'error',
                success: false,
                originalData: addr
            });
        }

        // Callback de progresso
        if (onProgress) {
            onProgress(i + 1, total, results[results.length - 1]);
        }

        // Rate limiting é gerenciado pelo TokenBucket no geocodeWithHere
    }

    console.log(`Geocodificação concluída! Sucessos: ${results.filter(r => r.success).length}/${total}`);

    return results;
};

// Versão automática que processa tudo de uma vez
export const geocodeAllAutomatic = async (
    addresses: Array<{
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
        [key: string]: any;
    }>,
    onProgress?: (current: number, total: number, currentResult?: GeocodingResult) => void,
    shouldCancel?: () => boolean
): Promise<Array<GeocodingResult>> => {
    console.log('🚀 Modo automático: processando todos os endereços...');
    return geocodeBatchHere(addresses, onProgress, shouldCancel);
};