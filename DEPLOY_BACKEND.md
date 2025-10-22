# 🚀 Deploy do Backend Proxy no Vercel

## Por que Backend Proxy?

O GitHub Pages é **apenas frontend** (HTML/CSS/JS estáticos). A chave da HERE API fica exposta no bundle JavaScript, mesmo usando variáveis de ambiente.

Com **backend proxy**, a chave fica protegida no servidor:

```
Frontend (GitHub Pages) → Backend (Vercel) → HERE API
    ↓                           ↓
  Público                   🔒 Protegido
```

## Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

## Passo 2: Login no Vercel

```bash
vercel login
```

## Passo 3: Deploy do Projeto

Na raiz do projeto:

```bash
vercel
```

Responda as perguntas:

```
? Set up and deploy? [Y/n] Y
? Which scope? [Seu usuário]
? Link to existing project? [N]
? What's your project's name? geosaude
? In which directory is your code located? ./
? Want to override the settings? [N]
```

## Passo 4: Configurar Variável de Ambiente

### Via CLI

```bash
vercel env add HERE_API_KEY
```

Cole sua chave HERE quando solicitado.

Selecione:

- [x] Production
- [x] Preview  
- [x] Development

### Via Dashboard

1. Acesse <https://vercel.com/dashboard>
2. Selecione seu projeto `geosaude`
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Name**: `HERE_API_KEY`
   - **Value**: `sua_chave_here`
   - **Environments**: Production, Preview, Development

## Passo 5: Configurar URL do Backend no Frontend

Edite `.env` e adicione:

```bash
# Backend Vercel
VITE_API_URL=https://geosaude.vercel.app/api

# HERE API (para desenvolvimento local com backend proxy)
HERE_API_KEY=sua_chave_here
```

## Passo 6: Fazer Deploy de Produção

```bash
vercel --prod
```

Sua aplicação estará em:

```
https://geosaude.vercel.app
```

## Estrutura de Arquivos

```
geosaude/
├── api/
│   ├── geocode.js          ← Proxy para 1 endereço
│   └── geocode-batch.js    ← Proxy para múltiplos
├── src/
│   └── services/
│       └── geocodingProxy.ts  ← Cliente do backend
├── vercel.json             ← Configuração Vercel
└── .env                    ← Variáveis (local)
```

## Testar Localmente

### Teste 1: Backend Local

```bash
vercel dev
```

Acesse: <http://localhost:3000>

### Teste 2: API Endpoint

```bash
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "Av Fernandes Lima, 100, Maceió, AL"}'
```

Resposta esperada:

```json
{
  "success": true,
  "lat": -9.64981,
  "lon": -35.73326,
  "display_name": "Avenida Fernandes Lima, 98, Farol, Maceió - AL",
  "matchLevel": "houseNumber"
}
```

## Uso no Frontend

### Importar serviço

```typescript
import { geocodeWithProxy } from '@/services/geocodingProxy';

// Geocodificar um endereço
const result = await geocodeWithProxy({
  rua: 'Av Fernandes Lima',
  numero: '100',
  bairro: 'Farol',
  cidade: 'Maceió',
  uf: 'AL',
  cep: '57050-000'
});

console.log(result);
// { success: true, lat: -9.64981, lon: -35.73326, ... }
```

### Batch

```typescript
import { geocodeBatchWithProxy } from '@/services/geocodingProxy';

const addresses = [
  { rua: 'Rua A', numero: '100', cidade: 'Maceió', uf: 'AL', ... },
  { rua: 'Rua B', numero: '200', cidade: 'Maceió', uf: 'AL', ... },
];

const results = await geocodeBatchWithProxy(
  addresses,
  (current, total) => console.log(`${current}/${total}`)
);
```

## Monitoramento

### Logs em Tempo Real

```bash
vercel logs
```

### Dashboard

<https://vercel.com/[seu-usuario]/geosaude/logs>

## Limites Gratuitos do Vercel

