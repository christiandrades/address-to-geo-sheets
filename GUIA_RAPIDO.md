# ⚡ Guia Rápido - 5 Minutos

## 🚀 Início Imediato

```bash
npm install
npm run dev
```

Acesse: `http://localhost:8080`

## 📊 Preparar Planilha

### Colunas Necessárias

```text
rua, numero, bairro, cidade, uf, cep
```

### Exemplo CSV

```csv
rua,numero,bairro,cidade,uf,cep
Rua das Flores,123,Centro,São Paulo,SP,01310-100
```

## 🎯 3 Passos Simples

### 1️⃣ Upload

- Arraste CSV/XLSX
- Sistema valida automaticamente

### 2️⃣ Geocodificar

- Clique "Iniciar Geocodificação Automática"
- Aguarde (não feche navegador)

### 3️⃣ Baixar

- **KML** → Google Earth
- **XLSX** → Excel com lat/lng

## ⏱️ Tempo Estimado

| Endereços | Tempo |
|-----------|-------|
| 1.000 | ~3 min |
| 10.000 | ~33 min |
| 55.593 | ~3 horas |

**Fórmula:** `quantidade / 5 / 60 = minutos`

## 🗺️ Ver no Google Earth

1. Baixe KML
2. Abra Google Earth Pro
3. Arraste arquivo KML
4. Pronto! 🟢 = Sucesso | 🔴 = Falha

## 🔑 API Key (Já Configurada)

```text
scjJzHjgoa1K-e2vAO-iu6hQveH-Vpg_8ii0PBTcjFc
```

**Limites:**

- 250k requisições/mês
- 5 req/segundo

## 🐛 Problemas Comuns

### Erro nas colunas

→ Renomeie para: `rua, cidade, uf, cep`

### Lento demais

→ Normal! 5 req/s é o máximo

### KML não abre

→ Use Google Earth **Pro** (gratuito)

### Endereços falharam

→ Verifique dados: CEP, rua, número

## 🚀 Deploy Produção

### Vercel (1 minuto)

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📁 Arquivos Importantes

```text
/src/
├── services/hereGeocoding.ts  ← Trocar API key aqui
├── services/kmlExport.ts      ← Customizar KML
├── pages/AutoGeocoding.tsx    ← Interface principal
```

## 🎨 Customizações Rápidas

### Trocar API Key

`src/services/hereGeocoding.ts` → linha 4:

```typescript
const HERE_API_KEY = 'sua-chave-aqui';
```

### Alterar Ícones KML

`src/services/kmlExport.ts` → linhas 25-35:

```typescript
// Verde: grn-pushpin.png
// Vermelho: red-pushpin.png
// Amarelo: ylw-pushpin.png
// Azul: blue-pushpin.png
```

### Mudar Rate Limit

`src/services/hereGeocoding.ts` → linha 7:

```typescript
const RATE_LIMIT = 5; // Máx: 5
```

## 📞 Ajuda Rápida

- **README completo:** `README.md`
- **Guia detalhado:** `GUIA_COMPLETO.md`
- **API HERE:** [developer.here.com](https://developer.here.com)
- **KML Docs:** [developers.google.com/kml](https://developers.google.com/kml)

## ✅ Checklist Final

Antes de processar grandes volumes:

- [ ] Planilha tem colunas corretas
- [ ] API key configurada
- [ ] Testado com 10-20 endereços
- [ ] Computador não vai desligar
- [ ] Internet estável
- [ ] Google Earth instalado

## 🎯 Resultados Esperados

✅ Taxa de sucesso típica: **85-95%**

Falhas comuns:

- Endereço incompleto
- CEP errado
- Rua não cadastrada

---

## 🚀 Conclusão

Pronto para processar 55.593 endereços? GO!
