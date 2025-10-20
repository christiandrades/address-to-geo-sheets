import { GeocodingResult } from '@/types/patient';

// Base de dados simplificada de CEPs brasileiros (exemplo)
// Em produção, use uma base completa como a dos Correios
const cepDatabase: Record<string, { lat: number; lon: number; cidade: string }> = {
    // Arapiraca/AL - dados de exemplo
    '57301310': { lat: -9.7475, lon: -36.6611, cidade: 'Arapiraca' },
    '57301340': { lat: -9.7480, lon: -36.6620, cidade: 'Arapiraca' },
    '57301350': { lat: -9.7490, lon: -36.6630, cidade: 'Arapiraca' },
    // Adicione mais CEPs conforme necessário
};

// Geocodificação offline baseada em CEP
export const geocodeOffline = async (
    rua: string,
    numero: string,
    bairro: string,
    cidade: string,
    uf: string,
    cep: string
): Promise<GeocodingResult | null> => {
    try {
        // Remove formatação do CEP
        const cleanCep = cep.replace(/\D/g, '');

        // Busca por CEP exato
        if (cepDatabase[cleanCep]) {
            const location = cepDatabase[cleanCep];
            return {
                lat: location.lat,
                lon: location.lon,
                display_name: `${rua}, ${numero} - ${bairro}, ${cidade} - ${uf}, ${cep}, Brasil`
            };
        }

        // Busca por CEP aproximado (primeiros 5 dígitos)
        const approximateCep = cleanCep.substring(0, 5);
        for (const [cepKey, location] of Object.entries(cepDatabase)) {
            if (cepKey.startsWith(approximateCep)) {
                return {
                    lat: location.lat + (Math.random() - 0.5) * 0.01, // Adiciona variação aleatória
                    lon: location.lon + (Math.random() - 0.5) * 0.01,
                    display_name: `${rua}, ${numero} - ${bairro}, ${cidade} - ${uf}, ${cep}, Brasil`
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Offline geocoding error:', error);
        return null;
    }
};

// Função para adicionar mais CEPs à base de dados
export const addCepToDatabase = (cep: string, lat: number, lon: number, cidade: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    cepDatabase[cleanCep] = { lat, lon, cidade };
};

// Função para carregar base de CEPs de um arquivo CSV
export const loadCepDatabase = (csvContent: string) => {
    // Implementar parsing do CSV com CEPs
    // Formato esperado: cep,latitude,longitude,cidade
    const lines = csvContent.split('\n');
    lines.forEach(line => {
        const [cep, lat, lon, cidade] = line.split(',');
        if (cep && lat && lon) {
            addCepToDatabase(cep, parseFloat(lat), parseFloat(lon), cidade);
        }
    });
};