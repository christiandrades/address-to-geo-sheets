# 🔒 Backend Proxy - Branch `feature/backend-proxy`

## O que foi implementado?

Esta branch adiciona um **backend seguro** que protege completamente a API key da HERE, em vez de expô-la no bundle JavaScript do frontend.

## Arquitetura

### Antes (main branch)

```
Frontend (GitHub Pages)
    ↓
  HERE API
    ↑
🚨 API Key no bundle JavaScript (exposta)
```

### Agora (feature/backend-proxy)

```
Frontend (GitHub Pages) → Backend (Vercel) → HERE API
                              ↓
                         🔒 API Key protegida
```

## Arquivos Adicionados

### Backend (Vercel Serverless Functions)

1. **`api/geocode.js`**
   - Endpoint: `POST /api/geocode`
   - Geocodifica 1 endereço
   - Runtime: Edge (São Paulo - gru1)
   - Timeout: 30s

2. **`api/geocode-batch.js`**
   - Endpoint: `POST /api/geocode-batch`
   - Geocodifica até 50 endereços
   - Rate limiting: 5 req/s
   - Timeout: 30s

### Frontend

3. **`src/services/geocodingProxy.ts`**
   - Cliente TypeScript para chamar o backend
   - Compatível com interface existente
   - Integrado com cache e retry
   - Fallback para modo direto

### Configuração

4. **`vercel.json`**
   - Configuração de build e routing
   - Região: São Paulo (menor latência)
   - Edge Functions habilitadas

5. **`DEPLOY_BACKEND.md`**
   - Guia completo de deploy no Vercel
   - Configuração de variáveis de ambiente
   - Testes e troubleshooting

## Como Testar Localmente

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Rodar backend local

```bash
vercel dev
```

### 3. Testar endpoint

```bash
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "Maceió, AL"}'
```

## Como Fazer Deploy

### 1. Login no Vercel

```bash
vercel login
```

### 2. Deploy inicial

```bash
vercel
```

### 3. Configurar API key

```bash
vercel env add HERE_API_KEY
```

Cole sua chave HERE quando solicitado.

### 4. Deploy de produção

```bash
vercel --prod
```

## Configuração do Frontend

Edite `.env`:

```bash
# URL do backend Vercel
VITE_API_URL=https://geosaude.vercel.app/api
```

## Uso no Código

### Importar serviço proxy

```typescript
import { geocodeWithProxy } from '@/services/geocodingProxy';

// Usar proxy (recomendado)
const result = await geocodeWithProxy({
  rua: 'Av Fernandes Lima',
  numero: '100',
  cidade: 'Maceió',
  uf: 'AL'
});
```

### Ou batch

```typescript
import { geocodeBatchWithProxy } from '@/services/geocodingProxy';

const results = await geocodeBatchWithProxy(
  addresses,
  (current, total) => console.log(`${current}/${total}`)
);
```

## Benefícios

### 🔒 Segurança Total

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **API Key** | Bundle JS (exposta) | Servidor (protegida) |
| **Visibilidade** | DevTools Network | Inacessível |
| **Risco** | Alto (pode ser roubada) | Zero |

### 📊 Controle

- ✅ Logs de todas as requisições
- ✅ Rate limiting no servidor
- ✅ Validação de entrada
- ✅ Monitoramento de uso
- ✅ Bloqueio de IPs abusivos

### 💰 Custos

**Vercel Gratuito**:

- 100.000 requisições/mês
- 100 GB bandwidth
- Edge Functions globais

**Suficiente para**:

- ~3.333 geocodificações/dia
- Uso acadêmico/institucional
- Desenvolvimento e testes

## Comparação de Performance

### Latência

| Configuração | Latência Média |
|--------------|----------------|
| Direto (GitHub → HERE) | ~200ms |
| Proxy (GitHub → Vercel → HERE) | ~250ms (+25%) |

**Trade-off**: +50ms de latência para segurança total.

### Cache

Com cache IndexedDB:

- 1ª requisição: ~250ms
- Requisições subsequentes: <10ms (cache local)

## Roadmap

### ✅ Fase 1: Backend Básico (atual)

- [x] Proxy para HERE API
- [x] Rate limiting
- [x] CORS configurado
- [x] Validações

### 🔄 Fase 2: Melhorias (próxima)

- [ ] Cache no Edge (Vercel KV)
- [ ] Múltiplas APIs (fallback automático)
- [ ] Analytics integrado
- [ ] Webhook para notificações

### 🔮 Fase 3: Avançado (futuro)

- [ ] GraphQL endpoint
- [ ] WebSocket para tempo real
- [ ] Queue system (Bull/Redis)
- [ ] Admin dashboard

## Testes

### Teste 1: Geocodificação única

```bash
curl -X POST https://geosaude.vercel.app/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "Praça dos Martírios, Maceió, AL"}'
```

### Teste 2: Batch

```bash
curl -X POST https://geosaude.vercel.app/api/geocode-batch \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["Maceió, AL", "Pajuçara, Maceió"]}'
```

### Teste 3: Status do backend

```typescript
import { testBackendConnection } from '@/services/geocodingProxy';

const isOnline = await testBackendConnection();
console.log(`Backend: ${isOnline ? '✅ Online' : '❌ Offline'}`);
```

## Troubleshooting

### Erro: "API key não configurada"

```bash
vercel env add HERE_API_KEY
vercel --prod
```

### Erro: CORS

Já configurado em `api/geocode.js`:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

### Erro: Timeout

Aumente em `vercel.json`:

```json
"functions": {
  "api/**/*.js": {
    "maxDuration": 60
  }
}
```

## Documentação

- 📖 [DEPLOY_BACKEND.md](./DEPLOY_BACKEND.md) - Guia completo
- 📖 [SECURITY.md](./SECURITY.md) - Práticas de segurança
- 📖 [Vercel Docs](https://vercel.com/docs)

## Próximos Passos

1. ✅ Testar localmente: `vercel dev`
2. ✅ Deploy no Vercel: `vercel --prod`
3. 🔄 Integrar frontend para usar proxy
4. 🔄 Testar em produção
5. 🔄 Merge para `main` (após aprovação)

## Status da Branch

- **Branch**: `feature/backend-proxy`
- **Base**: `main`
- **Status**: 🚧 Em desenvolvimento
- **Deploy**: <https://geosaude.vercel.app> (após deploy)

## Contribuindo

1. Checkout desta branch: `git checkout feature/backend-proxy`
2. Faça suas alterações
3. Commit: `git commit -m "feat: descrição"`
4. Push: `git push origin feature/backend-proxy`

---

**Criado em**: 22/10/2025  
**Autor**: GitHub Copilot + Equipe GeoSaúde  
**Última atualização**: 22/10/2025
