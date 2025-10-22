# 🗺️ GeoSaúde - Sistema de Geocodificação Automática

Sistema completo de geocodificação de endereços em lote, com conversão automática para KML compatível com Google Earth.

> **🔒 IMPORTANTE - SEGURANÇA**  
> Antes de usar, leia [SECURITY.md](./SECURITY.md) para configuração segura da API key.  
> **NUNCA** commite arquivos `.env` com chaves reais!

## ✨ Características

- ✅ **100% Automático** - Sem necessidade de cliques manuais entre lotes
- 🚀 **HERE Geocoding API** - 250.000 requisições/mês gratuitas
- 📊 **Suporte CSV e XLSX** - Leitura inteligente de planilhas
- 🌍 **Exportação KML** - Visualização direta no Google Earth
- 📈 **Progresso em tempo real** - Logs detalhados e estatísticas
- ⚡ **Rate Limit Controlado** - 5 req/s automático com retry
- 🎯 **Ícones por Status** - Verde (sucesso) e Vermelho (falha)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm
- Arquivo CSV ou XLSX com endereços

### Instalação

```bash
# Clone o repositório
git clone https://github.com/christiandrades/geosaude.git
cd geosaude

# Instale dependências
npm install

# Configure a API key (OBRIGATÓRIO)
cp .env.example .env
# Edite .env e adicione sua HERE API key

# Execute em desenvolvimento
npm run dev

# Build para produção
npm run build

# Deploy para GitHub Pages
npm run deploy
```

**⚠️ CRÍTICO**: Sem o arquivo `.env` configurado, a aplicação não funcionará!

### Acesse