| Recurso | Limite Gratuito |
|---------|-----------------|
| **Requisições/Mês** | 100.000 |
| **Edge Functions** | 100 GB-horas |
| **Bandwidth** | 100 GB |
| **Duração Máxima** | 30s (Edge), 10s (Serverless) |

**Para GeoSaúde**:

- 100.000 requisições = ~3.333 geocodificações por dia
- Mais que suficiente para uso acadêmico/institucional

## Vantagens do Backend Proxy

### ✅ Segurança

| Antes (GitHub Pages) | Depois (Vercel Backend) |
|----------------------|-------------------------|
| ❌ Chave no bundle JS | ✅ Chave no servidor |
| ❌ Visível no DevTools | ✅ Inacessível ao cliente |
| ❌ Pode ser extraída | ✅ Protegida completamente |

### ✅ Controle

- **Rate Limiting**: Implementado no servidor
- **Logs**: Monitoramento de uso
- **Validação**: Previne abuso
- **Cache**: Pode ser implementado no Edge

### ✅ Flexibilidade

- **Múltiplas APIs**: Pode chamar HERE, Google, Nominatim
- **Fallback**: Se HERE falhar, tenta outra API
- **Transformação**: Normaliza respostas de APIs diferentes
- **Enriquecimento**: Adiciona dados extras

## Migração do Frontend

### Antes (direto para HERE)

```typescript
import { geocodeWithHere } from '@/services/hereGeocoding';
const result = await geocodeWithHere(address);
```

### Depois (via proxy)

```typescript
import { geocodeWithProxy } from '@/services/geocodingProxy';
const result = await geocodeWithProxy(addressParts);
```

## Fallback para Modo Local

Se o backend estiver indisponível:

```typescript
import { geocodeWithHere } from '@/services/hereGeocoding';
import { geocodeWithProxy, testBackendConnection } from '@/services/geocodingProxy';

const isBackendAvailable = await testBackendConnection();

const geocode = isBackendAvailable 
  ? geocodeWithProxy 
  : geocodeWithHere;

const result = await geocode(address);
```

## Alternativas ao Vercel

### Netlify Functions

Similar ao Vercel, também gratuito:

```javascript
// netlify/functions/geocode.js
exports.handler = async (event) => {
  const { address } = JSON.parse(event.body);
  // ... lógica igual
};
```

### Cloudflare Workers

Mais rápido (Edge computing):

```javascript
export default {
  async fetch(request) {
    // ... lógica igual
  }
}
```

### Firebase Functions

Integração com Firebase:

```javascript
const functions = require('firebase-functions');
exports.geocode = functions.https.onRequest(/* ... */);
```

## Troubleshooting

### Erro: "API key não configurada"

```bash
vercel env add HERE_API_KEY
[Cole sua chave]
vercel --prod
```

### Erro: CORS

Verifique headers no `api/geocode.js`:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

### Erro: Timeout

Aumente `maxDuration` no `vercel.json`:

```json
"functions": {
  "api/**/*.js": {
    "maxDuration": 60
  }
}
```

## Custos

### Cenário Real

- **50.000 geocodificações/mês**
- **HERE API**: Grátis (até 250k)
- **Vercel**: Grátis (até 100k req)
- **Total**: R$ 0,00/mês

### Se Ultrapassar

- **Vercel Pro**: US$ 20/mês (500k req)
- **HERE Paid**: US$ 0.0005/req (~US$ 25 para 50k extras)

## Próximos Passos

1. ✅ Deploy no Vercel
2. ✅ Configurar variável HERE_API_KEY
3. ✅ Testar endpoints
4. 🔄 Atualizar frontend para usar proxy
5. 🔄 Fazer novo deploy do frontend
6. ✅ Testar integração completa

---

**Documentação oficial**:

- Vercel: <https://vercel.com/docs>
- Vercel Functions: <https://vercel.com/docs/functions>
- Edge Functions: <https://vercel.com/docs/functions/edge-functions>

**Última atualização**: 22/10/2025
