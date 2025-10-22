/**
 * Vercel Serverless Function - Geocodificação em Lote
 * 
 * Processa múltiplos endereços de uma vez
 * com rate limiting automático
 * 
 * URL: https://seu-projeto.vercel.app/api/geocode-batch
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

        const { addresses, maxResults = 10 } = req.body;

        // Validações
        if (!Array.isArray(addresses)) {
            return res.status(400).json({
                error: 'Formato inválido. Envie um array de endereços.'
            });
        }

        // Limita quantidade por requisição (previne abuso)
        const limit = Math.min(maxResults, 50); // máximo 50 por vez
        const addressesToProcess = addresses.slice(0, limit);

        console.log(`📦 Processando ${addressesToProcess.length} endereços`);

        const results = [];

        // Processa com rate limiting (5 req/s)
        for (let i = 0; i < addressesToProcess.length; i++) {
            const address = addressesToProcess[i];

            try {
                const params = new URLSearchParams({
                    q: address,
                    apiKey: HERE_API_KEY,
                    in: 'countryCode:BRA',
                    limit: '1'
                });

                const hereResponse = await fetch(
                    `https://geocode.search.hereapi.com/v1/geocode?${params}`
                );

                if (hereResponse.ok) {
                    const data = await hereResponse.json();

                    if (data.items && data.items.length > 0) {
                        const result = data.items[0];
                        results.push({
                            success: true,
                            address,
                            lat: result.position.lat,
                            lon: result.position.lng,
                            display_name: result.title,
                            matchLevel: result.resultType
                        });
                    } else {
                        results.push({
                            success: false,
                            address,
                            lat: 0,
                            lon: 0,
                            matchLevel: 'no_match'
                        });
                    }
                } else {
                    results.push({
                        success: false,
                        address,
                        error: `HTTP ${hereResponse.status}`
                    });
                }

                // Rate limiting: 200ms entre requisições (5 req/s)
                if (i < addressesToProcess.length - 1) {
                    await new Promise(r => setTimeout(r, 200));
                }

            } catch (error) {
                results.push({
                    success: false,
                    address,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            processed: results.length,
            total: addresses.length,
            results
        });

    } catch (error) {
        console.error('❌ Batch error:', error);
        return res.status(500).json({
            error: 'Erro no processamento em lote'
        });
    }
}

export const config = {
    runtime: 'edge',
    regions: ['gru1'],
    maxDuration: 30, // 30 segundos (tempo suficiente para ~150 endereços)
};
