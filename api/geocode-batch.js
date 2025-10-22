export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const HERE_API_KEY = process.env.HERE_API_KEY;
        if (!HERE_API_KEY) return res.status(500).json({ error: 'API key não configurada' });

        const { addresses, maxResults = 10 } = req.body;
        if (!Array.isArray(addresses)) return res.status(400).json({ error: 'Formato inválido' });

        const limit = Math.min(maxResults, 50);
        const addressesToProcess = addresses.slice(0, limit);
        const results = [];

        for (let i = 0; i < addressesToProcess.length; i++) {
            const address = addressesToProcess[i];
            try {
                const params = new URLSearchParams({ q: address, apiKey: HERE_API_KEY, in: 'countryCode:BRA', limit: '1' });
                const hereResponse = await fetch('https://geocode.search.hereapi.com/v1/geocode?' + params);

                if (hereResponse.ok) {
                    const data = await hereResponse.json();
                    if (data.items && data.items.length > 0) {
                        const result = data.items[0];
                        results.push({ success: true, address, lat: result.position.lat, lon: result.position.lng, display_name: result.title || result.address?.label });
                    } else {
                        results.push({ success: false, address, lat: 0, lon: 0 });
                    }
                } else {
                    results.push({ success: false, address, error: 'API error' });
                }

                if (i < addressesToProcess.length - 1) await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                results.push({ success: false, address, error: error.message });
            }
        }

        return res.status(200).json({ processed: results.length, total: addresses.length, results });
    } catch (error) {
        return res.status(500).json({ error: 'Erro no processamento em lote' });
    }
}
