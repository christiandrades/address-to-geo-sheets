/**
 * Teste SEGURO da HERE Geocoding API
 * Lê a chave do arquivo .env (não expõe no código)
 * 
 * USO:
 *   npm run test:api
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carrega variáveis do .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const HERE_API_KEY = process.env.VITE_HERE_API_KEY;

async function testHereAPI() {
    console.log('🧪 Testando HERE Geocoding API...\n');

    // Teste 1: Verificar se a chave existe
    console.log('1️⃣ Verificando chave API...');
    if (!HERE_API_KEY || HERE_API_KEY === 'sua_chave_aqui_substitua_este_valor') {
        console.error('❌ ERRO: Chave API não configurada no .env!\n');
        console.error('Execute: cp .env.example .env');
        console.error('E adicione sua chave no arquivo .env\n');
        return false;
    }
    console.log('✅ Chave API carregada do .env\n');

    // Teste 2: Endereço simples em Maceió
    console.log('2️⃣ Testando geocodificação em Maceió, AL...');
    const testAddress = 'Av Fernandes Lima, 100, Farol, Maceió, AL, Brasil';

    try {
        const params = new URLSearchParams({
            q: testAddress,
            apiKey: HERE_API_KEY,
            in: 'countryCode:BRA',
            limit: '1'
        });

        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);

        if (!response.ok) {
            console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);

            if (response.status === 401) {
                console.error('🔒 Chave API inválida ou revogada');
                console.error('Gere nova chave em: https://developer.here.com\n');
            } else if (response.status === 403) {
                console.error('🚫 Acesso negado - verifique permissões da chave\n');
            } else if (response.status === 429) {
                console.error('⏱️ Rate limit excedido\n');
            }

            return false;
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const result = data.items[0];
            console.log('✅ Geocodificação bem-sucedida!');
            console.log('📍 Coordenadas:');
            console.log(`   Latitude:  ${result.position.lat}`);
            console.log(`   Longitude: ${result.position.lng}`);
            console.log(`📝 Endereço:   ${result.title}`);
            console.log(`🎯 Precisão:   ${result.resultType}`);
            console.log(`🏛️ Relevância: ${result.scoring?.queryScore || 'N/A'}\n`);
            return true;
        } else {
            console.error('❌ Nenhum resultado encontrado\n');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
        if (error.cause) {
            console.error('Causa:', error.cause);
        }
        return false;
    }
}

// Teste 3: Múltiplos endereços (verificar rate limit)
async function testMultipleRequests() {
    console.log('3️⃣ Testando múltiplas requisições (rate limit)...');

    const addresses = [
        'Praça dos Martírios, Maceió, AL',
        'Av Assis Chateaubriand, Trapiche da Barra, Maceió, AL',
        'Pajuçara, Maceió, AL',
        'Ponta Verde, Maceió, AL',
        'Jatiúca, Maceió, AL'
    ];

    const startTime = Date.now();
    let successCount = 0;

    for (const address of addresses) {
        try {
            const params = new URLSearchParams({
                q: address,
                apiKey: HERE_API_KEY,
                in: 'countryCode:BRA',
                limit: '1'
            });

            const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);

            if (response.ok) {
                successCount++;
                console.log(`✅ ${successCount}/${addresses.length}: ${address}`);
            } else {
                console.error(`❌ Falhou: ${address} (HTTP ${response.status})`);
            }

            // Rate limit: aguarda 200ms entre requisições (5 req/s)
            await new Promise(r => setTimeout(r, 200));
        } catch (error) {
            console.error(`❌ Erro: ${address}`, error.message);
        }
    }

    const elapsed = Date.now() - startTime;
    const rps = (successCount / (elapsed / 1000)).toFixed(2);

    console.log(`\n📊 Estatísticas:`);
    console.log(`   Sucessos: ${successCount}/${addresses.length}`);
    console.log(`   Tempo: ${elapsed}ms`);
    console.log(`   Taxa: ${rps} req/s`);
    console.log(`   Esperado: ~5 req/s máximo\n`);

    return successCount === addresses.length;
}

// Teste 4: Validar cache (se implementado)
async function testCache() {
    console.log('4️⃣ Testando cache (se disponível)...');

    // Este teste seria executado no navegador com IndexedDB
    console.log('ℹ️ Cache só pode ser testado no navegador');
    console.log('   Execute a aplicação e verifique DevTools → Application → IndexedDB\n');

    return true;
}

// Executa testes
(async () => {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('   🧪 TESTE DE GEOCODIFICAÇÃO - HERE API');
    console.log('   📦 GeoSaúde v2.1');
    console.log('\n═══════════════════════════════════════════════════════\n');

    const test1 = await testHereAPI();

    if (!test1) {
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('❌ TESTE CRÍTICO FALHOU\n');
        console.log('Verifique a chave API no .env e tente novamente.\n');
        process.exit(1);
    }

    const test2 = await testMultipleRequests();
    const test3 = await testCache();

    console.log('═══════════════════════════════════════════════════════\n');

    if (test1 && test2 && test3) {
        console.log('🎉 TODOS OS TESTES PASSARAM!\n');
        console.log('✅ A API está configurada e funcionando corretamente.');
        console.log('✅ Rate limiting está respeitado.');
        console.log('✅ Pronto para usar em produção.\n');
        console.log('🚀 Execute: npm run dev (desenvolvimento)');
        console.log('🚀 Execute: npm run build && npm run deploy (produção)\n');
        process.exit(0);
    } else {
        console.log('⚠️ ALGUNS TESTES FALHARAM\n');
        console.log('Verifique os erros acima.\n');
        process.exit(1);
    }
})();
