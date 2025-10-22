/**
 * Vercel Serverless Function - Proxy para HERE Geocoding API
 * 
 * Esta função protege a API key no servidor e fornece
 * um endpoint seguro para o frontend chamar.
 * 
 * Deploy: Vercel detecta automaticamente este arquivo
 * URL: https://seu-projeto.vercel.app/api/geocode
 */

export default async function handler(req, res) {
    // CORS Headers para permitir chamadas do frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas POST permitido
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Chave API protegida no servidor (variável de ambiente do Vercel)
        const HERE_API_KEY = process.env.HERE_API_KEY;

        if (!HERE_API_KEY) {
            console.error('🔒 HERE_API_KEY não configurada no Vercel');
            return res.status(500).json({
                error: 'API key não configurada no servidor',
                hint: 'Configure HERE_API_KEY nas variáveis de ambiente do Vercel'
            });
        }

        // Parse do body (Edge Runtime requer parsing manual)
        let body;
        try {
            const text = await req.text();
            body = JSON.parse(text);
        } catch (e) {
            return res.status(400).json({
                error: 'JSON inválido no body',
                hint: 'Envie { "address": "seu endereço aqui" }'
            });
        }

        // Pega o endereço do body
        const { address } = body;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Endereço inválido',
                hint: 'Envie { "address": "seu endereço aqui" }'
            });
        }

        // Validação de tamanho (previne abuso)
        if (address.length > 500) {
            return res.status(400).json({
                error: 'Endereço muito longo (max: 500 caracteres)'
            });
        }

        // Rate limiting básico por IP (opcional, melhor usar Vercel Edge Config)
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`📍 Geocoding request from IP: ${clientIP}`);

        // Chama HERE API
        const params = new URLSearchParams({
            q: address,
            apiKey: HERE_API_KEY,
            in: 'countryCode:BRA',
            limit: '1'
        });

        const hereResponse = await fetch(
            `https://geocode.search.hereapi.com/v1/geocode?${params}`,
            {
                headers: {
                    'User-Agent': 'GeoSaude-Backend/2.1 (UFAL)'
                }
            }
        );

        if (!hereResponse.ok) {
            console.error(`❌ HERE API error: ${hereResponse.status}`);

            // Não expõe detalhes da API para o cliente
            return res.status(hereResponse.status).json({
                error: 'Erro ao geocodificar',
                status: hereResponse.status
            });
        }

        const data = await hereResponse.json();

        // Retorna apenas dados necessários (não expõe response completo)
        if (data.items && data.items.length > 0) {
            const result = data.items[0];

            return res.status(200).json({
                success: true,
                lat: result.position.lat,
                lon: result.position.lng,
                display_name: result.title || result.address?.label,
                matchLevel: result.resultType || 'unknown',
                fullAddress: result.address
            });
        }

        // Nenhum resultado encontrado
        return res.status(200).json({
            success: false,
            lat: 0,
            lon: 0,
            display_name: address,
            matchLevel: 'no_match'
        });

    } catch (error) {
        console.error('❌ Server error:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}

// Configuração do Vercel
export const config = {
    runtime: 'edge', // Usa Vercel Edge Functions (mais rápido)
    regions: ['gru1'], // São Paulo (mais próximo de Alagoas)
};
