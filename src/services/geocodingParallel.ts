import { GeocodingResult } from '@/types/patient';
import { BatchJob, BatchResult } from './geocodingWorker';

export class ParallelGeocodingService {
    private workers: Worker[] = [];
    private maxWorkers: number;
    private activeJobs: Map<string, { resolve: Function; reject: Function; results: any[] }> = new Map();

    constructor(maxWorkers = 4) {
        this.maxWorkers = Math.min(maxWorkers, navigator.hardwareConcurrency || 4);
    }

    // Cria workers sob demanda
    private createWorker(): Worker {
        const worker = new Worker(new URL('./geocodingWorker.ts', import.meta.url), {
            type: 'module'
        });

        worker.onmessage = (e: MessageEvent<BatchResult>) => {
            const { jobId, results, completed, error } = e.data;
            const job = this.activeJobs.get(jobId);

            if (job) {
                // Acumula resultados parciais
                job.results.push(...results);

                if (completed) {
                    if (error) {
                        job.reject(new Error(error));
                    } else {
                        job.resolve(job.results);
                    }
                    this.activeJobs.delete(jobId);
                    this.workers = this.workers.filter(w => w !== worker);
                    worker.terminate();
                }
            }
        };

        worker.onerror = (error) => {
            console.error('Worker error:', error);
            // Remove worker com erro
            this.workers = this.workers.filter(w => w !== worker);
            worker.terminate();
        };

        return worker;
    }

    // Processa lote em paralelo
    async processBatch(
        addresses: Array<{
            rua: string;
            numero: string;
            bairro: string;
            cidade: string;
            uf: string;
            cep: string;
        }>,
        onProgress?: (current: number, total: number) => void,
        apiKeys?: {
            locationiq?: string;
            positionstack?: string;
            opencage?: string;
            google?: string;
            mapbox?: string;
            here?: string;
        },
        batchSize = 100
    ): Promise<Array<GeocodingResult | null>> {
        const totalAddresses = addresses.length;
        const batches: BatchJob[] = [];
        let jobIdCounter = 0;

        // Divide endereços em lotes
        for (let i = 0; i < totalAddresses; i += batchSize) {
            const batchAddresses = addresses.slice(i, i + batchSize);
            batches.push({
                id: `job_${jobIdCounter++}`,
                addresses: batchAddresses,
                apiKeys,
                startIndex: i
            });
        }

        const allResults: Array<{ index: number; result: GeocodingResult | null }> = [];
        let completedBatches = 0;

        // Processa lotes em paralelo
        const promises = batches.map(async (batch) => {
            return new Promise<Array<{ index: number; result: GeocodingResult | null }>>((resolve, reject) => {
                this.activeJobs.set(batch.id, {
                    resolve,
                    reject,
                    results: []
                });

                // Reutiliza worker existente ou cria novo
                let worker = this.workers.find(w => !this.isWorkerBusy(w));
                if (!worker && this.workers.length < this.maxWorkers) {
                    worker = this.createWorker();
                    this.workers.push(worker);
                }

                if (worker) {
                    worker.postMessage(batch);
                } else {
                    reject(new Error('No available workers'));
                }
            }).then(results => {
                completedBatches++;
                if (onProgress) {
                    onProgress(completedBatches, batches.length);
                }
                return results;
            });
        });

        // Aguarda todos os lotes
        const batchResults = await Promise.all(promises);

        // Combina resultados mantendo ordem
        batchResults.forEach(results => {
            allResults.push(...results);
        });

        // Ordena por índice e extrai apenas os resultados
        allResults.sort((a, b) => a.index - b.index);
        return allResults.map(item => item.result);
    }

    private isWorkerBusy(worker: Worker): boolean {
        // Worker está ocupado se estiver processando um job
        return Array.from(this.activeJobs.values()).some(job =>
            this.workers.some(w => w === worker)
        );
    }

    // Limpa todos os workers
    destroy(): void {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.activeJobs.clear();
    }
}

// Função de conveniência para uso direto
export const geocodeBatchParallel = async (
    addresses: Array<{
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
    }>,
    onProgress?: (current: number, total: number) => void,
    apiKeys?: {
        locationiq?: string;
        positionstack?: string;
        opencage?: string;
        google?: string;
        mapbox?: string;
        here?: string;
    },
    batchSize = 100,
    maxWorkers = 4
): Promise<Array<GeocodingResult | null>> => {
    const service = new ParallelGeocodingService(maxWorkers);
    try {
        return await service.processBatch(addresses, onProgress, apiKeys, batchSize);
    } finally {
        service.destroy();
    }
};