Abra [http://localhost:8080](http://localhost:8080) no navegador

## 📋 Formato da Planilha

### Colunas Obrigatórias

O sistema detecta automaticamente variações de nomes. Use qualquer um destes:

| Campo | Nomes Aceitos |
|-------|---------------|
| Rua | `rua`, `logradouro`, `endereco`, `endereço`, `street` |
| Número | `numero`, `número`, `num`, `n°` |
| Bairro | `bairro`, `neighborhood` |
| Cidade | `cidade`, `municipio`, `município`, `city` |
| UF | `uf`, `estado`, `state` |
| CEP | `cep`, `postal code`, `zip code` |

### Exemplo CSV

```csv
rua,numero,bairro,cidade,uf,cep,nome
Rua das Flores,123,Centro,São Paulo,SP,01310-100,João Silva
Av. Paulista,1000,Bela Vista,São Paulo,SP,01310-100,Maria Santos
```

### Exemplo XLSX

Crie planilha Excel com mesmas colunas acima.

## 🎯 Como Usar

### 1. Upload do Arquivo

- Arraste CSV/XLSX ou clique para selecionar
- Sistema valida e lê automaticamente
- Mostra quantidade de endereços detectados

### 2. Geocodificação Automática

- Clique em **"Iniciar Geocodificação Automática"**
- Processo roda sem interrupções
- Barra de progresso em tempo real
- Estatísticas atualizadas durante execução

### 3. Exportação

**KML para Google Earth:**

- Clique em **"Baixar KML"**
- Abra no Google Earth
- 🟢 Ícones verdes = Sucessos
- � Ícones vermelhos = Falhas

**Planilha com Coordenadas:**

- Clique em **"Baixar Planilha"**
- Excel com colunas `latitude` e `longitude`
- Mantém todos dados originais

## ⚙️ API Configuration

### HERE API Key (Já Configurada)

```text
scjJzHjgoa1K-e2vAO-iu6hQveH-Vpg_8ii0PBTcjFc
```

**Limites:**

- 250.000 requisições/mês grátis
- 5 requisições por segundo
- Rate limit automático

### Trocar API Key

Edite `src/services/hereGeocoding.ts`:

```typescript
const HERE_API_KEY = 'SUA_CHAVE_AQUI';
```

Obtenha chave grátis em: [developer.here.com](https://developer.here.com)

## 📊 Tempo de Processamento

| Endereços | Tempo Estimado |
|-----------|----------------|
| 100 | ~0.3 min |
| 1.000 | ~3.3 min |
| 10.000 | ~33 min |
| 55.593 | ~3 horas |

**Nota:** Rate limit de 5 req/s (200ms entre requisições)

## 🌐 Deploy

### Vercel (Recomendado)

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
npm run build
# Configure GitHub Pages para pasta /dist
```

## 🏗️ Estrutura do Projeto

```text
/src/
├── services/
│   ├── hereGeocoding.ts      # Integração HERE API
│   ├── kmlExport.ts          # Geração KML
│   ├── fileReader.ts         # Leitura CSV/XLSX
│   └── geocodingMultiple.ts  # APIs alternativas
├── pages/
│   ├── AutoGeocoding.tsx     # Página principal
│   └── Index.tsx             # Modo manual (legado)
├── components/
│   ├── FileUpload.tsx
│   ├── ProgressBar.tsx
│   └── ui/                   # shadcn/ui components
└── types/
    └── patient.ts            # TypeScript types
```

## 🔧 Desenvolvimento

### Comandos Disponíveis

```bash
npm run dev          # Dev server (porta 8080)
npm run build        # Build produção
npm run preview      # Preview do build
npm run lint         # Lint código
```

### Variáveis de Ambiente

Crie `.env` (opcional):

```env
VITE_HERE_API_KEY=scjJzHjgoa1K-e2vAO-iu6hQveH-Vpg_8ii0PBTcjFc
```

Use no código:

```typescript
const apiKey = import.meta.env.VITE_HERE_API_KEY;
```

## 📦 Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build ultra-rápido)
- **shadcn/ui** + **Tailwind CSS**
- **PapaParse** (CSV) + **XLSX** (Excel)
- **HERE Geocoding API**

## 🐛 Troubleshooting

### Erro: "Nenhum endereço válido encontrado"

- Verifique se colunas têm nomes corretos
- Use formato CSV com separador `,`
- Certifique-se que há pelo menos: rua, cidade, UF

### Geocodificação lenta

- Normal: 5 req/s é o limite da API
- Para 55k endereços: ~3 horas
- Não feche navegador durante processo

### KML não abre no Google Earth

- Certifique-se de usar Google Earth Pro
- Arquivo deve ter extensão `.kml`
- Tente arrastar arquivo para Google Earth

### Rate Limit Error (429)

- Sistema faz retry automático
- Aguarda 1 segundo e tenta novamente
- Se persistir, API key pode ter atingido limite mensal

## � Formato do KML

### Estrutura

```xml
<kml>
  <Document>
    <Folder name="Sucessos">
      <Placemark>
        <name>Nome do Local</name>
        <description>Detalhes HTML</description>
        <Point>
          <coordinates>lon,lat,0</coordinates>
        </Point>
      </Placemark>
    </Folder>
    <Folder name="Falhas">
      <!-- Endereços que falharam -->
    </Folder>
  </Document>
</kml>
```

### Dados Incluídos

- ✅ Nome do ponto
- 📍 Coordenadas (lat/lng)
- 🏠 Endereço original completo
- ✔️ Status da geocodificação
- 📊 Match level (precisão)
- ℹ️ Todos campos extras da planilha

## 🤝 Contribuição

1. Fork o projeto
2. Crie branch (`git checkout -b feature/NovaFeature`)
3. Commit (`git commit -m 'Add NovaFeature'`)
4. Push (`git push origin feature/NovaFeature`)
5. Abra Pull Request

## 📄 Licença

MIT - Use livremente!

## 🆘 Suporte

- 📧 Issues no GitHub
- 📚 [Documentação HERE API](https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html)
- 🌍 [Google Earth KML Reference](https://developers.google.com/kml/documentation)

---

Desenvolvido com ❤️ para processamento de dados geográficos em larga escala.
