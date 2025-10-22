# 🔒 SECURITY.md - Boas Práticas de Segurança

## ⚠️ ACHADOS CRÍTICOS CORRIGIDOS

### 1. Chave API Exposta (CRÍTICO - RESOLVIDO)

**Problema**: A HERE API KEY estava hardcoded no código-fonte e versionada no repositório.

**Impacto**:

- ❌ Uso indevido por terceiros
- ❌ Bloqueio da conta por abuso
- ❌ Custos inesperados
- ❌ Risco de reputação

**Correção Aplicada**:

```typescript
// ❌ ANTES (INSEGURO)
const HERE_API_KEY = 'chave-exposta-aqui';

// ✅ AGORA (SEGURO)
const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

if (!HERE_API_KEY) {
  throw new Error('HERE API key não encontrada! Configure no .env');
}
```

**Ações Necessárias**:

1. ✅ Código atualizado para usar variáveis de ambiente
2. ⚠️ **VOCÊ DEVE**: Revogar/rotacionar a chave exposta em `developer.here.com`
3. ✅ `.env` adicionado ao `.gitignore`
4. ✅ `.env.example` atualizado com instruções

---

## 🛡️ MELHORIAS DE SEGURANÇA IMPLEMENTADAS

### 2. Retry com Backoff Exponencial

**Problema**: Retry simples sem controle, risco de loop infinito e ban por rate limit.

**Solução**: Sistema de resiliência com exponential backoff

```typescript
// Novo arquivo: src/lib/resilience.ts
await withBackoff(async () => {
  // sua requisição
}, {
  maxRetries: 5,
  initialDelay: 250,
  maxDelay: 8000,
  backoffMultiplier: 2
});
```

**Benefícios**:

- ✅ Evita sobrecarga de serviços
- ✅ Previne ban por rate limit
- ✅ Aumenta taxa de sucesso em falhas temporárias

### 3. Cache Local com IndexedDB

**Problema**: Requisições duplicadas para endereços já processados.

**Solução**: Cache inteligente com hash de endereços

```typescript
// Novo arquivo: src/services/geocodingCache.ts
const cached = await getCachedResult(addressParts);
if (cached) return cached; // Evita requisição

const result = await geocodeAPI(address);
await setCachedResult(addressParts, result); // Salva para futuro
```

**Benefícios**:

- ✅ Reduz custos de API
- ✅ Melhora performance
- ✅ Funciona offline para endereços conhecidos
- ✅ TTL de 90 dias com versionamento

### 4. Token Bucket para Rate Limiting

**Problema**: Rate limiting simples com setTimeout.

**Solução**: Token Bucket inteligente

```typescript
const rateLimiter = new TokenBucket(5, 5); // 5 tokens, 5/segundo
await rateLimiter.consume(); // Aguarda token disponível
// faz requisição
```

**Benefícios**:

- ✅ Respeita limites de API (5 req/s)
- ✅ Evita burst que causa throttling
- ✅ Distribui requisições uniformemente

### 5. User-Agent Correto (Nominatim)

**Problema**: User-Agent genérico violando política do Nominatim.

**Solução**: Identificação adequada

```typescript
// ❌ ANTES
'User-Agent': 'HealthGeocoder/1.0'

// ✅ AGORA
'User-Agent': 'GeoSaude/2.0 (UFAL; contato: github.com/christiandrades/geosaude)'
```

**Política Nominatim**:

- ✅ Identificação clara do projeto
- ✅ Informação de contato
- ⚠️ Limite: 1 req/segundo (use apenas como fallback)

### 6. Sanitização de Dados Sensíveis (LGPD)

**Problema**: CPF, CNS e outros dados sensíveis expostos em exportação KML.

**Solução**: Remoção/mascaramento de PII

```typescript
// ❌ ANTES: Expunha CPF completo
if (data.CPF) {
  html += `<p><strong>CPF:</strong> ${data.CPF}</p>`;
}

// ✅ AGORA: Removido completamente
// 🔒 REMOVIDO: CPF - Dado sensível (LGPD Art. 5º, II)

// Nome mascarado (apenas iniciais)
const nomeMascarado = nomePartes.length > 1 
  ? `${nomePartes[0]} ${nomePartes[nomePartes.length - 1].charAt(0)}.`
  : nomePartes[0].charAt(0) + '***';
```

**Dados Removidos da Exportação**:

- ❌ CPF (Art. 5º, II - dado pessoal sensível)
- ❌ CNS (Cartão Nacional de Saúde)
- ❌ Nome completo (mascarado para iniciais)

**Dados Mantidos** (necessários para geocodificação):

