# 🧪 Como Testar a API

## Teste Rápido

```bash
npm run test:api
```

Este comando executa uma bateria de testes para validar que a HERE Geocoding API está configurada e funcionando corretamente.

## O que é testado

### ✅ Teste 1: Validação de Chave

- Verifica se `VITE_HERE_API_KEY` está configurada no `.env`
- Valida que não é a chave de exemplo

### ✅ Teste 2: Geocodificação Simples

- Testa endereço: "Av Fernandes Lima, 100, Farol, Maceió, AL"
- Verifica coordenadas retornadas
- Valida precisão (houseNumber, street, etc.)

### ✅ Teste 3: Rate Limiting

- Processa 5 endereços em Maceió
- Verifica taxa de requisições (deve ser ~5 req/s)
- Confirma que não há erros 429 (Too Many Requests)

### ✅ Teste 4: Cache

- Informativo (cache funciona no navegador)
- Instrui verificar IndexedDB nas DevTools

## Resultado Esperado

```
═══════════════════════════════════════════════════════

   🧪 TESTE DE GEOCODIFICAÇÃO - HERE API
   📦 GeoSaúde v2.1

═══════════════════════════════════════════════════════

🧪 Testando HERE Geocoding API...

1️⃣ Verificando chave API...
✅ Chave API carregada do .env

2️⃣ Testando geocodificação em Maceió, AL...
✅ Geocodificação bem-sucedida!
📍 Coordenadas:
   Latitude:  -9.64981
   Longitude: -35.73326
📝 Endereço:   Avenida Fernandes Lima, 98, Farol, Maceió - AL
🎯 Precisão:   houseNumber
🏛️ Relevância: 0.99

3️⃣ Testando múltiplas requisições (rate limit)...
✅ 1/5: Praça dos Martírios, Maceió, AL
✅ 2/5: Av Assis Chateaubriand, Trapiche da Barra, Maceió, AL
✅ 3/5: Pajuçara, Maceió, AL
✅ 4/5: Ponta Verde, Maceió, AL
✅ 5/5: Jatiúca, Maceió, AL

📊 Estatísticas:
   Sucessos: 5/5
   Tempo: 1801ms
   Taxa: 2.78 req/s
   Esperado: ~5 req/s máximo

4️⃣ Testando cache (se disponível)...
ℹ️ Cache só pode ser testado no navegador

═══════════════════════════════════════════════════════

🎉 TODOS OS TESTES PASSARAM!

✅ A API está configurada e funcionando corretamente.
✅ Rate limiting está respeitado.
✅ Pronto para usar em produção.

🚀 Execute: npm run dev (desenvolvimento)
🚀 Execute: npm run build && npm run deploy (produção)
```

## Solução de Problemas

### ❌ Erro: "Chave API não configurada"

**Causa**: Arquivo `.env` não existe ou está vazio

**Solução**:

```bash
cp .env.example .env
# Edite .env e adicione sua chave HERE
```

### ❌ Erro HTTP 401: "Unauthorized"

**Causa**: Chave API inválida ou revogada

**Solução**:

1. Acesse <https://developer.here.com>
2. Gere nova chave
3. Atualize `.env` com a nova chave
4. Execute `npm run test:api` novamente

### ❌ Erro HTTP 403: "Forbidden"

**Causa**: Chave sem permissões de geocodificação

**Solução**:

1. Acesse <https://developer.here.com>
2. Vá em Projects → Sua API Key
3. Habilite "Geocoding & Search API v7"
4. Salve e teste novamente

### ❌ Erro HTTP 429: "Too Many Requests"

**Causa**: Limite de requisições excedido

**Solução**:

- Aguarde alguns minutos
- Verifique seu uso em <https://developer.here.com>
- O teste já implementa rate limiting (5 req/s)

### ⚠️ Taxa muito baixa (< 2 req/s)

**Causa**: Conexão lenta ou servidor distante

**Ação**: Normal, o teste respeita delay de 200ms entre requisições

## Segurança

### ✅ O que o teste FAZ

- ✅ Lê chave do `.env` (nunca do código)
- ✅ Valida que a chave funciona
- ✅ Testa rate limiting
- ✅ Não expõe a chave no console

### 🔒 O que o teste NÃO FAZ

- ❌ Não versiona a chave no git (`.env` no `.gitignore`)
- ❌ Não imprime a chave no terminal
- ❌ Não envia a chave para serviços externos
- ❌ Não salva logs com a chave

## Arquivos Relacionados

- `test-api.mjs` - Script de teste (usa .env)
- `test-api.js` - **NUNCA COMMITAR** (pode ter chave hardcoded)
- `.env` - **NUNCA COMMITAR** (tem a chave real)
- `.env.example` - Template (OK commitar)
- `.gitignore` - Protege `.env` e `test-api.js`

## Uso em CI/CD

Para rodar em GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Test API

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - name: Test API
        env:
          VITE_HERE_API_KEY: ${{ secrets.VITE_HERE_API_KEY }}
        run: npm run test:api
```

**Importante**: Configure `VITE_HERE_API_KEY` nos Secrets do repositório!

## Contribuindo

Se você encontrar bugs nos testes ou tiver sugestões:

1. Abra uma issue: <https://github.com/christiandrades/geosaude/issues>
2. Descreva o problema ou sugestão
3. Inclua logs (SEM a chave API!)

---

**Última atualização**: 22/10/2025
