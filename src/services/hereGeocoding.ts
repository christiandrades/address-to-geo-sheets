import { GeocodingResult } from '@/types/patient';

// HERE API Key
const HERE_API_KEY = 'scjJzHjgoa1K-e2vAO-iu6hQveH-Vpg_8ii0PBTcjFc';

// Rate limit: 5 requisições por segundo
const RATE_LIMIT = 5;
const DELAY_MS = 1000 / RATE_LIMIT; // 200ms entre requisições

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Geocodificação com HERE API
export const geocodeWithHere = async (address: string): Promise<GeocodingResult | null> => {
    try {
        const params = new URLSearchParams({
            q: address,
            apiKey: HERE_API_KEY,
            in: 'countryCode:BRA',
            limit: '1'
        });

        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);

        if (!response.ok) {
            console.error(`HERE API error (${response.status}):`, response.statusText);

            // Retry em caso de rate limit
            if (response.status === 429) {
                console.log('Rate limit atingido, aguardando 1 segundo...');
                await delay(1000);
                return geocodeWithHere(address); // Retry
            }

            return null;
        }

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

        // Rate limiting: aguarda antes da próxima requisição
        if (i < addresses.length - 1) {
            await delay(DELAY_MS);
        }
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