- ✅ Endereço (rua, número, bairro, cidade, UF, CEP)
- ✅ UBS (não identifica indivíduo)
- ✅ Comorbidade (agregada, sem identificação)

---

## 📋 CHECKLIST DE SEGURANÇA

### Para Desenvolvedores

- [ ] **NUNCA** commite arquivo `.env` com chaves reais
- [ ] Rotacione chaves se forem expostas acidentalmente
- [ ] Use variáveis de ambiente para TODAS as chaves/secrets
- [ ] Revise diffs antes de commit (busque por `apiKey`, `password`, etc.)
- [ ] Não exponha logs com dados sensíveis em produção

### Para Deploy

- [ ] Verifique se `.env` está no `.gitignore`
- [ ] Configure secrets no ambiente de CI/CD (GitHub Actions, etc.)
- [ ] Use HTTPS obrigatoriamente
- [ ] Habilite CORS apenas para domínios conhecidos
- [ ] Monitore uso de API para detectar abusos

### Para Produção "Séria"

⚠️ **Limitação do GitHub Pages**: É frontend-only, a chave API fica exposta no bundle JavaScript.

**Solução Recomendada**:

1. Crie um backend simples (Node.js, Python, etc.)
2. Backend chama a HERE API com chave protegida
3. Frontend chama seu backend (sem expor a chave)

**Exemplo de Arquitetura**:

```
Frontend (React)
    ↓ POST /api/geocode
Backend (Node.js + Express)
    ↓ chama HERE API (chave protegida)
HERE Geocoding API
```

---

## 🔐 LGPD - Lei Geral de Proteção de Dados

### Princípios Aplicados

1. **Minimização** (Art. 6º, III)
   - Processamos apenas o necessário para geocodificação
   - Endereço é suficiente, não precisamos de CPF/CNS

2. **Finalidade** (Art. 6º, I)
   - Dados coletados exclusivamente para geocodificação
   - Não compartilhamos com terceiros

3. **Segurança** (Art. 6º, VII)
   - Cache criptografado (hash SHA-256)
   - Dados sensíveis não exportados

4. **Transparência** (Art. 6º, VI)
   - Este documento explica o processamento
   - Usuário pode limpar cache a qualquer momento

### Base Legal

- **Art. 7º, I**: Consentimento do titular
- **Art. 11, II, f**: Tutela da saúde (dados sensíveis)

### Retenção de Dados

| Dado | Tempo | Justificativa |
|------|-------|---------------|
| Cache de geocodificação | 90 dias | Performance |
| Arquivos CSV processados | Memória | Não persistido |
| Exportação KML | Usuário decide | Download local |

### Direitos do Titular

- ✅ **Excluir cache**: Função `clearCache()` disponível
- ✅ **Portabilidade**: Exportar CSV/KML
- ✅ **Correção**: Reprocessar endereços

---

## 🚨 INCIDENTES E RESPOSTAS

### Se Chave API Foi Exposta

1. **Imediato** (< 1 hora):
   - Acesse <https://developer.here.com>
   - Revogue a chave exposta
   - Gere nova chave

2. **Curto prazo** (< 24 horas):
   - Verifique logs de uso da chave
   - Identifique uso não autorizado
   - Atualize `.env` com nova chave

3. **Médio prazo** (< 7 dias):
   - Revise histórico git (`git log -p | grep apiKey`)
   - Considere reescrever histórico se necessário
   - Force push após limpeza (se repositório privado)

### Se Dados Pessoais Foram Expostos

1. **Notificação** (Art. 48 LGPD):
   - Comunicar à ANPD em até 72 horas
   - Informar titulares afetados
   - Documentar o incidente

2. **Mitigação**:
   - Remover dados expostos imediatamente
   - Revisar logs de acesso
   - Implementar controles adicionais

3. **Prevenção**:
   - Sanitização obrigatória em exportações
   - Code review focado em privacidade
   - Testes automatizados para PII

---

## 📚 REFERÊNCIAS

### Segurança

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla Web Security](https://infosec.mozilla.org/guidelines/web_security)
- [CWE-798: Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)

### LGPD

- [Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia ANPD](https://www.gov.br/anpd/pt-br)

### APIs

- [HERE Developer](https://developer.here.com/documentation)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)

---

## 📞 CONTATO

**Questões de Segurança**: Abra uma issue privada no GitHub  
**LGPD/Privacidade**: Contate o DPO da instituição  
**Bugs**: <https://github.com/christiandrades/geosaude/issues>

---

**Última Atualização**: 22/10/2025  
**Versão**: 2.0  
**Responsável**: Equipe GeoSaúde UFAL
