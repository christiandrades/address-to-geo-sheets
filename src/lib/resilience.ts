/**
 * Utilitários para resiliência de requisições HTTP
 * - Retry com exponential backoff
 * - Circuit breaker pattern
 * - Rate limiting inteligente
 */

export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryableStatuses?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxRetries: 5,
    initialDelay: 250,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Executa uma função com retry exponencial e backoff
 * @param fn Função assíncrona a ser executada
 * @param options Opções de retry
 * @returns Resultado da função ou erro após todas as tentativas
 */
export async function withBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let delay = opts.initialDelay;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Última tentativa - não faz retry
            if (attempt === opts.maxRetries - 1) {
                console.error(`❌ Todas as ${opts.maxRetries} tentativas falharam`);
                throw lastError;
            }

            // Verifica se o erro é retryable
            if (error instanceof Response && !opts.retryableStatuses.includes(error.status)) {
                console.warn(`⚠️ Status ${error.status} não é retryable, abortando`);
                throw error;
            }

            // Log de retry
            console.log(
                `🔄 Tentativa ${attempt + 1}/${opts.maxRetries} falhou, ` +
                `aguardando ${delay}ms antes de tentar novamente...`
            );

            // Aguarda com backoff exponencial
            await new Promise(resolve => setTimeout(resolve, delay));

            // Aumenta o delay exponencialmente, respeitando o máximo
            delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
        }
    }

    // Nunca deveria chegar aqui, mas TypeScript exige
    throw lastError || new Error('Retries esgotados sem erro específico');
}

/**
 * Executa requisição fetch com retry automático
 * @param url URL da requisição
 * @param init Opções do fetch
 * @param retryOptions Opções de retry
 * @returns Response ou erro
 */
export async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    retryOptions?: RetryOptions
): Promise<Response> {
    return withBackoff(async () => {
        const response = await fetch(url, init);

        // Se não for bem-sucedido, lança erro para trigger retry
        if (!response.ok) {
            throw response;
        }

        return response;
    }, retryOptions);
}

/**
 * Token Bucket para rate limiting inteligente
 */
export class TokenBucket {
    private tokens: number;
    private lastRefill: number;

    constructor(
        private capacity: number,
        private refillRate: number // tokens por segundo
    ) {
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }

    /**
     * Tenta consumir tokens, retornando o tempo de espera necessário
     * @param tokensNeeded Número de tokens necessários
     * @returns Tempo em ms para aguardar antes de consumir
     */
    async consume(tokensNeeded: number = 1): Promise<void> {
        this.refill();

        if (this.tokens >= tokensNeeded) {
            this.tokens -= tokensNeeded;
            return;
        }

        // Calcula tempo de espera necessário
        const tokensDeficit = tokensNeeded - this.tokens;
        const waitTime = (tokensDeficit / this.refillRate) * 1000;

        console.log(`⏳ Rate limit: aguardando ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        this.refill();
        this.tokens -= tokensNeeded;
    }

    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        const tokensToAdd = elapsed * this.refillRate;

        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }

    /**
     * Reseta o bucket para capacidade máxima
     */
    reset(): void {
        this.tokens = this.capacity;
        this.lastRefill = Date.now();
    }
}

/**
 * Circuit Breaker para prevenir sobrecarga de serviços com falha
 */
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(
        private failureThreshold: number = 5,
        private timeout: number = 60000 // 1 minuto
    ) { }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                console.log('🔄 Circuit breaker: tentando half-open...');
                this.state = 'half-open';
            } else {
                throw new Error('Circuit breaker está aberto - serviço temporariamente indisponível');
            }
        }

        try {
            const result = await fn();

            // Sucesso - reseta o contador
            if (this.state === 'half-open') {
                console.log('✅ Circuit breaker: fechado novamente');
                this.state = 'closed';
            }
            this.failures = 0;

            return result;
        } catch (error) {
            this.failures++;
            this.lastFailureTime = Date.now();

            if (this.failures >= this.failureThreshold) {
                console.error(`🚨 Circuit breaker: ABERTO após ${this.failures} falhas consecutivas`);
                this.state = 'open';
            }

            throw error;
        }
    }

    reset(): void {
        this.failures = 0;
        this.state = 'closed';
        console.log('🔄 Circuit breaker resetado');
    }

    getState(): string {
        return this.state;
    }
}
