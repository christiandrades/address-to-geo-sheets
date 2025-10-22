/**
 * Vercel Serverless Function - Proxy para HERE Geocoding API
 */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const HERE_API_KEY = process.env.HERE_API_KEY;

        if (!HERE_API_KEY) {
            return res.status(500).json({
                error: 'API key não configurada'
            });
        }

        // Vercel parseia JSON automaticamente para req.body
        const { address } = req.body;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Endereço inválido',
                hint: 'Envie { "address": "seu endereço aqui" }'
            });
        }

        if (address.length > 500) {
            return res.status(400).json({
                error: 'Endereço muito longo (max: 500 caracteres)'
            });
        }

        // Chama HERE API
        const params = new URLSearchParams({
            q: address,
            apiKey: HERE_API_KEY,
            in: 'countryCode:BRA',
            limit: '1'
        });

        const hereResponse = await fetch(
            `https://geocode.search.hereapi.com/v1/geocode?${params}`
        );

        if (!hereResponse.ok) {
            return res.status(502).json({
                error: 'Erro ao geocodificar'
            });
        }

        const data = await hereResponse.json();

        if (data.items && data.items.length > 0) {
            const result = data.items[0];

            return res.status(200).json({
                success: true,
                lat: result.position.lat,
                lon: result.position.lng,
                display_name: result.title || result.address?.label,
                matchLevel: result.resultType || 'unknown'
            });
        }

        return res.status(200).json({
            success: false,
            lat: 0,
            lon: 0,
            display_name: address,
            matchLevel: 'no_match'
        });

    } catch (error) {
        console.error('Error:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
}
