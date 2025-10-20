// Web Worker para processamento paralelo de geocodificação
// Este arquivo roda em uma thread separada para não bloquear a UI

import { geocodeAddress } from './geocodingMultiple';

export interface BatchJob {
    id: string;
    addresses: Array<{
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
    }>;
    apiKeys?: {
        locationiq?: string;
        positionstack?: string;
        opencage?: string;
        google?: string;
        mapbox?: string;
        here?: string;
    };
    startIndex: number;
}

export interface BatchResult {
    jobId: string;
    results: Array<{ index: number; result: any }>;
    completed: boolean;
    error?: string;
}

// Função principal que roda no Web Worker
self.onmessage = async (e: MessageEvent<BatchJob>) => {
    const { id, addresses, apiKeys, startIndex } = e.data;

    try {
        const results: Array<{ index: number; result: any }> = [];

        // Processa endereços com delay reduzido para velocidade
        for (let i = 0; i < addresses.length; i++) {
            const addr = addresses[i];
            const result = await geocodeAddress(
                addr.rua,
                addr.numero,
                addr.bairro,
                addr.cidade,
                addr.uf,
                addr.cep,
                apiKeys
            );

            results.push({
                index: startIndex + i,
                result
            });

            // Reporta progresso
            self.postMessage({
                jobId: id,
                results: [results[results.length - 1]],
                completed: false
            } as BatchResult);

            // Delay mínimo para não sobrecarregar APIs
            if (i < addresses.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200)); // 200ms
            }
        }

        // Job completo
        self.postMessage({
            jobId: id,
            results,
            completed: true
        } as BatchResult);

    } catch (error) {
        self.postMessage({
            jobId: id,
            results: [],
            completed: true,
            error: error instanceof Error ? error.message : 'Unknown error'
        } as BatchResult);
    }
};